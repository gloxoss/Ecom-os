import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

/**
 * Shared configuration and guards for the isolated restore service.
 *
 * The whole point of this module is that the restore target is a *separate MySQL
 * service*, not a database name on the source service. Every connection this code
 * makes is pinned to the isolation port below; nothing here can reach port 3308,
 * which belongs to someone else.
 */

/** The only port the isolated restore service may listen on. Never 3308. */
export const ISOLATION_PORT = 3309;
export const ISOLATION_HOST = '127.0.0.1';

export const DEFAULT_TARGET_SCHEMA = 'restore_target';
export const DEFAULT_RESTRICTED_USER = 'restore_importer';

/**
 * The complete privilege set the importing identity may hold, on the target schema
 * and nowhere else. Deliberately absent: GRANT OPTION, FILE, SUPER, CREATE USER,
 * PROCESS, RELOAD, SHUTDOWN, TRIGGER, EVENT, CREATE ROUTINE, ALTER ROUTINE.
 */
export const TARGET_PRIVILEGES = [
  'SELECT',
  'INSERT',
  'UPDATE',
  'DELETE',
  'CREATE',
  'DROP',
  'ALTER',
  'INDEX',
  'REFERENCES',
  'CREATE TEMPORARY TABLES',
  'LOCK TABLES',
] as const;

/** Privileges that must never appear in the restricted user's effective grants. */
export const FORBIDDEN_PRIVILEGES = [
  'GRANT OPTION',
  'FILE',
  'SUPER',
  'CREATE USER',
  'PROCESS',
  'RELOAD',
  'SHUTDOWN',
  'REPLICATION SLAVE',
  'REPLICATION CLIENT',
  'TRIGGER',
  'EVENT',
  'CREATE ROUTINE',
  'ALTER ROUTINE',
  'EXECUTE',
  'SHOW DATABASES',
] as const;

/**
 * Statements this tool must never emit. Destructive cleanup is not authorized
 * anywhere, including teardown and tests. Tests assert module sources contain none
 * of these; the runtime guard rejects any generated SQL that matches.
 */
export const FORBIDDEN_SQL = [
  /\bDROP\s+DATABASE\b/i,
  /\bDROP\s+TABLE\b/i,
  /\bDROP\s+USER\b/i,
  /\bDROP\s+SCHEMA\b/i,
  /\bTRUNCATE\b/i,
  /\bDELETE\s+FROM\b/i,
] as const;

export class IsolationError extends Error {
  readonly gate: string;

  constructor(gate: string, message: string) {
    super(`[${gate}] ${message}`);
    this.name = 'IsolationError';
    this.gate = gate;
  }
}

export interface MysqlConnection {
  /** Connection label used in messages. Never carries a secret. */
  label: string;
  host: string;
  port: number;
  user: string;
  /** Held in memory only; never logged, never written to disk. */
  password?: string;
  database?: string;
}

const MYSQL_EXECUTABLES = ['mysqld.exe', 'mysql.exe', 'mysqldump.exe', 'mysqladmin.exe'] as const;

function binDirLooksUsable(dir: string): boolean {
  if (!dir || !fs.existsSync(dir)) return false;
  return MYSQL_EXECUTABLES.every((name) => fs.existsSync(path.join(dir, name)));
}

function candidateBinDirs(explicit?: string): string[] {
  const candidates: string[] = [];
  if (explicit) candidates.push(explicit);

  const fromEnvDir = process.env.ECOM_OS_MYSQL_BIN_DIR;
  if (fromEnvDir) candidates.push(fromEnvDir);

  const fromEnvBin = process.env.ECOM_OS_MYSQL_BIN;
  if (fromEnvBin) candidates.push(path.dirname(fromEnvBin));

  const seed = path.join(
    process.env.APPDATA ?? '',
    'Local',
    'lightning-services',
    'mysql-8.4.0+2',
    'bin',
    'win64',
    'bin',
  );
  if (process.env.APPDATA) candidates.push(seed);

  const root = process.env.APPDATA
    ? path.join(process.env.APPDATA, 'Local', 'lightning-services')
    : '';
  if (root && fs.existsSync(root)) {
    for (const entry of fs.readdirSync(root).sort()) {
      if (!entry.startsWith('mysql-')) continue;
      candidates.push(path.join(root, entry, 'bin', 'win64', 'bin'));
    }
  }
  return candidates;
}

/** Resolve the directory holding mysqld.exe/mysql.exe/mysqldump.exe/mysqladmin.exe. */
export function resolveMysqlBinDir(explicit?: string): string | null {
  for (const candidate of candidateBinDirs(explicit)) {
    if (binDirLooksUsable(candidate)) return candidate;
  }
  return null;
}

/** mysqld's --basedir is the directory *containing* bin/, i.e. the parent of bin/. */
export function resolveMysqlBaseDir(binDir: string): string {
  return path.dirname(binDir);
}

export function executableIn(binDir: string, name: string): string {
  return path.join(binDir, name.endsWith('.exe') ? name : `${name}.exe`);
}

export interface RunPaths {
  runId: string;
  runDir: string;
  datadir: string;
  fileTransferDir: string;
  pidFile: string;
  logFile: string;
  stateFile: string;
}

function isolationRoot(): string {
  const configured = process.env.ECOM_OS_RESTORE_ISOLATION_ROOT;
  if (configured && configured.trim()) return path.resolve(configured);
  return path.join(os.tmpdir(), 'ecomos-restore-isolation');
}

/**
 * Reserve a fresh run directory. The data directory lives here and is left in place
 * after teardown: nothing deletes it.
 */
export function createRunPaths(rootOverride?: string): RunPaths {
  const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto
    .randomBytes(4)
    .toString('hex')}`;
  const runDir = path.join(rootOverride ?? isolationRoot(), runId);
  const paths: RunPaths = {
    runId,
    runDir,
    datadir: path.join(runDir, 'data'),
    fileTransferDir: path.join(runDir, 'file-transfer'),
    pidFile: path.join(runDir, 'mysqld.pid'),
    logFile: path.join(runDir, 'mysqld.log'),
    stateFile: path.join(runDir, 'isolation-state.json'),
  };
  fs.mkdirSync(paths.runDir, { recursive: true });
  fs.mkdirSync(paths.fileTransferDir, { recursive: true });
  return paths;
}

/** Password for the restricted user: URL-safe alphabet, safe to inline in quoted SQL. */
export function generateRestrictedPassword(): string {
  return crypto.randomBytes(24).toString('base64url');
}

/**
 * Remove secret values from any text before it is logged or placed in a report.
 * A password must never appear in output, including inside a driver error message.
 */
export function scrubSecrets(text: string, secrets: Array<string | undefined>): string {
  let out = text;
  for (const secret of secrets) {
    if (!secret || secret.length < 4) continue;
    out = out.split(secret).join('[redacted]');
  }
  return out;
}

export function describeConnection(conn: MysqlConnection): string {
  return `${conn.user}@${conn.host}:${conn.port}${conn.database ? `/${conn.database}` : ''}`;
}

/**
 * Hard guard: this tool only ever talks to the isolated service on ISOLATION_PORT.
 * A connection descriptor pointing anywhere else is a programming error, and the
 * failure is loud rather than silent — a mis-wired port is how the source gets hit.
 */
export function assertIsolationConnection(conn: MysqlConnection): void {
  if (conn.port !== ISOLATION_PORT || conn.host !== ISOLATION_HOST) {
    throw new IsolationError(
      'connection-target',
      `Refusing to connect to ${describeConnection(conn)}: the restore target must be ` +
        `${ISOLATION_HOST}:${ISOLATION_PORT} only (port 3308 is not ours).`,
    );
  }
}

/** Reject any generated SQL containing a destructive statement. */
export function assertNonDestructiveSql(sql: string): void {
  for (const pattern of FORBIDDEN_SQL) {
    if (pattern.test(sql)) {
      throw new IsolationError(
        'non-destructive-sql',
        `Generated SQL matched a forbidden destructive statement: ${String(pattern)}`,
      );
    }
  }
}

export function buildClientArgs(conn: MysqlConnection, extra: Array<string> = []): string[] {
  const args = [
    '--no-defaults',
    '--protocol=TCP',
    `--host=${conn.host}`,
    `--port=${conn.port}`,
    `--user=${conn.user}`,
    // caching_sha2_password over plain TCP needs the server public key; this is the
    // local loopback of a service we started, not a remote hop.
    '--get-server-public-key',
    '--local-infile=0',
    '--batch',
    '--skip-column-names',
  ];
  if (conn.database) args.push(`--database=${conn.database}`);
  return [...args, ...extra];
}

/** Env for a client call. The password travels in MYSQL_PWD, never in argv. */
export function buildClientEnv(conn: MysqlConnection): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  if (conn.password !== undefined) env.MYSQL_PWD = conn.password;
  else delete env.MYSQL_PWD;
  return env;
}

export interface SqlRunResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  error: string | null;
}

/**
 * Run SQL over the isolated target connection with the statement supplied on stdin,
 * so a password inside the statement never appears in the process argument list.
 */
export function runSql(
  conn: MysqlConnection,
  sql: string,
  opts: { binDir: string; allowDestructive?: boolean },
): SqlRunResult {
  assertIsolationConnection(conn);
  if (!opts.allowDestructive) assertNonDestructiveSql(sql);
  const bin = executableIn(opts.binDir, 'mysql.exe');
  try {
    const stdout = execFileSync(bin, buildClientArgs(conn), {
      input: sql,
      encoding: 'utf8',
      env: buildClientEnv(conn),
      // Capture stderr instead of letting it inherit: nothing the client prints should
      // reach the console unfiltered, and a statement echo must never leak.
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 256 * 1024 * 1024,
      windowsHide: true,
    });
    return { ok: true, stdout: (stdout ?? '').trim(), stderr: '', error: null };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    const stderr = scrubSecrets(String(err.stderr ?? ''), [conn.password]).trim();
    const stdout = scrubSecrets(String(err.stdout ?? ''), [conn.password]).trim();
    const message = scrubSecrets(err.message ?? String(error), [conn.password]);
    return {
      ok: false,
      stdout,
      stderr: stderr || message,
      error: stderr || message,
    };
  }
}

/** Single scalar query over the target connection. Throws on failure. */
export function scalar(conn: MysqlConnection, sql: string, binDir: string): string {
  const result = runSql(conn, sql, { binDir });
  if (!result.ok) {
    throw new IsolationError('query-failed', `Query failed on ${describeConnection(conn)}: ${result.error}`);
  }
  return result.stdout;
}

export function scalarNumber(conn: MysqlConnection, sql: string, binDir: string): number {
  const raw = scalar(conn, sql, binDir);
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

/** Rows as string arrays (tab-separated --batch output, one row per line). */
export function queryRows(conn: MysqlConnection, sql: string, binDir: string): string[][] {
  const raw = scalar(conn, sql, binDir);
  if (!raw) return [];
  return raw.split(/\r?\n/).map((line) => line.split('\t'));
}

/** True when something is listening on host:port. A timeout counts as busy (fail closed). */
export async function isPortListening(port: number, host = ISOLATION_HOST): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    let settled = false;
    const done = (value: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(1500);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(true));
    socket.once('error', () => done(false));
  });
}

/** Fail closed if the isolation port is occupied by a service we did not start. */
export async function assertIsolationPortFree(port = ISOLATION_PORT): Promise<void> {
  if (await isPortListening(port)) {
    throw new IsolationError(
      'port-free',
      `Refusing to provision: something is already listening on ${ISOLATION_HOST}:${port}. ` +
        'That service is not ours; the isolation port must be free before we start.',
    );
  }
}

/** Windows path normalisation for @@datadir comparison (case, separators, trailing slash). */
export function normaliseFsPath(value: string): string {
  let resolved = value.trim();
  try {
    resolved = fs.realpathSync.native(resolved);
  } catch {
    // Path may not exist yet; fall back to the literal value.
  }
  return resolved.replace(/[\\/]+/g, '/').replace(/\/+$/, '').toLowerCase();
}
