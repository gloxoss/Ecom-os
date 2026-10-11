import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

/**
 * Backup restore verification.
 *
 * This script does not simulate a restore. It either imports a real SQL dump into an
 * isolated MySQL database, inspects HPOS order and RFQ quote integrity in that
 * database, and observes a rollback - or it reports NOT RUN and exits non-zero.
 *
 * There is no synthetic snapshot fallback and no hardcoded table count: an earlier
 * revision fed a locally built object (tableCount 42, hposOrdersVerified true) into a
 * `simulateRestoreRehearsal` helper and reported success without touching a database.
 * That is not recovery evidence, so it is gone.
 *
 * Exit codes: 0 VERIFIED, 1 FAIL, 2 NOT RUN (blocked on a real artifact/environment),
 * 3 PARTIAL (restore inspected, rollback rehearsal not observed).
 */

export type RestoreStatus = 'VERIFIED' | 'PARTIAL' | 'FAIL' | 'NOT RUN';

export interface RestoreCheck {
  name: string;
  ok: boolean;
  detail: string;
}

export interface RestoreReport {
  status: RestoreStatus;
  reason: string;
  backupPath: string | null;
  targetDatabase: string | null;
  checks: RestoreCheck[];
  rollbackObserved: boolean;
}

export interface RestoreOptions {
  backupPath: string | undefined;
  targetDatabase: string | undefined;
  sourceDatabase: string | undefined;
  mysqlBin: string | undefined;
  confirmTarget: string | undefined;
  confirmDrop: string | undefined;
  keepTarget: boolean;
}

const EXIT_CODES: Record<RestoreStatus, number> = {
  VERIFIED: 0,
  FAIL: 1,
  'NOT RUN': 2,
  PARTIAL: 3,
};

const REQUIRED_PLUGIN_TABLES = ['ecomos_rfq_quotes', 'ecomos_rfq_revisions'];

function report(
  status: RestoreStatus,
  reason: string,
  backupPath: string | null,
  targetDatabase: string | null,
  checks: RestoreCheck[] = [],
  rollbackObserved = false,
): RestoreReport {
  return { status, reason, backupPath, targetDatabase, checks, rollbackObserved };
}

function isSafeIdentifier(value: string): boolean {
  return /^[A-Za-z0-9_]+$/.test(value);
}

function resolveMysqlBin(explicit: string | undefined): string | null {
  if (explicit) return fs.existsSync(explicit) ? explicit : null;

  const fromEnv = process.env.ECOM_OS_MYSQL_BIN;
  if (fromEnv) return fs.existsSync(fromEnv) ? fromEnv : null;

  try {
    execFileSync('mysql', ['--version'], { stdio: 'ignore' });
    return 'mysql';
  } catch {
    // Not on PATH; fall through to the Local by Flywheel dev convenience below.
  }

  const localRoot = process.env.APPDATA
    ? path.join(process.env.APPDATA, 'Local', 'lightning-services')
    : '';
  if (localRoot && fs.existsSync(localRoot)) {
    for (const entry of fs.readdirSync(localRoot)) {
      if (!entry.startsWith('mysql-')) continue;
      const candidate = path.join(localRoot, entry, 'bin', 'win64', 'bin', 'mysql.exe');
      if (fs.existsSync(candidate)) return candidate;
    }
  }

  return null;
}

function mysqlConnectionArgs(): string[] {
  const args = ['--batch', '--skip-column-names', '--protocol=TCP'];
  const host = process.env.ECOM_OS_MYSQL_HOST;
  const port = process.env.ECOM_OS_MYSQL_PORT;
  const user = process.env.ECOM_OS_MYSQL_USER;
  if (host) args.push(`--host=${host}`);
  if (port) args.push(`--port=${port}`);
  if (user) args.push(`--user=${user}`);
  return args;
}

function mysqlQuery(bin: string, sql: string, database?: string): string {
  const args = mysqlConnectionArgs();
  if (database) args.push(database);
  args.push('--execute', sql);
  return execFileSync(bin, args, {
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 64 * 1024 * 1024,
  }).trim();
}

function mysqlImportDump(bin: string, database: string, dumpPath: string): void {
  execFileSync(bin, [...mysqlConnectionArgs(), database], {
    input: fs.readFileSync(dumpPath),
    env: process.env,
    maxBuffer: 256 * 1024 * 1024,
  });
}

function listTables(bin: string, database: string): string[] {
  return mysqlQuery(
    bin,
    `SELECT table_name FROM information_schema.tables WHERE table_schema = '${database}'`,
  )
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function count(bin: string, database: string, sql: string): number {
  const value = mysqlQuery(bin, sql, database);
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

/** Import the dump into an isolated target database and inspect it. */
export function verifyRestore(options: RestoreOptions): RestoreReport {
  const backupPath =
    options.backupPath ?? process.env.ECOM_OS_RESTORE_BACKUP ?? undefined;
  const targetDatabase =
    options.targetDatabase ?? process.env.ECOM_OS_RESTORE_TARGET_DB ?? undefined;
  const sourceDatabase =
    options.sourceDatabase ?? process.env.ECOM_OS_RESTORE_SOURCE_DB ?? undefined;
  const confirmTarget = options.confirmTarget ?? undefined;
  const confirmDrop = options.confirmDrop ?? undefined;

  if (!backupPath) {
    return report(
      'NOT RUN',
      'No real backup artifact supplied: pass --dump <path> or set ECOM_OS_RESTORE_BACKUP. ' +
        'A synthetic snapshot cannot stand in for a backup.',
      null,
      targetDatabase ?? null,
    );
  }

  const resolvedBackup = path.resolve(backupPath);
  if (!fs.existsSync(resolvedBackup) || !fs.statSync(resolvedBackup).isFile()) {
    return report('FAIL', `Backup file not found: ${resolvedBackup}`, resolvedBackup, null);
  }
  if (fs.statSync(resolvedBackup).size === 0) {
    return report('FAIL', `Backup file is empty: ${resolvedBackup}`, resolvedBackup, null);
  }

  const dumpHead = fs.readFileSync(resolvedBackup, 'utf8').slice(0, 65536);
  if (!/CREATE TABLE|INSERT INTO|-- MySQL dump/i.test(dumpHead)) {
    return report(
      'FAIL',
      `File does not look like a SQL dump (no CREATE TABLE / INSERT INTO): ${resolvedBackup}`,
      resolvedBackup,
      null,
    );
  }

  if (!targetDatabase) {
    return report(
      'NOT RUN',
      'Blocked on an isolated restore database: pass --target-db <name> or set ' +
        'ECOM_OS_RESTORE_TARGET_DB. It must be a scratch database you are willing to overwrite.',
      resolvedBackup,
      null,
    );
  }
  if (!isSafeIdentifier(targetDatabase)) {
    return report(
      'FAIL',
      `Target database name must match [A-Za-z0-9_]+: ${targetDatabase}`,
      resolvedBackup,
      targetDatabase,
    );
  }
  if (sourceDatabase && sourceDatabase === targetDatabase) {
    return report(
      'FAIL',
      `Target database equals source database (${targetDatabase}); refuse to restore over the source.`,
      resolvedBackup,
      targetDatabase,
    );
  }
  if (confirmTarget !== targetDatabase) {
    return report(
      'NOT RUN',
      `Refusing to write without confirmation: pass --confirm-target ${targetDatabase} ` +
        `to confirm it is an isolated scratch database.`,
      resolvedBackup,
      targetDatabase,
    );
  }

  const mysqlBin = resolveMysqlBin(options.mysqlBin);
  if (!mysqlBin) {
    return report(
      'NOT RUN',
      'Blocked on a MySQL client: none on PATH and ECOM_OS_MYSQL_BIN is unset. ' +
        'Point ECOM_OS_MYSQL_BIN at a mysql client to import and inspect the dump.',
      resolvedBackup,
      targetDatabase,
    );
  }

  const checks: RestoreCheck[] = [];

  try {
    mysqlQuery(
      mysqlBin,
      `DROP DATABASE IF EXISTS \`${targetDatabase}\`; CREATE DATABASE \`${targetDatabase}\`;`,
    );
    mysqlImportDump(mysqlBin, targetDatabase, resolvedBackup);
  } catch (error) {
    return report(
      'FAIL',
      `Import into ${targetDatabase} failed: ${error instanceof Error ? error.message : String(error)}`,
      resolvedBackup,
      targetDatabase,
      checks,
    );
  }

  const tables = listTables(mysqlBin, targetDatabase);
  checks.push({
    name: 'tables imported',
    ok: tables.length > 0,
    detail: `${tables.length} table(s) in ${targetDatabase}`,
  });

  const ordersTable = tables.find((table) => table.endsWith('wc_orders'));
  if (!ordersTable) {
    checks.push({
      name: 'HPOS orders table present',
      ok: false,
      detail: 'no *wc_orders table found; HPOS orders were not restored',
    });
  } else {
    const prefix = ordersTable.slice(0, ordersTable.length - 'wc_orders'.length);
    const orderCount = count(mysqlBin, targetDatabase, `SELECT COUNT(*) FROM \`${ordersTable}\``);
    const badStatus = count(
      mysqlBin,
      targetDatabase,
      `SELECT COUNT(*) FROM \`${ordersTable}\` WHERE status IS NULL OR status = ''`,
    );
    const badTotals = count(
      mysqlBin,
      targetDatabase,
      `SELECT COUNT(*) FROM \`${ordersTable}\` WHERE total_amount IS NULL`,
    );
    const guestOrders = count(
      mysqlBin,
      targetDatabase,
      `SELECT COUNT(*) FROM \`${ordersTable}\` WHERE customer_id = 0`,
    );

    checks.push({
      name: 'HPOS orders table present',
      ok: true,
      detail: `${ordersTable} restored`,
    });
    checks.push({
      name: 'HPOS orders inspected',
      ok: Number.isFinite(orderCount) && orderCount > 0,
      detail: `${orderCount} order(s) in ${ordersTable}`,
    });
    checks.push({
      name: 'HPOS order status integrity',
      ok: badStatus === 0,
      detail: `${badStatus} order(s) with an empty status`,
    });
    checks.push({
      name: 'HPOS order total integrity',
      ok: badTotals === 0,
      detail: `${badTotals} order(s) with a null total_amount`,
    });
    checks.push({
      name: 'guest orders preserved',
      ok: Number.isFinite(guestOrders) && guestOrders <= orderCount,
      detail: `${guestOrders} guest order(s) (customer_id = 0)`,
    });

    const quotesTable = `${prefix}${REQUIRED_PLUGIN_TABLES[0]}`;
    const revisionsTable = `${prefix}${REQUIRED_PLUGIN_TABLES[1]}`;
    if (tables.includes(quotesTable)) {
      const badQuotes = count(
        mysqlBin,
        targetDatabase,
        `SELECT COUNT(*) FROM \`${quotesTable}\` WHERE state IS NULL OR state = ''`,
      );
      checks.push({
        name: 'RFQ quote state integrity',
        ok: badQuotes === 0,
        detail: `${badQuotes} quote(s) with an empty state in ${quotesTable}`,
      });
    }
    if (tables.includes(quotesTable) && tables.includes(revisionsTable)) {
      const orphanRevisions = count(
        mysqlBin,
        targetDatabase,
        `SELECT COUNT(*) FROM \`${revisionsTable}\` r LEFT JOIN \`${quotesTable}\` q ` +
          'ON q.id = r.quote_id WHERE q.id IS NULL',
      );
      checks.push({
        name: 'RFQ revisions reference real quotes',
        ok: orphanRevisions === 0,
        detail: `${orphanRevisions} orphan revision(s)`,
      });
    }
  }

  let rollbackObserved = false;
  if (options.keepTarget) {
    checks.push({
      name: 'rollback rehearsal',
      ok: false,
      detail: 'skipped (--keep-target); rollback was not observed',
    });
  } else if (confirmDrop !== targetDatabase) {
    checks.push({
      name: 'rollback rehearsal',
      ok: false,
      detail: `not authorized; pass --confirm-drop ${targetDatabase} to drop the isolated target`,
    });
  } else {
    try {
      mysqlQuery(mysqlBin, `DROP DATABASE IF EXISTS \`${targetDatabase}\``);
      const remaining = mysqlQuery(
        mysqlBin,
        `SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '${targetDatabase}'`,
      );
      rollbackObserved = remaining === '0';
      checks.push({
        name: 'rollback rehearsal',
        ok: rollbackObserved,
        detail: rollbackObserved
          ? `${targetDatabase} dropped and confirmed absent after restore`
          : `${targetDatabase} still present after rollback attempt`,
      });
    } catch (error) {
      checks.push({
        name: 'rollback rehearsal',
        ok: false,
        detail: `rollback failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) {
    return report(
      'FAIL',
      `${failed.length} integrity check(s) failed in ${targetDatabase}`,
      resolvedBackup,
      targetDatabase,
      checks,
      rollbackObserved,
    );
  }

  if (!rollbackObserved) {
    return report(
      'PARTIAL',
      'Restore imported and order/quote integrity verified, but no rollback was observed. ' +
        'This is not a full disaster-recovery rehearsal.',
      resolvedBackup,
      targetDatabase,
      checks,
      false,
    );
  }

  return report(
    'VERIFIED',
    `Restored ${targetDatabase} from ${resolvedBackup}, inspected order/quote integrity, and observed rollback.`,
    resolvedBackup,
    targetDatabase,
    checks,
    true,
  );
}

function parseArgs(argv: string[]): RestoreOptions {
  const options: RestoreOptions = {
    backupPath: undefined,
    targetDatabase: undefined,
    sourceDatabase: undefined,
    mysqlBin: undefined,
    confirmTarget: undefined,
    confirmDrop: undefined,
    keepTarget: false,
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
  console.log('--- EcomOS Backup & Restore Verification (real import, no simulation) ---');
  const result = verifyRestore(parseArgs(process.argv.slice(2)));
  console.log(JSON.stringify(result, null, 2));
  console.error(`[RESTORE-${result.status}] ${result.reason}`);
  process.exit(EXIT_CODES[result.status]);
}
