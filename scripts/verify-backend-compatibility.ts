import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Backend compatibility audit (static declaration gate).
 *
 * This is a gate on required metadata, not a compatibility test: it only proves that
 * each required plugin exists and declares the headers a real compatibility run
 * depends on. It fails closed. An absent directory, an empty plugin set, or a missing
 * HPOS declaration is a FAIL, never a silent skip - an earlier revision reported
 * every plugin as PASS with hasHposDeclaration hardcoded true, so it certified a
 * directory with no plugins at all.
 *
 * Real compatibility exercise (HPOS order operations, Store API requests) lives in
 * plugins/tests, which needs a live WordPress + WooCommerce environment.
 */

/** Plugins the audit requires. An absent directory is a failure, not a skip. */
export const REQUIRED_PLUGINS = [
  'wp-ecomos-addons',
  'wp-ecomos-operations',
  'wp-ecomos-rfq',
] as const;

/** WooCommerce feature id a plugin must declare to opt into HPOS order tables. */
const HPOS_FEATURE_ID = 'custom_order_tables';

/** Plugin header declaring the minimum WooCommerce version. */
const WC_REQUIRES_HEADER = 'WC requires at least';

export interface PluginAudit {
  pluginName: string;
  directoryFound: boolean;
  phpFilesScanned: string[];
  hasHposDeclaration: boolean;
  hposEvidence: string | null;
  minPhpVersion: string | null;
  minWcVersion: string | null;
  issues: string[];
  status: 'PASS' | 'FAIL';
}

export interface BackendAudit {
  baseDir: string;
  plugins: PluginAudit[];
  missingPlugins: string[];
  overallStatus: 'PASS' | 'FAIL';
  reasons: string[];
}

interface PhpFile {
  file: string;
  /** Original source, for header parsing (headers live inside a docblock). */
  raw: string;
  /** Comment-stripped source, so commented-out code cannot satisfy a check. */
  code: string;
}

/**
 * Remove PHP comments. A declaration that only exists in a docblock or a commented
 * line is not a declaration, so it must not be counted here.
 */
function stripComments(php: string): string {
  const withoutBlockComments = php.replace(/\/\*[\s\S]*?\*\//g, '');
  return withoutBlockComments
    .split(/\r?\n/)
    .filter((line) => !/^\s*(\/\/|#)/.test(line))
    .join('\n');
}

function readPhpFiles(dir: string): PhpFile[] {
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.php'))
    .sort()
    .map((name) => {
      const raw = fs.readFileSync(path.join(dir, name), 'utf8');
      return { file: name, raw, code: stripComments(raw) };
    });
}

function findHposDeclaration(files: PhpFile[]): string | null {
  // A real opt-in is a declare_compatibility() call carrying the feature id, not a
  // mention of "custom_order_tables" anywhere in the file.
  const pattern = new RegExp(`declare_compatibility\\s*\\([^;]{0,400}?${HPOS_FEATURE_ID}`);
  for (const file of files) {
    if (pattern.test(file.code)) return file.file;
  }
  return null;
}

function readHeaderVersion(files: PhpFile[], label: string): string | null {
  const pattern = new RegExp(`${label}:\\s*([0-9]+(?:\\.[0-9]+)*)`);
  for (const file of files) {
    const match = file.raw.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

export function auditBackendPlugins(baseDir: string): BackendAudit {
  const plugins: PluginAudit[] = [];
  const missingPlugins: string[] = [];
  const reasons: string[] = [];

  for (const dir of REQUIRED_PLUGINS) {
    const fullDir = path.join(baseDir, 'plugins', dir);
    const issues: string[] = [];

    if (!fs.existsSync(fullDir) || !fs.statSync(fullDir).isDirectory()) {
      missingPlugins.push(dir);
      issues.push(`required plugin directory plugins/${dir} is missing`);
      reasons.push(`plugins/${dir}: directory not found`);
      plugins.push({
        pluginName: dir,
        directoryFound: false,
        phpFilesScanned: [],
        hasHposDeclaration: false,
        hposEvidence: null,
        minPhpVersion: null,
        minWcVersion: null,
        issues,
        status: 'FAIL',
      });
      continue;
    }

    const files = readPhpFiles(fullDir);

    if (files.length === 0) {
      issues.push('plugin directory contains no .php files');
    }

    const hposEvidence = findHposDeclaration(files);
    const hasHposDeclaration = hposEvidence !== null;
    if (!hasHposDeclaration) {
      issues.push(
        `no real declare_compatibility('${HPOS_FEATURE_ID}', ...) call found in plugin source`,
      );
    }

    const minPhpVersion = readHeaderVersion(files, 'Requires PHP');
    const minWcVersion = readHeaderVersion(files, WC_REQUIRES_HEADER);
    if (!minPhpVersion) issues.push('no "Requires PHP:" plugin header declared');
    if (!minWcVersion) issues.push(`no "${WC_REQUIRES_HEADER}:" plugin header declared`);

    const status: 'PASS' | 'FAIL' = issues.length === 0 ? 'PASS' : 'FAIL';
    if (status === 'FAIL') reasons.push(`plugins/${dir}: ${issues.join('; ')}`);

    plugins.push({
      pluginName: dir,
      directoryFound: true,
      phpFilesScanned: files.map((f) => f.file),
      hasHposDeclaration,
      hposEvidence,
      minPhpVersion,
      minWcVersion,
      issues,
      status,
    });
  }

  if (plugins.length === 0) {
    // Cannot happen with REQUIRED_PLUGINS above, but an empty audit must never certify.
    reasons.push('no plugins were audited; an empty plugin set cannot certify the backend');
  }

  const overallStatus: 'PASS' | 'FAIL' =
    plugins.length > 0 && plugins.every((p) => p.status === 'PASS') ? 'PASS' : 'FAIL';

  return { baseDir, plugins, missingPlugins, overallStatus, reasons };
}

function invokedDirectly(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    if (import.meta.url === pathToFileURL(entry).href) return true;
  } catch {
    // Fall through to the extension check below.
  }
  return entry.endsWith('verify-backend-compatibility.ts');
}

if (invokedDirectly()) {
  const arg = process.argv[2];
  const baseDir = arg && !arg.startsWith('-') ? path.resolve(arg) : process.cwd();

  console.log('--- EcomOS Backend Compatibility Audit (static declaration gate) ---');
  const audit = auditBackendPlugins(baseDir);
  console.log(JSON.stringify(audit, null, 2));

  if (audit.overallStatus !== 'PASS') {
    console.error(`\n[BACKEND-AUDIT-FAIL] ${audit.reasons.length} blocking issue(s):`);
    for (const reason of audit.reasons) console.error(`  - ${reason}`);
    console.error(
      'This gate fails closed: it will not certify a backend whose required plugins, ' +
        'HPOS declarations, or version headers are absent.',
    );
    process.exit(1);
  }

  console.log(
    '\n[BACKEND-AUDIT-PASS] All required plugins present with declared HPOS compatibility metadata.',
  );
}
