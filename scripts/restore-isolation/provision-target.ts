import fs from 'node:fs';
import { spawn, execFileSync, type ChildProcess } from 'node:child_process';

import {
  DEFAULT_RESTRICTED_USER,
  DEFAULT_TARGET_SCHEMA,
  ISOLATION_HOST,
  ISOLATION_PORT,
  IsolationError,
  TARGET_PRIVILEGES,
  assertIsolationConnection,
  assertIsolationPortFree,
  assertNonDestructiveSql,
  createRunPaths,
  describeConnection,
  executableIn,
  generateRestrictedPassword,
  normaliseFsPath,
  resolveMysqlBaseDir,
  resolveMysqlBinDir,
  runSql,
  scalar,
  scrubSecrets,
  type MysqlConnection,
  type RunPaths,
} from './config.ts';

export interface ProvisionedService {
  runId: string;
  runDir: string;
  datadir: string;
  fileTransferDir: string;
  port: number;
  host: string;
  binDir: string;
  baseDir: string;
  mysqldPath: string;
  pidFile: string;
  logFile: string;
  stateFile: string;
  pid: number | null;
  /** Root here means "root of the service we just started", nothing else. */
  rootConnection: MysqlConnection;
  startedAt: string;
  child: ChildProcess | null;
}

export interface ProvisionOptions {
  mysqlBinDir?: string | undefined;
  runRoot?: string | undefined;
  /** Readiness timeout for `mysqld` startup. */
  readyTimeoutMs?: number | undefined;
}

function appendLog(logFile: string, text: string): void {
  try {
    fs.appendFileSync(logFile, `${text}\n`);
  } catch {
    // Logging must never be the reason a restore fails.
  }
}

function initialiseDataDirectory(service: Omit<ProvisionedService, 'pid' | 'child'>): void {
  const args = [
    '--no-defaults',
    '--initialize-insecure',
    `--basedir=${service.baseDir}`,
    `--datadir=${service.datadir}`,
    `--secure-file-priv=${service.fileTransferDir}`,
  ];
  try {
    const output = execFileSync(service.mysqldPath, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      timeout: 180000,
    });
    appendLog(service.logFile, `--- mysqld --initialize-insecure ---\n${output}`);
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    const detail = `${err.stdout ?? ''}\n${err.stderr ?? ''}`.trim() || err.message || String(error);
    appendLog(service.logFile, `--- mysqld --initialize-insecure FAILED ---\n${detail}`);
    throw new IsolationError(
      'initialize-datadir',
      `Could not initialise a fresh data directory with mysqld --initialize-insecure: ${detail}`,
    );
  }
  if (!fs.existsSync(service.datadir)) {
    throw new IsolationError(
      'initialize-datadir',
      `mysqld reported success but ${service.datadir} does not exist.`,
    );
  }
}

function startMysqld(service: Omit<ProvisionedService, 'pid' | 'child'>): ChildProcess {
  const args = [
    '--no-defaults',
    `--basedir=${service.baseDir}`,
    `--datadir=${service.datadir}`,
    `--port=${ISOLATION_PORT}`,
    // Loopback only. This service is never reachable from off-host and never on 3308.
    `--bind-address=${ISOLATION_HOST}`,
    `--pid-file=${service.pidFile}`,
    `--secure-file-priv=${service.fileTransferDir}`,
    '--local-infile=0',
    '--skip-log-bin',
    '--mysqlx=0',
    '--console',
    `--log-error=${service.logFile}`,
  ];

  const logFd = fs.openSync(service.logFile, 'a');
  try {
    const child = spawn(service.mysqldPath, args, {
      stdio: ['ignore', logFd, logFd],
      windowsHide: true,
      detached: false,
    });
    return child;
  } finally {
    fs.closeSync(logFd);
  }
}

async function waitForReady(
  conn: MysqlConnection,
  binDir: string,
  service: { logFile: string; child: ChildProcess | null },
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError = 'no attempt made';
  while (Date.now() < deadline) {
    if (service.child && service.child.exitCode !== null) {
      throw new IsolationError(
        'service-start',
        `mysqld exited with code ${service.child.exitCode} before becoming ready. See ${service.logFile}.`,
      );
    }
    const probe = runSql(conn, 'SELECT 1', { binDir });
    if (probe.ok) return;
    lastError = probe.error ?? lastError;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new IsolationError(
    'service-start',
    `mysqld did not answer on ${ISOLATION_HOST}:${ISOLATION_PORT} within ${timeoutMs}ms ` +
      `(${lastError}). See ${service.logFile}.`,
  );
}

/**
 * Provision a brand-new, empty, loopback-only MySQL service on port 3309.
 *
 * This is the only place store-level work happens, and it only ever talks to the
 * service it just started. The data directory is fresh; nothing is dropped or
 * overwritten, and the port is proved free first so we never adopt a stranger's
 * service.
 */
export async function provisionTargetService(
  options: ProvisionOptions = {},
): Promise<ProvisionedService> {
  const binDir = resolveMysqlBinDir(options.mysqlBinDir);
  if (!binDir) {
    throw new IsolationError(
      'mysql-binaries',
      'mysqld/mysql/mysqldump/mysqladmin were not found. Set ECOM_OS_MYSQL_BIN_DIR to the ' +
        'directory containing mysqld.exe, or pass --mysql-bin-dir.',
    );
  }

  // Fail closed before doing anything else: 3309 must be free.
  await assertIsolationPortFree(ISOLATION_PORT);

  const paths: RunPaths = createRunPaths(options.runRoot);
  const service: Omit<ProvisionedService, 'pid' | 'child'> = {
    runId: paths.runId,
    runDir: paths.runDir,
    datadir: paths.datadir,
    fileTransferDir: paths.fileTransferDir,
    port: ISOLATION_PORT,
    host: ISOLATION_HOST,
    binDir,
    baseDir: resolveMysqlBaseDir(binDir),
    mysqldPath: executableIn(binDir, 'mysqld.exe'),
    pidFile: paths.pidFile,
    logFile: paths.logFile,
    stateFile: paths.stateFile,
    rootConnection: {
      // `root` of the service we are about to start, reachable only on 3309 with the
      // empty password --initialize-insecure gives it. Used only to create the target
      // schema and the restricted user.
      label: 'isolation-root',
      host: ISOLATION_HOST,
      port: ISOLATION_PORT,
      user: 'root',
    },
    startedAt: new Date().toISOString(),
  };

  initialiseDataDirectory(service);
  const child = startMysqld(service);
  const provisioned: ProvisionedService = { ...service, pid: child.pid ?? null, child };

  // Record non-secret state so an operator can find the data directory after a crash.
  fs.writeFileSync(
    provisioned.stateFile,
    JSON.stringify(
      {
        runId: provisioned.runId,
        datadir: provisioned.datadir,
        fileTransferDir: provisioned.fileTransferDir,
        port: provisioned.port,
        host: provisioned.host,
        pid: provisioned.pid,
        startedAt: provisioned.startedAt,
        logFile: provisioned.logFile,
      },
      null,
      2,
    ),
  );

  await waitForReady(provisioned.rootConnection, binDir, provisioned, options.readyTimeoutMs ?? 60000);

  if (fs.existsSync(provisioned.pidFile)) {
    const pidFromFile = Number.parseInt(fs.readFileSync(provisioned.pidFile, 'utf8').trim(), 10);
    if (Number.isFinite(pidFromFile) && pidFromFile > 0) provisioned.pid = pidFromFile;
  }

  return provisioned;
}

export interface TargetSchemaOptions {
  schema?: string;
  user?: string;
  password?: string;
}

export interface TargetAccess {
  connection: MysqlConnection;
  schema: string;
  user: string;
  password: string;
}

/**
 * Create the target schema and a restricted user whose grants are target-only.
 *
 * `CREATE DATABASE IF NOT EXISTS`, `CREATE USER IF NOT EXISTS` and `GRANT` are the
 * only writes here. No `DROP`, no `REVOKE` of anyone else's access, no global grant.
 */
export function createTargetSchemaAndUser(
  service: ProvisionedService,
  options: TargetSchemaOptions = {},
): TargetAccess {
  assertIsolationConnection(service.rootConnection);
  const schema = options.schema ?? DEFAULT_TARGET_SCHEMA;
  const user = options.user ?? DEFAULT_RESTRICTED_USER;
  const password = options.password ?? generateRestrictedPassword();

  if (!/^[A-Za-z0-9_]+$/.test(schema)) {
    throw new IsolationError('target-schema-name', `Target schema must match [A-Za-z0-9_]+: ${schema}`);
  }
  if (!/^[A-Za-z0-9_]+$/.test(user)) {
    throw new IsolationError('target-user-name', `Restricted user must match [A-Za-z0-9_]+: ${user}`);
  }

  const privilegeList = TARGET_PRIVILEGES.join(', ');
  // The connection host resolves to either `localhost` or `127.0.0.1` depending on
  // reverse DNS, so both identities exist with identical, target-only grants.
  const statements = [
    `CREATE DATABASE IF NOT EXISTS \`${schema}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    `CREATE USER IF NOT EXISTS '${user}'@'localhost' IDENTIFIED BY '${password}';`,
    `CREATE USER IF NOT EXISTS '${user}'@'127.0.0.1' IDENTIFIED BY '${password}';`,
    `GRANT ${privilegeList} ON \`${schema}\`.* TO '${user}'@'localhost';`,
    `GRANT ${privilegeList} ON \`${schema}\`.* TO '${user}'@'127.0.0.1';`,
  ].join('\n');

  assertNonDestructiveSql(statements);
  const result = runSql(service.rootConnection, statements, { binDir: service.binDir });
  if (!result.ok) {
    throw new IsolationError(
      'create-target',
      `Could not create the target schema/user: ${scrubSecrets(result.error ?? 'unknown error', [password])}`,
    );
  }

  const connection: MysqlConnection = {
    label: 'isolation-target',
    host: ISOLATION_HOST,
    port: ISOLATION_PORT,
    user,
    password,
    database: schema,
  };

  // Prove the restricted credentials actually work before anyone relies on them.
  const probe = scalar(connection, 'SELECT 1', service.binDir);
  if (probe !== '1') {
    throw new IsolationError(
      'target-reachable',
      `The restricted user ${user} could not query the isolated service.`,
    );
  }

  return { connection, schema, user, password };
}

/** True when this connection's user is the unrestricted root of our own service. */
export function isRootConnection(conn: MysqlConnection): boolean {
  return conn.user === 'root';
}

export { describeConnection };

/** Data directory of a running service, straight from the server. */
export function serverDatadir(conn: MysqlConnection, binDir: string): string {
  return scalar(conn, 'SELECT @@datadir', binDir);
}

export function datadirMatches(reported: string, expected: string): boolean {
  return normaliseFsPath(reported) === normaliseFsPath(expected);
}

/** Convenience for tests: is the recorded pid file the process we spawned? */
export function pidFileMatchesService(service: ProvisionedService): boolean {
  if (!fs.existsSync(service.pidFile)) return false;
  const pidFromFile = Number.parseInt(fs.readFileSync(service.pidFile, 'utf8').trim(), 10);
  return service.pid !== null && pidFromFile === service.pid;
}
