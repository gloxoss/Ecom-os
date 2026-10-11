import fs from 'node:fs';
import path from 'node:path';

import {
  DEFAULT_RESTRICTED_USER,
  DEFAULT_TARGET_SCHEMA,
  FORBIDDEN_PRIVILEGES,
  ISOLATION_HOST,
  ISOLATION_PORT,
  IsolationError,
  TARGET_PRIVILEGES,
  describeConnection,
  scrubSecrets,
} from './config.ts';
import {
  createTargetSchemaAndUser,
  provisionTargetService,
  type ProvisionedService,
} from './provision-target.ts';
import { runIsolationGate, type GateCheck, type IsolationGateResult } from './gate.ts';
import { importDumpFile, importSqlText, listTablesInSchema, type ImportOutcome } from './import-dump.ts';
import { inspectRestoredSchema, type InspectionResult } from './inspect.ts';
import { teardownService, type TeardownResult } from './teardown.ts';

/**
 * Orchestration for an isolated restore:
 *
 *   provision a separate service -> create the target schema + restricted user ->
 *   FAIL-CLOSED GATE -> open the dump -> import as the restricted user -> inspect ->
 *   teardown (stop only; nothing destructive).
 *
 * The gate runs before any SQL from the dump is read. If it fails, nothing is
 * imported and the failing gate is named.
 */

export type IsolationStatus = 'VERIFIED' | 'PARTIAL' | 'FAIL' | 'NOT RUN';

export interface IsolationCheck {
  name: string;
  ok: boolean;
  detail: string;
}

export interface StageOutcome {
  gateOk: boolean;
  importOk: boolean;
  inspectionOk: boolean;
  /** True when the isolated service was confirmed stopped, or the caller owns it. */
  teardownStopped: boolean;
}

/**
 * The single place the status policy lives, so the exit-code mapping is testable
 * without provisioning a service.
 *
 * FAIL: the gate did not pass, the dump did not import, or an integrity check failed.
 * VERIFIED: gate, import and inspection all passed and the run completed its lifecycle.
 * PARTIAL: everything verified, but this run's isolated service was not confirmed
 *   stopped (kept with --keep-target, or shutdown did not land).
 * (NOT RUN is decided before this point, when the artifact/environment is missing.)
 */
export function resolveRestoreStatus(stage: StageOutcome): IsolationStatus {
  if (!stage.gateOk || !stage.importOk || !stage.inspectionOk) return 'FAIL';
  return stage.teardownStopped ? 'VERIFIED' : 'PARTIAL';
}

export interface IsolatedRestoreOptions {
  dumpPath: string | undefined;
  targetSchema?: string | undefined;
  restrictedUser?: string | undefined;
  mysqlBinDir?: string | undefined;
  /** A configured source port. Must differ from the isolation port. */
  sourcePort?: number | undefined;
  requiredTableSuffixes?: string[] | undefined;
  /** Keep the isolated service running after inspection instead of stopping it. */
  keepService?: boolean | undefined;
  /**
   * Reuse an isolated service the caller already provisioned. The caller owns its
   * lifecycle, so this run never stops it. Used to run many fixtures against one
   * isolated service (for example the hostile-dump test suite) instead of paying the
   * data-directory init cost per case.
   */
  existingService?: ProvisionedService | undefined;
  runRoot?: string | undefined;
  readyTimeoutMs?: number | undefined;
}

export interface ServiceSummary {
  runId: string;
  datadir: string;
  fileTransferDir: string;
  host: string;
  port: number;
  pid: number | null;
  logFile: string;
  targetSchema: string;
  restrictedUser: string;
  grantedPrivileges: string[];
}

export interface IsolatedRestoreResult {
  status: IsolationStatus;
  reason: string;
  checks: IsolationCheck[];
  notes: string[];
  gate: IsolationGateResult | null;
  inspection: InspectionResult | null;
  importOutcome: ImportOutcome | null;
  service: ServiceSummary | null;
  teardown: TeardownResult | null;
  targetSchema: string;
  datadir: string | null;
  rollbackObserved: false;
}

function toChecks(checks: GateCheck[]): IsolationCheck[] {
  return checks.map((item) => ({ name: item.name, ok: item.ok, detail: item.detail }));
}

function looksLikeSqlDump(head: string): boolean {
  return /CREATE TABLE|INSERT INTO|-- MySQL dump/i.test(head);
}

/**
 * A `mysqldump --databases` artifact carries `CREATE DATABASE x; USE x;`. Isolation
 * refuses those statements because the importer has no privileges on any schema but
 * the target -- which is the protection working, not a bug. Detect the pattern so the
 * failure reason can tell the operator what to do instead.
 */
function detectForeignSchemaSelectors(sqlText: string, targetSchema: string): string[] {
  const found = new Set<string>();
  const usePattern = /^\s*USE\s+`?([A-Za-z0-9_]+)`?\s*;/gim;
  const createDbPattern =
    /^\s*CREATE\s+DATABASE\s+(?:\/\*!\d+\s+IF\s+NOT\s+EXISTS\s*\*\/\s*)?`?([A-Za-z0-9_]+)`?/gim;
  for (const pattern of [usePattern, createDbPattern]) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(sqlText)) !== null) {
      const schema = match[1];
      if (schema && schema !== targetSchema) found.add(schema);
    }
  }
  return [...found].sort();
}

function summariseService(
  service: ProvisionedService,
  targetSchema: string,
  restrictedUser: string,
): ServiceSummary {
  return {
    runId: service.runId,
    datadir: service.datadir,
    fileTransferDir: service.fileTransferDir,
    host: ISOLATION_HOST,
    port: ISOLATION_PORT,
    pid: service.pid,
    logFile: service.logFile,
    targetSchema,
    restrictedUser,
    grantedPrivileges: [...TARGET_PRIVILEGES],
  };
}

export async function runIsolatedRestore(
  options: IsolatedRestoreOptions,
): Promise<IsolatedRestoreResult> {
  const targetSchema = options.targetSchema ?? DEFAULT_TARGET_SCHEMA;
  const restrictedUser = options.restrictedUser ?? DEFAULT_RESTRICTED_USER;

  if (!options.dumpPath) {
    return {
      status: 'NOT RUN',
      reason:
        'No real backup artifact supplied: pass --dump <path> or set ECOM_OS_RESTORE_BACKUP. ' +
        'A synthetic snapshot cannot stand in for a backup.',
      checks: [],
      notes: [],
      gate: null,
      inspection: null,
      importOutcome: null,
      service: null,
      teardown: null,
      targetSchema,
      datadir: null,
      rollbackObserved: false,
    };
  }

  const resolvedDump = path.resolve(options.dumpPath);
  const early = (status: IsolationStatus, reason: string): IsolatedRestoreResult => ({
    status,
    reason,
    checks: [],
    notes: [],
    gate: null,
    inspection: null,
    importOutcome: null,
    service: null,
    teardown: null,
    targetSchema,
    datadir: null,
    rollbackObserved: false,
  });

  if (!fs.existsSync(resolvedDump) || !fs.statSync(resolvedDump).isFile()) {
    return early('FAIL', `Backup file not found: ${resolvedDump}`);
  }
  if (fs.statSync(resolvedDump).size === 0) {
    return early('FAIL', `Backup file is empty: ${resolvedDump}`);
  }

  // A source on the isolation port is a configuration error, not a reason to proceed.
  if (options.sourcePort !== undefined && options.sourcePort === ISOLATION_PORT) {
    return early(
      'FAIL',
      `Configured source port ${options.sourcePort} equals the isolation port ${ISOLATION_PORT}. ` +
        'The restore target must be a different service from the source.',
    );
  }

  // ---- Provision (or adopt) the separate service ----------------------------
  let service: ProvisionedService;
  const ownsService = options.existingService === undefined;
  if (options.existingService) {
    service = options.existingService;
  } else {
    try {
      service = await provisionTargetService({
        mysqlBinDir: options.mysqlBinDir,
        runRoot: options.runRoot,
        readyTimeoutMs: options.readyTimeoutMs,
      });
    } catch (error) {
      const isolation = error instanceof IsolationError ? error : null;
      const message = scrubSecrets(error instanceof Error ? error.message : String(error), []);
      return early(
        isolation?.gate === 'port-free' ? 'FAIL' : 'NOT RUN',
        `Isolation could not be established: ${message}`,
      );
    }
  }

  const checks: IsolationCheck[] = [];
  const notes: string[] = [];
  let teardown: TeardownResult | null = null;
  const serviceSummary = summariseService(service, targetSchema, restrictedUser);

  const finish = async (
    stage: Omit<StageOutcome, 'teardownStopped'>,
    reason: string,
    extra: Partial<IsolatedRestoreResult> = {},
  ): Promise<IsolatedRestoreResult> => {
    let teardownStopped = true;
    let teardownNote: string | null = null;
    if (ownsService && !options.keepService) {
      teardown = await teardownService(service, { binDir: service.binDir });
      teardownStopped = teardown.stopped;
    } else if (!ownsService) {
      // The caller owns the service lifecycle; stopping it is out of scope for this run.
      teardownNote =
        'isolated service lifecycle is owned by the caller; this run did not stop it.';
    } else {
      // --keep-target: the service is deliberately left running, so the run did not
      // complete its lifecycle and must not be reported as a full rehearsal.
      teardownStopped = false;
      teardownNote = 'isolated service kept running (--keep-target); it was not stopped.';
    }

    const status = resolveRestoreStatus({ ...stage, teardownStopped });
    const downgrade =
      status === 'PARTIAL' && teardownNote
        ? ` ${teardownNote.charAt(0).toUpperCase()}${teardownNote.slice(1)} Not a complete rehearsal, so PARTIAL.`
        : '';

    return {
      status,
      reason: `${reason}${downgrade}`,
      checks,
      notes,
      gate: null,
      inspection: null,
      importOutcome: null,
      service: serviceSummary,
      teardown,
      targetSchema,
      datadir: service.datadir,
      rollbackObserved: false,
      ...extra,
    };
  };

  // ---- Target schema + restricted user -------------------------------------
  let access;
  try {
    access = createTargetSchemaAndUser(service, { schema: targetSchema, user: restrictedUser });
  } catch (error) {
    return finish(
      { gateOk: false, importOk: false, inspectionOk: false },
      `Could not create the isolated target schema/user: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  // ---- FAIL-CLOSED GATE: before any SQL from the dump is read ----------------
  const gate = runIsolationGate(
    access.connection,
    {
      port: ISOLATION_PORT,
      host: ISOLATION_HOST,
      datadir: service.datadir,
      user: restrictedUser,
      schema: targetSchema,
      sourcePort: options.sourcePort,
    },
    service.binDir,
  );
  checks.push(...toChecks(gate.checks));

  if (!gate.ok) {
    return finish(
      { gateOk: false, importOk: false, inspectionOk: false },
      `Isolation gate failed (${gate.failed.join(', ')}); no SQL from the dump was read and ` +
        `nothing was imported. Target connection: ${describeConnection(access.connection)}.`,
      { gate },
    );
  }

  // ---- Only now is the dump opened ------------------------------------------
  let head = '';
  try {
    head = fs.readFileSync(resolvedDump, 'utf8').slice(0, 65536);
  } catch (error) {
    return finish(
      { gateOk: true, importOk: false, inspectionOk: false },
      `Could not read the dump after the gate passed: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { gate },
    );
  }
  if (!looksLikeSqlDump(head)) {
    return finish(
      { gateOk: true, importOk: false, inspectionOk: false },
      `File does not look like a SQL dump (no CREATE TABLE / INSERT INTO): ${resolvedDump}`,
      { gate },
    );
  }

  // ---- Import as the restricted user, over the target connection only --------
  const importOutcome = importDumpFile(access.connection, resolvedDump, service.binDir);

  if (!importOutcome.ok) {
    const partial =
      importOutcome.partialTables.length > 0
        ? `Partial state in \`${targetSchema}\`: ${importOutcome.partialTables.join(', ')}.`
        : `Nothing was created in \`${targetSchema}\` before the failure.`;
    const where =
      importOutcome.failedAtLine !== null ? ` Stopped at dump line ${importOutcome.failedAtLine}.` : '';
    let hint = '';
    try {
      const foreign = detectForeignSchemaSelectors(fs.readFileSync(resolvedDump, 'utf8'), targetSchema);
      if (foreign.length > 0) {
        hint =
          ` The dump selects a schema the importer is not privileged on (${foreign.join(', ')}), which is ` +
          'the isolation working: nothing outside the target was written. Re-export the artifact as a ' +
          'single-schema dump, or drop the leading CREATE DATABASE / USE lines, then retry.';
      }
    } catch {
      // The hint is best-effort; the failure itself is already reported.
    }
    return finish(
      { gateOk: true, importOk: false, inspectionOk: false },
      `Import into the isolated target failed, so this is not a restore.${where} ${partial} ` +
        `Cause: ${scrubSecrets(importOutcome.error ?? 'unknown error', [access.password])}${hint}`,
      { gate, importOutcome },
    );
  }

  // ---- Inspect the restored schema ------------------------------------------
  const inspection = inspectRestoredSchema(access.connection, {
    binDir: service.binDir,
    schema: targetSchema,
    requiredTableSuffixes: options.requiredTableSuffixes,
  });
  checks.push(...inspection.checks);
  notes.push(...inspection.notes);

  if (!inspection.ok) {
    const failed = inspection.checks.filter((item) => !item.ok).map((item) => item.name);
    return finish(
      { gateOk: true, importOk: true, inspectionOk: false },
      `Restore inspected in isolated \`${targetSchema}\`, but ${failed.length} integrity check(s) ` +
        `failed: ${failed.join(', ')}.`,
      { gate, importOutcome, inspection },
    );
  }

  return finish(
    { gateOk: true, importOk: true, inspectionOk: true },
    `Imported ${resolvedDump} into an isolated MySQL service on ${ISOLATION_HOST}:${ISOLATION_PORT} ` +
      `(datadir ${service.datadir}), passed the fail-closed isolation gate, and inspected ` +
      `${inspection.tableCount} table(s) including HPOS orders and RFQ quotes/revisions. ` +
      'No destructive operation was performed; the data directory is left in place.',
    { gate, importOutcome, inspection },
  );
}

export {
  provisionTargetService,
  createTargetSchemaAndUser,
  runIsolationGate,
  importDumpFile,
  importSqlText,
  listTablesInSchema,
  inspectRestoredSchema,
  teardownService,
  ISOLATION_HOST,
  ISOLATION_PORT,
  DEFAULT_TARGET_SCHEMA,
  DEFAULT_RESTRICTED_USER,
  TARGET_PRIVILEGES,
  FORBIDDEN_PRIVILEGES,
  IsolationError,
};

export type {
  ProvisionedService,
  GateCheck,
  IsolationGateResult,
  ImportOutcome,
  InspectionResult,
  TeardownResult,
};
