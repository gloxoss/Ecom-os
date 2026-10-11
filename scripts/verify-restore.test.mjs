import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  runIsolatedRestore,
  provisionTargetService,
  createTargetSchemaAndUser,
  runIsolationGate,
  teardownService,
  resolveRestoreStatus,
  ISOLATION_PORT,
  ISOLATION_HOST,
  FORBIDDEN_PRIVILEGES,
  TARGET_PRIVILEGES,
} from './restore-isolation/index.ts';
import {
  assertIsolationConnection,
  runSql,
  queryRows,
  IsolationError,
} from './restore-isolation/config.ts';
import { importSqlText } from './restore-isolation/import-dump.ts';

/**
 * Hostile-dump tests for the isolated restore service.
 *
 * Every case runs inside the isolated service on 127.0.0.1:3309 that this file
 * provisions itself, against synthetic decoy schemas. Nothing here contacts a real
 * source, and port 3308 is never used -- one test proves the client refuses it.
 *
 * For every case the decoy source (`decoy_source`) is fingerprinted before and after
 * (row count, two independent CRC aggregates and CHECKSUM TABLE) and asserted byte
 * for byte unchanged.
 */

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const worktreeRoot = path.resolve(currentDir, '..');
const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ecomos-restore-fixtures-'));

const DECOY_SCHEMA = 'decoy_source';
const DECOY_TABLE = 'decoy_rows';

let sharedService = null;
let decoyBefore = null;
let caseIndex = 0;

function rootQuery(service, sql) {
  return runSql(service.rootConnection, sql, { binDir: service.binDir });
}

function fingerPrintDecoy(service) {
  const rows = queryRows(
    service.rootConnection,
    `SELECT COUNT(*), COALESCE(SUM(CRC32(CONCAT_WS('|', id, payload))), 0), ` +
      `COALESCE(SUM(CRC32(payload)), 0) FROM \`${DECOY_SCHEMA}\`.\`${DECOY_TABLE}\``,
    service.binDir,
  );
  const tableChecksum = queryRows(
    service.rootConnection,
    `CHECKSUM TABLE \`${DECOY_SCHEMA}\`.\`${DECOY_TABLE}\``,
    service.binDir,
  );
  return {
    rowCount: rows[0]?.[0] ?? null,
    contentCrc: rows[0]?.[1] ?? null,
    payloadCrc: rows[0]?.[2] ?? null,
    tableChecksum: tableChecksum[0]?.[1] ?? null,
  };
}

function decoyRowCount(service) {
  return queryRows(
    service.rootConnection,
    `SELECT COUNT(*) FROM \`${DECOY_SCHEMA}\`.\`${DECOY_TABLE}\``,
    service.binDir,
  )[0]?.[0];
}

function writeFixture(name, sql) {
  const file = path.join(fixtureDir, name);
  fs.writeFileSync(file, sql);
  return file;
}

before(async () => {
  sharedService = await provisionTargetService({ readyTimeoutMs: 90000 });
  assert.equal(sharedService.port, ISOLATION_PORT, 'the shared service must be on 3309');

  // Synthetic decoy "source" inside the isolated service. It stands in for a real
  // source schema: it is never granted to any importer, so any hostile dump that
  // reaches for it is refused.
  const setup = rootQuery(
    sharedService,
    [
      `CREATE DATABASE IF NOT EXISTS \`${DECOY_SCHEMA}\` CHARACTER SET utf8mb4;`,
      `CREATE TABLE IF NOT EXISTS \`${DECOY_SCHEMA}\`.\`${DECOY_TABLE}\` ` +
        '(id INT PRIMARY KEY, payload VARCHAR(64) NOT NULL);',
      `INSERT INTO \`${DECOY_SCHEMA}\`.\`${DECOY_TABLE}\` VALUES ` +
        "('1','alpha'),('2','beta'),('3','gamma'),('4','delta'),('5','epsilon');",
    ].join('\n'),
  );
  assert.equal(setup.ok, true, `decoy setup failed: ${setup.error ?? ''}`);

  decoyBefore = fingerPrintDecoy(sharedService);
  assert.equal(decoyBefore.rowCount, '5', 'the decoy must start with exactly 5 rows');
  assert.ok(decoyBefore.tableChecksum, 'CHECKSUM TABLE must report a checksum');
});

after(async () => {
  if (sharedService) {
    const down = await teardownService(sharedService, { binDir: sharedService.binDir });
    assert.equal(down.destructiveOperations, 'none', 'teardown must be non-destructive');
  }
});

/**
 * Run one hostile fixture through the real orchestration against the shared isolated
 * service, and assert the decoy was untouched.
 */
async function runFixtureCase(service, { name, sql, expect }) {
  caseIndex += 1;
  const schema = `case_${caseIndex}_target`;
  const user = `ru_case_${caseIndex}`;
  const dumpPath = writeFixture(`${caseIndex}-${name.replace(/[^A-Za-z0-9]+/g, '-')}.sql`, sql);

  const result = await runIsolatedRestore({
    dumpPath,
    targetSchema: schema,
    restrictedUser: user,
    // The caller owns this service, so the run never stops it; the shared service is
    // stopped once in the after() hook.
    existingService: service,
  });

  const gateChecks = result.checks.filter((check) => check.name.startsWith('gate-'));
  assert.ok(gateChecks.length > 0, 'the gate must have run for this case');
  assert.equal(
    gateChecks.every((check) => check.ok),
    true,
    `the isolation gate must pass before any dump SQL is read: ${JSON.stringify(gateChecks)}`,
  );
  assert.equal(result.gate?.ok, true, 'gate.ok must be true');
  assert.equal(result.service?.port, ISOLATION_PORT, 'the target must be on 3309');
  assert.equal(result.service?.targetSchema, schema);
  assert.equal(result.service?.restrictedUser, user);

  const after = fingerPrintDecoy(service);
  assert.deepEqual(after, decoyBefore, `decoy_source changed during case "${name}"`);

  if (expect.status) {
    assert.equal(result.status, expect.status, `status for "${name}": ${result.reason}`);
  }
  if (expect.importOk !== undefined) {
    assert.equal(result.importOutcome?.ok, expect.importOk, `import outcome for "${name}"`);
  }
  if (expect.reasonIncludes) {
    for (const fragment of expect.reasonIncludes) {
      assert.ok(
        result.reason.includes(fragment),
        `reason for "${name}" should include ${JSON.stringify(fragment)}; got: ${result.reason}`,
      );
    }
  }
  if (expect.reasonMatches) {
    assert.match(result.reason, expect.reasonMatches, `reason for "${name}"`);
  }
  return { result, schema, user, after };
}

// ---------------------------------------------------------------------------
// Hostile fixtures
// ---------------------------------------------------------------------------

const hostileCases = [
  {
    name: 'USE other_db then INSERT',
    sql: [
      'CREATE TABLE probe_table (id INT PRIMARY KEY);',
      `USE \`${DECOY_SCHEMA}\`;`,
      `INSERT INTO \`${DECOY_TABLE}\` (id, payload) VALUES (999, 'intruder');`,
    ].join('\n'),
    expect: {
      status: 'FAIL',
      importOk: false,
      reasonIncludes: [DECOY_SCHEMA, 'not privileged on'],
    },
  },
  {
    name: 'fully qualified other_db.table insert',
    sql: [
      'CREATE TABLE probe_table (id INT PRIMARY KEY);',
      `INSERT INTO \`${DECOY_SCHEMA}\`.\`${DECOY_TABLE}\` (id, payload) VALUES (1000, 'intruder');`,
    ].join('\n'),
    expect: { status: 'FAIL', importOk: false },
  },
  {
    name: 'CREATE TRIGGER',
    sql: [
      'CREATE TABLE probe_table (id INT PRIMARY KEY);',
      'CREATE TRIGGER probe_trig BEFORE INSERT ON probe_table FOR EACH ROW SET @probe = 1;',
    ].join('\n'),
    expect: { status: 'FAIL', importOk: false },
    afterAssert: ({ schema }) => {
      const triggers = rootQuery(
        sharedService,
        `SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = '${schema}'`,
      );
      assert.equal(triggers.stdout, '0', 'no trigger may be created');
    },
  },
  {
    name: 'CREATE EVENT',
    sql: [
      'CREATE TABLE probe_table (id INT PRIMARY KEY);',
      'CREATE EVENT probe_event ON SCHEDULE EVERY 1 DAY DO SELECT 1;',
    ].join('\n'),
    expect: { status: 'FAIL', importOk: false },
    afterAssert: ({ schema }) => {
      const events = rootQuery(
        sharedService,
        `SELECT COUNT(*) FROM information_schema.events WHERE event_schema = '${schema}'`,
      );
      assert.equal(events.stdout, '0', 'no event may be created');
    },
  },
  {
    name: 'CREATE PROCEDURE',
    sql: [
      'CREATE TABLE probe_table (id INT PRIMARY KEY);',
      'CREATE PROCEDURE probe_proc() SELECT 1;',
    ].join('\n'),
    expect: { status: 'FAIL', importOk: false },
    afterAssert: ({ schema }) => {
      const routines = rootQuery(
        sharedService,
        `SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = '${schema}'`,
      );
      assert.equal(routines.stdout, '0', 'no routine may be created');
    },
  },
  {
    name: 'LOAD DATA LOCAL INFILE',
    sql: [
      'CREATE TABLE probe_table (id INT PRIMARY KEY, v VARCHAR(64));',
      "LOAD DATA LOCAL INFILE 'C:/Windows/win.ini' INTO TABLE probe_table;",
    ].join('\n'),
    expect: { status: 'FAIL', importOk: false },
    afterAssert: ({ schema }) => {
      const rows = rootQuery(
        sharedService,
        `SELECT COUNT(*) FROM \`${schema}\`.\`probe_table\``,
      );
      assert.equal(rows.stdout, '0', 'LOCAL INFILE must not load anything');
    },
  },
  {
    name: 'SELECT ... INTO OUTFILE',
    sql: [
      'CREATE TABLE probe_table (id INT PRIMARY KEY);',
      'INSERT INTO probe_table (id) VALUES (1);',
      `SELECT * FROM probe_table INTO OUTFILE '${path
        .join(fixtureDir, 'exfiltrated.csv')
        .replace(/\\/g, '/')}';`,
    ].join('\n'),
    expect: { status: 'FAIL', importOk: false },
    afterAssert: () => {
      const target = path.join(fixtureDir, 'exfiltrated.csv');
      assert.equal(fs.existsSync(target), false, 'INTO OUTFILE must not write a file');
    },
  },
  {
    name: 'GRANT ALL ON *.*',
    sql: [
      'CREATE TABLE probe_table (id INT PRIMARY KEY);',
      "GRANT ALL PRIVILEGES ON *.* TO 'nobody'@'%';",
    ].join('\n'),
    expect: { status: 'FAIL', importOk: false },
    afterAssert: () => {
      const granted = rootQuery(
        sharedService,
        "SELECT COUNT(*) FROM mysql.user WHERE user = 'nobody'",
      );
      assert.equal(granted.stdout, '0', 'GRANT must not create or widen an account');
    },
  },
  {
    name: 'CREATE USER',
    sql: [
      'CREATE TABLE probe_table (id INT PRIMARY KEY);',
      "CREATE USER 'intruder'@'%' IDENTIFIED BY 'irrelevant-not-a-secret';",
    ].join('\n'),
    expect: { status: 'FAIL', importOk: false },
    afterAssert: () => {
      const users = rootQuery(
        sharedService,
        "SELECT COUNT(*) FROM mysql.user WHERE user = 'intruder'",
      );
      assert.equal(users.stdout, '0', 'CREATE USER must be refused');
    },
  },
  {
    name: 'DROP DATABASE on the decoy',
    sql: [
      'CREATE TABLE probe_table (id INT PRIMARY KEY);',
      `DROP DATABASE \`${DECOY_SCHEMA}\`;`,
    ].join('\n'),
    expect: { status: 'FAIL', importOk: false },
    afterAssert: () => {
      assert.equal(decoyRowCount(sharedService), '5', 'the decoy must still have its rows');
    },
  },
  {
    name: 'TRUNCATE the decoy table',
    sql: [
      'CREATE TABLE probe_table (id INT PRIMARY KEY);',
      `TRUNCATE TABLE \`${DECOY_SCHEMA}\`.\`${DECOY_TABLE}\`;`,
    ].join('\n'),
    expect: { status: 'FAIL', importOk: false },
    afterAssert: () => {
      assert.equal(decoyRowCount(sharedService), '5', 'the decoy must not be truncated');
    },
  },
  {
    name: 'DELETE FROM the decoy table',
    sql: [
      'CREATE TABLE probe_table (id INT PRIMARY KEY);',
      `DELETE FROM \`${DECOY_SCHEMA}\`.\`${DECOY_TABLE}\`;`,
    ].join('\n'),
    expect: { status: 'FAIL', importOk: false },
    afterAssert: () => {
      assert.equal(decoyRowCount(sharedService), '5', 'the decoy must not lose rows');
    },
  },
  {
    name: 'empty dump, zero tables',
    sql: [
      '-- MySQL dump 10.13  (synthetic fixture: no tables at all)',
      '/*!40101 SET NAMES utf8mb4 */;',
      'SET @synthetic_empty_marker = 1;',
    ].join('\n'),
    expect: {
      status: 'FAIL',
      importOk: true,
      reasonIncludes: ['tables-imported'],
    },
  },
  {
    name: 'partial / aborted import',
    sql: [
      'CREATE TABLE partial_a (id INT PRIMARY KEY);',
      'CREATE TABLE partial_b (id INT PRIMARY KEY);',
      'INSERT INTO partial_a (id) VALUES (1);',
      `USE \`${DECOY_SCHEMA}\`;`,
      'CREATE TABLE never_reached (id INT PRIMARY KEY);',
    ].join('\n'),
    expect: {
      status: 'FAIL',
      importOk: false,
      reasonIncludes: ['Partial state', 'partial_a', 'partial_b'],
    },
  },
];

for (const fixtureCase of hostileCases) {
  test(`closed boundary: ${fixtureCase.name}`, { timeout: 180000 }, async () => {
    const outcome = await runFixtureCase(sharedService, fixtureCase);
    if (fixtureCase.afterAssert) fixtureCase.afterAssert(outcome);
    if (fixtureCase.name === 'empty dump, zero tables') {
      assert.equal(
        outcome.result.inspection?.tableCount,
        0,
        'the empty dump must be reported as zero tables',
      );
      const tablesCheck = outcome.result.inspection?.checks.find(
        (check) => check.name === 'tables-imported',
      );
      assert.equal(tablesCheck?.ok, false, 'a zero-table import must FAIL, never succeed');
    }
    if (fixtureCase.name === 'partial / aborted import') {
      const partial = outcome.result.importOutcome?.partialTables ?? [];
      assert.deepEqual(partial.sort(), ['partial_a', 'partial_b'], 'the partial state must be named');
      assert.ok(
        outcome.result.importOutcome?.failedAtLine !== null,
        'the aborted import must report where it stopped',
      );
      assert.equal(
        outcome.result.reason.includes('never_reached'),
        false,
        'a statement after the abort must not have run',
      );
    }
  });
}

// ---------------------------------------------------------------------------
// Positive control and fail-closed behaviour
// ---------------------------------------------------------------------------

test('compliant synthetic dump restores and inspects inside the isolated service', { timeout: 180000 }, async () => {
  const sql = [
    '-- MySQL dump 10.13 (synthetic compliant fixture)',
    'CREATE TABLE wp_wc_orders (id BIGINT PRIMARY KEY, status VARCHAR(20), total_amount DECIMAL(12,2), customer_id BIGINT);',
    "INSERT INTO wp_wc_orders VALUES (1, 'processing', 42.00, 0), (2, 'completed', 12.50, 7);",
    'CREATE TABLE wp_woocommerce_order_items (order_item_id BIGINT PRIMARY KEY, order_id BIGINT);',
    'INSERT INTO wp_woocommerce_order_items VALUES (1, 1), (2, 2);',
    'CREATE TABLE wp_woocommerce_order_itemmeta (meta_id BIGINT PRIMARY KEY, order_item_id BIGINT, meta_key VARCHAR(64), meta_value LONGTEXT);',
    "INSERT INTO wp_woocommerce_order_itemmeta VALUES (1, 1, '_qty', '2'), (2, 1, '_variation_id', '0'), (3, 2, '_qty', '1');",
    'CREATE TABLE wp_ecomos_rfq_quotes (id VARCHAR(64) PRIMARY KEY, state VARCHAR(32), converted_order_id BIGINT UNSIGNED NULL);',
    "INSERT INTO wp_ecomos_rfq_quotes VALUES ('q1', 'accepted', 2);",
    'CREATE TABLE wp_ecomos_rfq_revisions (id BIGINT AUTO_INCREMENT PRIMARY KEY, quote_id VARCHAR(64), revision_id VARCHAR(32));',
    "INSERT INTO wp_ecomos_rfq_revisions (quote_id, revision_id) VALUES ('q1', 'r1');",
  ].join('\n');

  const outcome = await runFixtureCase(sharedService, {
    name: 'compliant-control',
    sql,
    expect: { status: 'VERIFIED', importOk: true },
  });

  const failed = outcome.result.checks.filter((check) => !check.ok);
  assert.deepEqual(failed, [], `no check should fail: ${JSON.stringify(failed)}`);
  assert.equal(outcome.result.inspection?.tableCount, 5);
  assert.equal(outcome.result.inspection?.prefix, 'wp_');
  for (const name of [
    'hpos-orders-present',
    'hpos-order-itemmeta-qty',
    'hpos-order-itemmeta-variation-id',
    'rfq-quote-order-link-integrity',
    'rfq-revisions-reference-quotes',
  ]) {
    const found = outcome.result.checks.find((check) => check.name === name);
    assert.ok(found, `expected check ${name}`);
    assert.equal(found.ok, true, `check ${name} should pass: ${found.detail}`);
  }
});

test('a gate failure imports nothing (fail-closed)', { timeout: 180000 }, async () => {
  caseIndex += 1;
  const schema = `case_${caseIndex}_gated`;
  const user = `ru_case_${caseIndex}`;
  const dumpPath = writeFixture(
    `${caseIndex}-gated.sql`,
    ['-- MySQL dump 10.13', 'CREATE TABLE probe_table (id INT PRIMARY KEY);'].join('\n'),
  );

  // A service whose reported datadir is not the one provisioned must fail the gate.
  const tampered = { ...sharedService, datadir: path.join(fixtureDir, 'not-the-real-datadir') };
  const result = await runIsolatedRestore({
    dumpPath,
    targetSchema: schema,
    restrictedUser: user,
    existingService: tampered,
  });

  assert.equal(result.status, 'FAIL');
  assert.equal(result.gate?.ok, false);
  assert.ok(
    result.gate?.failed.includes('gate-datadir'),
    `gate-datadir must be the failing gate: ${JSON.stringify(result.gate?.failed)}`,
  );
  assert.equal(result.importOutcome, null, 'nothing may be imported when the gate fails');
  assert.ok(
    result.reason.includes('no SQL from the dump was read'),
    `reason must state that no SQL was read: ${result.reason}`,
  );

  const tables = rootQuery(
    sharedService,
    `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '${schema}'`,
  );
  assert.equal(tables.stdout, '0', 'the target schema must be empty after a gate failure');
  assert.deepEqual(fingerPrintDecoy(sharedService), decoyBefore);
});

test('the status policy maps stage outcomes to the documented exit codes', () => {
  assert.equal(
    resolveRestoreStatus({ gateOk: true, importOk: true, inspectionOk: true, teardownStopped: true }),
    'VERIFIED',
  );
  assert.equal(
    resolveRestoreStatus({ gateOk: true, importOk: true, inspectionOk: true, teardownStopped: false }),
    'PARTIAL',
  );
  for (const stage of [
    { gateOk: false, importOk: true, inspectionOk: true },
    { gateOk: true, importOk: false, inspectionOk: true },
    { gateOk: true, importOk: true, inspectionOk: false },
  ]) {
    assert.equal(resolveRestoreStatus({ ...stage, teardownStopped: true }), 'FAIL');
  }
});

test('the client refuses any service that is not the isolated one', () => {
  // Port 3308 belongs to someone else and is never contacted.
  assert.throws(
    () =>
      assertIsolationConnection({
        label: 'source',
        host: '127.0.0.1',
        port: 3308,
        user: 'root',
      }),
    (error) => error instanceof IsolationError && error.gate === 'connection-target',
  );
  assert.throws(
    () =>
      assertIsolationConnection({
        label: 'elsewhere',
        host: '10.0.0.5',
        port: ISOLATION_PORT,
        user: 'root',
      }),
    (error) => error instanceof IsolationError,
  );
  assert.doesNotThrow(() =>
    assertIsolationConnection({ label: 'ok', host: ISOLATION_HOST, port: ISOLATION_PORT, user: 'root' }),
  );
});

test('the importer refuses to run as root', async () => {
  const rootConnection = { ...sharedService.rootConnection, database: 'restore_target' };
  assert.throws(
    () => importSqlText(rootConnection, 'SELECT 1;', sharedService.binDir),
    (error) => error instanceof IsolationError && error.gate === 'import-as-root',
  );
});

test('a configured source on the isolation port is refused before provisioning', async () => {
  const result = await runIsolatedRestore({
    dumpPath: writeFixture('port-clash.sql', '-- MySQL dump 10.13\nSET @x = 1;'),
    sourcePort: ISOLATION_PORT,
  });
  assert.equal(result.status, 'FAIL');
  assert.match(result.reason, /equals the isolation port 3309/);
});

test('the restricted user holds the target-only privilege set and nothing else', async () => {
  caseIndex += 1;
  const schema = `case_${caseIndex}_grants`;
  const user = `ru_case_${caseIndex}`;
  const access = createTargetSchemaAndUser(sharedService, { schema, user });

  const grants = runSql(access.connection, 'SHOW GRANTS', { binDir: sharedService.binDir }).stdout;
  const upper = grants.toUpperCase();
  for (const forbidden of FORBIDDEN_PRIVILEGES) {
    assert.equal(
      upper.includes(forbidden.toUpperCase()),
      false,
      `the importer must not hold ${forbidden}: ${grants}`,
    );
  }
  for (const privilege of TARGET_PRIVILEGES) {
    assert.ok(upper.includes(privilege), `the importer should hold ${privilege}: ${grants}`);
  }
  assert.match(
    grants,
    new RegExp(`ON \`?${schema}\`?\\.\\*`, 'i'),
    `grants should be scoped to the target: ${grants}`,
  );

  const gate = runIsolationGate(
    access.connection,
    {
      port: ISOLATION_PORT,
      host: ISOLATION_HOST,
      datadir: sharedService.datadir,
      user,
      schema,
    },
    sharedService.binDir,
  );
  assert.equal(gate.ok, true, JSON.stringify(gate.checks.filter((c) => !c.ok)));
});

test('the implementation contains no destructive SQL statement', () => {
  const files = [
    'restore-isolation/config.ts',
    'restore-isolation/provision-target.ts',
    'restore-isolation/gate.ts',
    'restore-isolation/import-dump.ts',
    'restore-isolation/inspect.ts',
    'restore-isolation/teardown.ts',
    'restore-isolation/index.ts',
    'verify-restore.ts',
  ];
  const destructive = [
    /\bDROP\s+(?:DATABASE|TABLE|SCHEMA|USER|VIEW|TRIGGER|EVENT|PROCEDURE|FUNCTION)\b/i,
    /\bTRUNCATE\s+[A-Za-z_`]/i,
    /\bDELETE\s+FROM\b/i,
  ];
  for (const relative of files) {
    const absolute = path.join(worktreeRoot, 'scripts', relative);
    assert.ok(fs.existsSync(absolute), `${relative} must exist`);
    const lines = fs.readFileSync(absolute, 'utf8').split(/\r?\n/);
    lines.forEach((rawLine, index) => {
      const line = rawLine.trim();
      if (line.startsWith('*') || line.startsWith('//') || line.startsWith('/*')) return;
      for (const pattern of destructive) {
        assert.equal(
          pattern.test(line),
          false,
          `${relative}:${index + 1} contains a destructive statement: ${line}`,
        );
      }
    });
  }
});

test('no fixture or test file references the real source or a non-isolated target', () => {
  const thisFile = fs.readFileSync(path.join(worktreeRoot, 'scripts', 'verify-restore.test.mjs'), 'utf8');
  assert.equal(ISOLATION_PORT, 3309, 'the isolation port must be 3309');
  // Built at runtime so this assertion does not match its own literal.
  const realSourceSchema = ['ecomos', 'wp'].join('_');
  assert.equal(
    thisFile.includes(realSourceSchema),
    false,
    'no test may reference the real source schema',
  );
  // The only place 3308 is named as a connection target is the negative assertion above.
  const portTargets = thisFile.match(/port:\s*3308/g) ?? [];
  assert.equal(portTargets.length, 1, 'port 3308 may only appear in the refusal assertion');
});
