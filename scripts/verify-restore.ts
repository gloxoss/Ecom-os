import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { runIsolatedRestore, ISOLATION_PORT } from './restore-isolation/index.ts';

/**
 * Backup restore verification.
 *
 * This script does not simulate a restore. It either imports a real SQL dump into an
 * *isolated MySQL service* -- a separate mysqld with its own fresh data directory,
 * bound to 127.0.0.1:3309 only, reached by a restricted user whose grants are the
 * target schema and nothing else -- inspects HPOS order and RFQ quote integrity in
 * that service, and reports what it found, or it reports NOT RUN and exits non-zero.
 *
 * There is no synthetic snapshot fallback and no hardcoded table count: an earlier
 * revision fed a locally built object (tableCount 42, hposOrdersVerified true) into a
 * `simulateRestoreRehearsal` helper and reported success without touching a database.
 * That is not recovery evidence, so it is gone.
 *
 * A database *name* on the source service is not isolation. A dump carrying
 * `USE source_db;`, a fully qualified `source_db.table` insert, a trigger, an event, a
 * routine or `LOAD DATA INFILE` runs with the importing identity's privileges against
 * whatever service it is pointed at. Isolation here is a different process, a
 * different data directory and target-only credentials, proved by a fail-closed gate
 * before a single byte of the dump is read.
 *
 * Exit codes: 0 VERIFIED, 1 FAIL, 2 NOT RUN (blocked on a real artifact/environment),
 * 3 PARTIAL (restore imported and inspected in isolation, but the run did not complete
 * the full lifecycle, e.g. the isolated service was kept or could not be confirmed
 * stopped).
 */

export type RestoreStatus = 'VERIFIED' | 'PARTIAL' | 'FAIL' | 'NOT RUN';

export interface RestoreCheck {
  name: string;
  ok: boolean;
  detail: string;
}

export interface IsolationSummary {
  host: string;
  port: number;
  targetSchema: string;
  restrictedUser: string | null;
  datadir: string | null;
  gatePassed: boolean;
  failedGates: string[];
  grantedPrivileges: string[];
  partialTables: string[];
  teardown: string | null;
  notes: string[];
}

export interface RestoreReport {
  status: RestoreStatus;
  reason: string;
  backupPath: string | null;
  targetDatabase: string | null;
  checks: RestoreCheck[];
  rollbackObserved: boolean;
  isolation: IsolationSummary | null;
}

export interface RestoreOptions {
  backupPath: string | undefined;
  targetDatabase: string | undefined;
  sourceDatabase: string | undefined;
  mysqlBin: string | undefined;
  mysqlBinDir: string | undefined;
  confirmTarget: string | undefined;
  confirmDrop: string | undefined;
  keepTarget: boolean;
  sourcePort: number | undefined;
  requiredTables: string[] | undefined;
}

const EXIT_CODES: Record<RestoreStatus, number> = {
  VERIFIED: 0,
  FAIL: 1,
  'NOT RUN': 2,
  PARTIAL: 3,
};

function isSafeIdentifier(value: string): boolean {
  return /^[A-Za-z0-9_]+$/.test(value);
}

function parseOptionalPort(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Resolve the directory containing mysqld/mysql/mysqldump/mysqladmin. */
function resolveBinDirFromOptions(options: RestoreOptions): string | undefined {
  if (options.mysqlBinDir) return options.mysqlBinDir;
  if (options.mysqlBin) return path.dirname(options.mysqlBin);
  if (process.env.ECOM_OS_MYSQL_BIN_DIR) return process.env.ECOM_OS_MYSQL_BIN_DIR;
  if (process.env.ECOM_OS_MYSQL_BIN) return path.dirname(process.env.ECOM_OS_MYSQL_BIN);
  return undefined;
}

/**
 * Import a real dump into an isolated service and inspect it.
 *
 * The source service is never the importer: the target is a separate mysqld on
 * 127.0.0.1:3309 reached only by the restricted target user. Port 3308 and any
 * other service are never contacted.
 */
export async function verifyRestore(options: RestoreOptions): Promise<RestoreReport> {
  const backupPath = options.backupPath ?? process.env.ECOM_OS_RESTORE_BACKUP ?? undefined;
  const targetSchema =
    options.targetDatabase ?? process.env.ECOM_OS_RESTORE_TARGET_DB ?? undefined;
  const sourceDatabase =
    options.sourceDatabase ?? process.env.ECOM_OS_RESTORE_SOURCE_DB ?? undefined;
  const sourcePort = options.sourcePort ?? parseOptionalPort(process.env.ECOM_OS_MYSQL_PORT);

  const fail = (reason: string, backup: string | null, target: string | null): RestoreReport => ({
    status: 'FAIL',
    reason,
    backupPath: backup,
    targetDatabase: target,
    checks: [],
    rollbackObserved: false,
    isolation: null,
  });

  if (!backupPath) {
    return {
      status: 'NOT RUN',
      reason:
        'No real backup artifact supplied: pass --dump <path> or set ECOM_OS_RESTORE_BACKUP. ' +
        'A synthetic snapshot cannot stand in for a backup.',
      backupPath: null,
      targetDatabase: targetSchema ?? null,
      checks: [],
      rollbackObserved: false,
      isolation: null,
    };
  }

  const resolvedBackup = path.resolve(backupPath);
  if (!fs.existsSync(resolvedBackup) || !fs.statSync(resolvedBackup).isFile()) {
    return fail(`Backup file not found: ${resolvedBackup}`, resolvedBackup, null);
  }
  if (fs.statSync(resolvedBackup).size === 0) {
    return fail(`Backup file is empty: ${resolvedBackup}`, resolvedBackup, null);
  }

  if (targetSchema !== undefined && !isSafeIdentifier(targetSchema)) {
    return fail(
      `Target schema name must match [A-Za-z0-9_]+: ${targetSchema}`,
      resolvedBackup,
      targetSchema,
    );
  }
  if (sourceDatabase && targetSchema && sourceDatabase === targetSchema) {
    return fail(
      `Target schema equals the source database name (${targetSchema}); refuse to restore over the source.`,
      resolvedBackup,
      targetSchema,
    );
  }
  if (options.confirmTarget !== undefined && options.confirmTarget !== (targetSchema ?? 'restore_target')) {
    return fail(
      `--confirm-target ${options.confirmTarget} does not match the target schema ` +
        `(${targetSchema ?? 'restore_target'}). Refusing to proceed on an unconfirmed target.`,
      resolvedBackup,
      targetSchema ?? null,
    );
  }

  const binDir = resolveBinDirFromOptions(options);

  // Destructive rollback is not authorized. --confirm-drop is accepted for CLI
  // compatibility and deliberately ignored: nothing is dropped, dropped-and-confirmed
  // or truncated anywhere, in the implementation or in teardown.
  const destructiveRollbackRequested = options.confirmDrop !== undefined;

  const result = await runIsolatedRestore({
    dumpPath: resolvedBackup,
    targetSchema,
    mysqlBinDir: binDir,
    sourcePort,
    requiredTableSuffixes: options.requiredTables,
    keepService: options.keepTarget,
  });

  const isolation: IsolationSummary = {
    host: result.service?.host ?? '127.0.0.1',
    port: result.service?.port ?? ISOLATION_PORT,
    targetSchema: result.targetSchema,
    restrictedUser: result.service?.restrictedUser ?? null,
    datadir: result.datadir,
    gatePassed: result.gate?.ok ?? false,
    failedGates: result.gate?.failed ?? [],
    grantedPrivileges: result.service?.grantedPrivileges ?? [],
    partialTables: result.importOutcome?.partialTables ?? [],
    teardown: result.teardown
      ? `${result.teardown.method}: ${result.teardown.detail}`
      : options.keepTarget
        ? 'skipped (--keep-target): the isolated service was left running'
        : null,
    notes: result.notes,
  };

  const checks: RestoreCheck[] = result.checks.map((check) => ({
    name: check.name,
    ok: check.ok,
    detail: check.detail,
  }));

  const suffixes: string[] = [];
  if (result.status === 'VERIFIED' || result.status === 'PARTIAL') {
    suffixes.push(
      'No destructive rollback was performed: teardown stops the isolated service and drops nothing, ' +
        'and the data directory is left in place.',
    );
  } else if (result.importOutcome && !result.importOutcome.ok) {
    suffixes.push(
      `Import stopped at dump line ${result.importOutcome.failedAtLine ?? 'unknown'}; ` +
        'the isolation harness does not choose what the dump writes.',
    );
  }
  if (destructiveRollbackRequested && result.importOutcome?.ok) {
    suffixes.push(
      '--confirm-drop was supplied but destructive cleanup is not authorized; it was ignored.',
    );
  }

  const reason = [result.reason, ...suffixes].filter(Boolean).join(' ');

  return {
    status: result.status,
    reason,
    backupPath: resolvedBackup,
    targetDatabase: result.targetSchema,
    checks,
    rollbackObserved: false,
    isolation,
  };
}

function parseArgs(argv: string[]): RestoreOptions {
  const options: RestoreOptions = {
    backupPath: undefined,
    targetDatabase: undefined,
    sourceDatabase: undefined,
    mysqlBin: undefined,
    mysqlBinDir: undefined,
    confirmTarget: undefined,
    confirmDrop: undefined,
    keepTarget: false,
    sourcePort: undefined,
    requiredTables: undefined,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i] ?? '';
    const take = () => argv[i + 1] ?? '';
    switch (arg) {
      case '--dump':
      case '--backup':
        options.backupPath = take();
        i += 1;
        break;
      case '--target-db':
      case '--target-schema':
        options.targetDatabase = take();
        i += 1;
        break;
      case '--source-db':
        options.sourceDatabase = take();
        i += 1;
        break;
      case '--mysql-bin':
        options.mysqlBin = take();
        i += 1;
        break;
      case '--mysql-bin-dir':
        options.mysqlBinDir = take();
        i += 1;
        break;
      case '--source-port':
        options.sourcePort = parseOptionalPort(take());
        i += 1;
        break;
      case '--required-table':
        options.requiredTables = [...(options.requiredTables ?? []), take()];
        i += 1;
        break;
      case '--confirm-target':
        options.confirmTarget = take();
        i += 1;
        break;
      case '--confirm-drop':
        options.confirmDrop = take();
        i += 1;
        break;
      case '--keep-target':
        options.keepTarget = true;
        break;
      default:
        if (!arg.startsWith('-') && !options.backupPath) options.backupPath = arg;
        break;
    }
  }

  return options;
}

function invokedDirectly(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    if (import.meta.url === pathToFileURL(entry).href) return true;
  } catch {
    // Fall through to the extension check below.
  }
  return entry.endsWith('verify-restore.ts');
}

if (invokedDirectly()) {
  // Wrapped rather than top-level await: tsx compiles this file as CJS, where
  // top-level await is not available.
  void (async () => {
    console.log('--- EcomOS Backup & Restore Verification (isolated service, real import, no simulation) ---');
    const result = await verifyRestore(parseArgs(process.argv.slice(2)));
    console.log(JSON.stringify(result, null, 2));
    console.error(`[RESTORE-${result.status}] ${result.reason}`);
    process.exit(EXIT_CODES[result.status]);
  })();
}
