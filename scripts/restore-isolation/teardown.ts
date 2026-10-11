import { execFileSync } from 'node:child_process';

import {
  ISOLATION_HOST,
  ISOLATION_PORT,
  executableIn,
  isPortListening,
  scrubSecrets,
} from './config.ts';
import { pidFileMatchesService, type ProvisionedService } from './provision-target.ts';

/**
 * Teardown stops the isolated service and does nothing else.
 *
 * No DROP, no TRUNCATE, no DELETE, no overwrite, no user removal -- not of the target
 * schema, not of the target database, not of the restricted user. The data directory
 * is left in place on purpose so the restored state remains inspectable afterwards.
 * Destructive cleanup is not implemented and there is deliberately no flag that turns
 * it on; adding one would need recorded owner approval first.
 */

export const TEARDOWN_POLICY =
  'teardown stops the isolated mysqld only: no DROP/TRUNCATE/DELETE/overwrite anywhere, ' +
  'no user removal, and the data directory is left in place';

export interface TeardownResult {
  stopped: boolean;
  method: 'mysqladmin-shutdown' | 'process-terminate' | 'already-stopped' | 'not-stopped';
  detail: string;
  datadirLeftInPlace: string;
  destructiveOperations: 'none';
}

export interface TeardownOptions {
  binDir: string;
  /** Max wait for the port to close after shutdown. */
  waitMs?: number;
  /** Max wait for the server to answer the graceful shutdown request. */
  gracefulMs?: number;
}

function mysqladminArgs(): string[] {
  return [
    '--no-defaults',
    '--protocol=TCP',
    `--host=${ISOLATION_HOST}`,
    `--port=${ISOLATION_PORT}`,
    '--user=root',
    '--connect-timeout=5',
    'shutdown',
  ];
}

async function waitForPortClosed(port: number, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!(await isPortListening(port))) return true;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return !(await isPortListening(port));
}

/**
 * Stop the service we started. Safe to call once; calling it twice reports
 * `already-stopped` rather than trying again.
 */
export async function teardownService(
  service: ProvisionedService,
  options: TeardownOptions,
): Promise<TeardownResult> {
  const binDir = options.binDir || service.binDir;
  const datadirLeftInPlace = service.datadir;

  if (!(await isPortListening(ISOLATION_PORT))) {
    return {
      stopped: true,
      method: 'already-stopped',
      detail: `nothing is listening on ${ISOLATION_HOST}:${ISOLATION_PORT}`,
      datadirLeftInPlace,
      destructiveOperations: 'none',
    };
  }

  let gracefulError = '';
  try {
    execFileSync(executableIn(binDir, 'mysqladmin.exe'), mysqladminArgs(), {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      timeout: options.gracefulMs ?? 15000,
    });
  } catch (error) {
    const err = error as { stderr?: string; stdout?: string; message?: string };
    // A "server is shutting down" error means the request landed; only a genuine
    // failure leaves the port open and needs the fallback below.
    gracefulError = scrubSecrets(
      String(err.stderr ?? '').trim() || String(err.stdout ?? '').trim() || String(err.message ?? error),
      [service.rootConnection.password],
    );
  }

  if (await waitForPortClosed(ISOLATION_PORT, options.waitMs ?? 20000)) {
    return {
      stopped: true,
      method: 'mysqladmin-shutdown',
      detail: `mysqld on ${ISOLATION_HOST}:${ISOLATION_PORT} stopped via mysqladmin shutdown`,
      datadirLeftInPlace,
      destructiveOperations: 'none',
    };
  }

  // Graceful shutdown did not land. Terminate only the process we spawned, and only
  // when the pid file still names it -- never a pid we merely guessed.
  if (service.pid !== null && pidFileMatchesService(service)) {
    try {
      execFileSync('taskkill', ['/PID', String(service.pid), '/T'], {
        stdio: 'ignore',
        windowsHide: true,
        timeout: 15000,
      });
    } catch {
      // Below we re-check the port and report honestly rather than pretending.
    }
    if (await waitForPortClosed(ISOLATION_PORT, 10000)) {
      return {
        stopped: true,
        method: 'process-terminate',
        detail:
          `graceful shutdown did not land (${gracefulError || 'no response'}); ` +
          `terminated the mysqld we started (pid ${service.pid}) as recorded in ${service.pidFile}`,
        datadirLeftInPlace,
        destructiveOperations: 'none',
      };
    }
  }

  return {
    stopped: false,
    method: 'not-stopped',
    detail:
      `mysqld is still listening on ${ISOLATION_HOST}:${ISOLATION_PORT}. ` +
      `Graceful shutdown said: ${gracefulError || 'no response'}. ` +
      'Refusing to kill an unverified pid; stop it manually after checking the pid file.',
    datadirLeftInPlace,
    destructiveOperations: 'none',
  };
}
