import {
  FORBIDDEN_PRIVILEGES,
  ISOLATION_HOST,
  ISOLATION_PORT,
  TARGET_PRIVILEGES,
  normaliseFsPath,
  runSql,
  type MysqlConnection,
} from './config.ts';

/**
 * Fail-closed isolation gate.
 *
 * Runs over the *target* connection, as the restricted user, BEFORE any byte of the
 * dump is read. If a single check is false the caller must import nothing and exit
 * non-zero naming the failing gate. These checks exist because service-identity
 * confusion (the import silently landing on the source service) is the exact failure
 * being prevented, so it is proved rather than assumed.
 */

export interface GateCheck {
  name: string;
  ok: boolean;
  detail: string;
}

export interface GateExpectation {
  port: number;
  host: string;
  datadir: string;
  user: string;
  schema: string;
  /** A configured source port, if the caller has one. Must differ from the isolation port. */
  sourcePort?: number | undefined;
}

export interface IsolationGateResult {
  ok: boolean;
  checks: GateCheck[];
  failed: string[];
}

const SYSTEM_SCHEMAS = ['information_schema', 'mysql', 'performance_schema', 'sys'];

interface ParsedGrant {
  privileges: string[];
  scope: string;
  scopeSchema: string | null;
  global: boolean;
  withGrantOption: boolean;
}

/** Parse one `SHOW GRANTS` line. Returns null when the line is not a GRANT. */
export function parseGrant(line: string): ParsedGrant | null {
  const match = /^\s*GRANT\s+(.+?)\s+ON\s+(.+?)\s+TO\s+/i.exec(line);
  if (!match) return null;
  const privileges = (match[1] ?? '')
    .split(',')
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);
  const scope = (match[2] ?? '').trim();
  const cleanScope = scope.replace(/`/g, '');
  const global = cleanScope === '*.*' || cleanScope === '*' || cleanScope === '*.*.*';
  let scopeSchema: string | null = null;
  if (!global) {
    const dot = cleanScope.indexOf('.');
    scopeSchema = dot === -1 ? cleanScope : cleanScope.slice(0, dot);
  }
  return {
    privileges,
    scope: cleanScope,
    scopeSchema,
    global,
    withGrantOption: /WITH\s+GRANT\s+OPTION/i.test(line),
  };
}

function check(name: string, ok: boolean, detail: string): GateCheck {
  return { name, ok, detail };
}

/**
 * Evaluate the gate. `expected.user` must match the connection's CURRENT_USER()
 * username; `expected.schema` is the only schema the restricted user may touch.
 */
export function runIsolationGate(
  conn: MysqlConnection,
  expected: GateExpectation,
  binDir: string,
): IsolationGateResult {
  const checks: GateCheck[] = [];

  const query = (sql: string) => runSql(conn, sql, { binDir });

  // 1. The connection must be on the isolation socket, not the source service.
  const portResult = query('SELECT @@port');
  const reportedPort = portResult.stdout.trim();
  checks.push(
    check(
      'gate-port',
      portResult.ok && reportedPort === String(expected.port),
      portResult.ok
        ? `@@port = ${reportedPort} (expected ${expected.port})`
        : `could not read @@port: ${portResult.error}`,
    ),
  );

  // 2. The service must be the one we provisioned, judged by its data directory.
  const datadirResult = query('SELECT @@datadir');
  const reportedDatadir = datadirResult.stdout.trim();
  const datadirOk =
    datadirResult.ok &&
    Boolean(reportedDatadir) &&
    normaliseFsPath(reportedDatadir) === normaliseFsPath(expected.datadir);
  checks.push(
    check(
      'gate-datadir',
      datadirOk,
      datadirResult.ok
        ? `@@datadir = ${reportedDatadir} (expected ${expected.datadir})`
        : `could not read @@datadir: ${datadirResult.error}`,
    ),
  );

  // 3. The importing identity must be the restricted user, not root.
  const userResult = query('SELECT CURRENT_USER()');
  const currentUser = userResult.stdout.trim();
  const currentUserName = currentUser.split('@')[0] ?? '';
  checks.push(
    check(
      'gate-identity',
      userResult.ok && currentUserName === expected.user,
      userResult.ok
        ? `CURRENT_USER() = ${currentUser} (expected user ${expected.user}, never root)`
        : `could not read CURRENT_USER(): ${userResult.error}`,
    ),
  );

  // 4-7. Effective grants: no global privilege, no second schema, no GRANT OPTION,
  // and no privilege outside the target-only set.
  const grantsResult = query('SHOW GRANTS');
  const grantLines = grantsResult.ok
    ? grantsResult.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    : [];
  const grants = grantLines
    .map((line) => parseGrant(line))
    .filter((grant): grant is ParsedGrant => grant !== null);

  const globalViolations = grants.filter(
    (grant) => grant.global && !(grant.privileges.length === 1 && grant.privileges[0] === 'USAGE'),
  );
  checks.push(
    check(
      'gate-no-global-privilege',
      grantsResult.ok && globalViolations.length === 0,
      grantsResult.ok
        ? globalViolations.length === 0
          ? `no global privilege (${grants.filter((g) => g.global).length} USAGE-only global grant(s))`
          : `global privilege found: ${globalViolations.map((g) => g.scope).join(', ')}`
        : `could not read SHOW GRANTS: ${grantsResult.error}`,
    ),
  );

  const otherSchemas = grants
    .filter((grant) => !grant.global)
    .map((grant) => grant.scopeSchema)
    .filter((schema): schema is string => Boolean(schema) && schema !== expected.schema);
  checks.push(
    check(
      'gate-target-only-grants',
      grantsResult.ok && otherSchemas.length === 0,
      grantsResult.ok
        ? otherSchemas.length === 0
          ? `all schema grants are on \`${expected.schema}\` only`
          : `grant on a non-target schema: ${otherSchemas.join(', ')}`
        : `could not determine granted schemas: ${grantsResult.error}`,
    ),
  );

  const grantOption = grants.filter((grant) => grant.withGrantOption);
  checks.push(
    check(
      'gate-no-grant-option',
      grantsResult.ok && grantOption.length === 0,
      grantsResult.ok
        ? grantOption.length === 0
          ? 'no WITH GRANT OPTION'
          : 'WITH GRANT OPTION present'
        : `could not determine GRANT OPTION: ${grantsResult.error}`,
    ),
  );

  const allowed = new Set(TARGET_PRIVILEGES.map((value) => value.toUpperCase()));
  const forbidden = new Set(FORBIDDEN_PRIVILEGES.map((value) => value.toUpperCase()));
  const privilegeViolations: string[] = [];
  for (const grant of grants) {
    if (grant.privileges.length === 1 && grant.privileges[0] === 'USAGE') continue;
    for (const privilege of grant.privileges) {
      if (forbidden.has(privilege) || !allowed.has(privilege)) {
        privilegeViolations.push(`${privilege} (on ${grant.scope})`);
      }
    }
  }
  checks.push(
    check(
      'gate-restricted-privilege-set',
      grantsResult.ok && privilegeViolations.length === 0,
      grantsResult.ok
        ? privilegeViolations.length === 0
          ? `grants are limited to ${TARGET_PRIVILEGES.join(', ')}`
          : `privilege outside the target-only set: ${privilegeViolations.join('; ')}`
        : `could not evaluate privilege set: ${grantsResult.error}`,
    ),
  );

  // 8. The importing identity must not even be able to see a source schema.
  const schemasResult = query(
    'SELECT schema_name FROM information_schema.schemata ORDER BY schema_name',
  );
  const visible = schemasResult.ok
    ? schemasResult.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    : [];
  const unexpected = visible.filter(
    (schema) => !SYSTEM_SCHEMAS.includes(schema) && schema !== expected.schema,
  );
  checks.push(
    check(
      'gate-no-source-schema',
      schemasResult.ok && unexpected.length === 0,
      schemasResult.ok
        ? unexpected.length === 0
          ? `visible schemas: ${visible.join(', ') || '(none)'}`
          : `a non-target schema is visible to the importer: ${unexpected.join(', ')}`
        : `could not list schemata: ${schemasResult.error}`,
    ),
  );

  // 9. File-based exfiltration/import must be off even before grants are considered.
  const fileResult = query("SELECT @@local_infile, @@secure_file_priv");
  const [localInfile = '', secureFilePriv = ''] = fileResult.ok
    ? (fileResult.stdout || '').split('\t')
    : [];
  const securePrivOk =
    Boolean(secureFilePriv.trim()) &&
    normaliseFsPath(secureFilePriv).startsWith(normaliseFsPath(expected.datadir).replace(/\/data$/, ''));
  checks.push(
    check(
      'gate-no-file-io',
      fileResult.ok && localInfile.trim() === '0' && securePrivOk,
      fileResult.ok
        ? `local_infile=${localInfile.trim()}, secure_file_priv=${secureFilePriv.trim()}`
        : `could not read file-I/O settings: ${fileResult.error}`,
    ),
  );

  // 10. A configured source must be a different service entirely.
  if (expected.sourcePort !== undefined) {
    checks.push(
      check(
        'gate-source-port-distinct',
        expected.sourcePort !== expected.port,
        `configured source port ${expected.sourcePort} vs isolation port ${expected.port}`,
      ),
    );
  }

  const failed = checks.filter((item) => !item.ok).map((item) => item.name);
  return { ok: failed.length === 0, checks, failed };
}

export { ISOLATION_HOST, ISOLATION_PORT };
