import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

import {
  IsolationError,
  assertIsolationConnection,
  buildClientArgs,
  buildClientEnv,
  describeConnection,
  executableIn,
  queryRows,
  scrubSecrets,
  type MysqlConnection,
} from './config.ts';

/**
 * Import a dump over the target connection only, as the restricted user.
 *
 * Never root, never the source service. The client aborts on the first error (no
 * `--force`), so a dump that tries to leave the target schema stops there instead
 * of being partially applied and reported as a restore.
 */

export interface ImportOutcome {
  ok: boolean;
  error: string | null;
  /** Byte length of the SQL submitted to the importer. */
  bytes: number;
  /** Row/line number in the dump where the client stopped, when the server said so. */
  failedAtLine: number | null;
  /**
   * Tables present in the target after an ABORTED import: the partial state that must
   * be named rather than mistaken for a restore. Empty on success.
   */
  partialTables: string[];
  /** Tables present in the target after a successful import. */
  createdTables: string[];
  /** Tables already present before the import started, so a residual set is visible. */
  preExistingTables: string[];
}

export function listTablesInSchema(conn: MysqlConnection, schema: string, binDir: string): string[] {
  const rows = queryRows(
    conn,
    `SELECT table_name FROM information_schema.tables WHERE table_schema = '${schema.replace(/'/g, "''")}' ORDER BY table_name`,
    binDir,
  );
  return rows.map((row) => row[0] ?? '').filter(Boolean);
}

function parseFailedLine(message: string): number | null {
  const match = /at line (\d+)/i.exec(message);
  if (!match) return null;
  const parsed = Number.parseInt(match[1] ?? '', 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Import SQL text as the restricted user. Returns the outcome; it never throws for a
 * server-side refusal, because a refused hostile statement is an expected result.
 */
export function importSqlText(
  conn: MysqlConnection,
  sqlText: string,
  binDir: string,
): ImportOutcome {
  assertIsolationConnection(conn);
  if (conn.user === 'root') {
    throw new IsolationError(
      'import-as-root',
      'Refusing to import the dump as root: the importer must be the restricted target user.',
    );
  }

  const preExistingTables = listTablesInSchema(conn, conn.database ?? '', binDir);
  const bytes = Buffer.byteLength(sqlText, 'utf8');
  const bin = executableIn(binDir, 'mysql.exe');

  try {
    execFileSync(bin, buildClientArgs(conn), {
      input: sqlText,
      encoding: 'utf8',
      env: buildClientEnv(conn),
      // Capture stderr: a dump must never have its content echoed to the console.
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 512 * 1024 * 1024,
      windowsHide: true,
    });
    return {
      ok: true,
      error: null,
      bytes,
      failedAtLine: null,
      partialTables: [],
      createdTables: listTablesInSchema(conn, conn.database ?? '', binDir),
      preExistingTables,
    };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    const stderr = scrubSecrets(String(err.stderr ?? ''), [conn.password]).trim();
    const stdout = scrubSecrets(String(err.stdout ?? ''), [conn.password]).trim();
    const message = scrubSecrets(String(err.message ?? error), [conn.password]);
    const detail = stderr || stdout || message;
    return {
      ok: false,
      error: detail,
      bytes,
      failedAtLine: parseFailedLine(detail),
      partialTables: listTablesInSchema(conn, conn.database ?? '', binDir),
      createdTables: [],
      preExistingTables,
    };
  }
}

/** Read a dump from disk and import it over the target connection. */
export function importDumpFile(
  conn: MysqlConnection,
  dumpPath: string,
  binDir: string,
): ImportOutcome {
  const sqlText = fs.readFileSync(dumpPath, 'utf8');
  return importSqlText(conn, sqlText, binDir);
}

export { describeConnection };
