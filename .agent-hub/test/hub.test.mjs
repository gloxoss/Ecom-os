import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync, spawn } from 'node:child_process';

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ecomos-hub-test-'));
  t.after(() => {
    const resolved = fs.realpathSync(root);
    assert.equal(resolved.toLowerCase(), path.resolve(root).toLowerCase());
    assert(path.relative(fs.realpathSync(os.tmpdir()), resolved).startsWith('ecomos-hub-test-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  const hub = path.join(root, '.agent-hub'); fs.mkdirSync(path.join(hub, 'lib'), { recursive: true });
  for (const file of ['hub.mjs', 'config.json', 'lib/core.mjs']) fs.copyFileSync(path.join(source, file), path.join(hub, file));
  fs.writeFileSync(path.join(hub, 'tasks.json'), JSON.stringify([{ id: 'T1', title: 'First', phase: 0 }, { id: 'T2', title: 'Second', phase: 0 }, { id: 'T3', title: 'Next phase', phase: 1 }]));
  const env = { ...process.env, ECOM_HUB_ROOT: root, ECOM_HUB_STATE_DIR: path.join(hub, '.runtime') };
  function git(...args) {
    const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', windowsHide: true });
    assert.equal(result.status, 0, result.stderr); return result.stdout.trim();
  }
  git('init', '--quiet'); git('config', 'user.name', 'Hub test'); git('config', 'user.email', 'hub-test@example.test'); git('config', 'core.autocrlf', 'false');
  fs.writeFileSync(path.join(root, '.gitignore'), '.agent-hub/.runtime/\n'); git('add', '.agent-hub', '.gitignore'); git('commit', '--quiet', '-m', 'fixture baseline');
  function run(args, expected = 0) {
    const result = spawnSync(process.execPath, [path.join(hub, 'hub.mjs'), ...args], { cwd: root, env, encoding: 'utf8', windowsHide: true, timeout: 20000 });
    assert.equal(result.status, expected, result.stderr || result.error?.message); return result.stdout.trim();
  }
  const json = args => JSON.parse(run(args));
  function join(id, role = 'executor', lane = 'catalog') { run(['join', '--agent', id, '--role', role, '--lane', lane, '--tool', 'node-test']); }
  join('orch', 'orchestrator', 'orchestrator'); join('a'); join('b', 'executor', 'commerce'); join('v', 'verifier', 'verification');
  function assign(id, to, files, resources = '') { run(['assign', id, '--agent', 'orch', '--to', to, '--files', files, ...(resources ? ['--resources', resources] : [])]); }
  function claim(id, who, files, resources = '') { run(['claim', id, '--agent', who, '--files', files, ...(resources ? ['--resources', resources] : [])]); }
  function write(file, value = 'fixture\n') { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), value); }
  function commit(files) { git('add', '--', ...files); git('commit', '--quiet', '-m', 'test implementation'); return git('rev-parse', 'HEAD'); }
  function submit(id, who, sha, report) { run(['done', id, '--agent', who, '--commit', sha, '--evidence', report, '--summary', 'Synthetic implementation', '--checks', 'node --test -> PASS']); }
  function verify(id, sha, verdict = '--ok') {
    const report = `docs/ecomos/verification/${id}/report.md`;
    claim(id, 'v', report); write(report, 'Independent fixture execution PASS\n');
    run(['verify', id, '--agent', 'v', '--commit', sha, verdict, '--evidence', report, '--checks', 'independent test -> PASS']);
  }
  return { root, hub, env, git, run, json, join, assign, claim, write, commit, submit, verify };
}

test('assignment and phase prerequisites are mandatory', t => {
  const f = fixture(t);
  f.run(['claim', 'T1', '--agent', 'a', '--files', 'app/a.txt'], 1);
  f.run(['assign', 'T3', '--agent', 'orch', '--to', 'a', '--files', 'app/a.txt'], 1);
  assert.equal(f.json(['status']).tasks.T1.status, 'OPEN');
});
test('case-folded folder/file conflicts retain the first owner', t => {
  const f = fixture(t); f.assign('T1', 'a', 'app/Catalog'); f.assign('T2', 'b', 'app/catalog/item.ts');
  f.claim('T1', 'a', 'app/Catalog');
  f.run(['claim', 'T2', '--agent', 'b', '--files', 'app/catalog/item.ts'], 3);
  assert.equal(f.json(['status']).tasks.T1.claim.owner, 'a');
});
test('claims and evidence reject traversal, absolute, protected and secret paths', t => {
  const f = fixture(t);
  for (const file of ['../outside', 'C:/outside', 'app/../outside', 'plugins/wordpress-mcp', '.env.local', 'app/.ENV.production', 'app/.git/config', 'app/private.key', 'app/trailing.']) {
    f.run(['assign', 'T1', '--agent', 'orch', '--to', 'a', '--files', file], 1);
  }
});
test('junction aliases cannot escape root or bypass a claim', t => {
  const f = fixture(t); f.write('source/file.txt');
  fs.symlinkSync(path.join(f.root, 'source'), path.join(f.root, 'alias'), 'junction');
  f.assign('T1', 'a', 'source'); f.assign('T2', 'b', 'alias/file.txt'); f.claim('T1', 'a', 'source');
  f.run(['claim', 'T2', '--agent', 'b', '--files', 'alias/file.txt'], 3);
  fs.symlinkSync(os.tmpdir(), path.join(f.root, 'outside'), 'junction');
  f.run(['assign', 'T2', '--agent', 'orch', '--to', 'b', '--files', 'outside/target'], 1);
  f.write('.env.private/secret.txt', 'SYNTHETIC_ONLY');
  fs.symlinkSync(path.join(f.root, '.env.private'), path.join(f.root, 'hidden'), 'junction');
  f.run(['assign', 'T2', '--agent', 'orch', '--to', 'b', '--files', 'hidden/secret.txt'], 1);
  fs.symlinkSync(path.join(f.root, 'missing'), path.join(f.root, 'broken'), 'junction');
  f.run(['assign', 'T2', '--agent', 'orch', '--to', 'b', '--files', 'broken/file.txt'], 1);
});

test('lock recovery requires a provably terminated local process', t => {
  const f = fixture(t); const lock = path.join(f.hub, '.runtime/.lock'); fs.mkdirSync(lock);
  const owner = path.join(lock, 'owner.json');
  fs.writeFileSync(owner, JSON.stringify({ pid: process.pid, host: os.hostname(), token: 'live', createdAt: '2000-01-01' }));
  f.run(['unlock', '--agent', 'orch', '--note', 'Synthetic recovery check'], 3);
  assert.equal(JSON.parse(fs.readFileSync(owner)).token, 'live');
  const terminated = spawnSync(process.execPath, ['-e', 'process.stdout.write(String(process.pid))'], { encoding: 'utf8', windowsHide: true });
  assert.equal(terminated.status, 0);
  fs.writeFileSync(owner, JSON.stringify({ pid: Number(terminated.stdout), host: os.hostname(), token: 'dead' }));
  f.run(['unlock', '--agent', 'orch', '--note', 'Synthetic terminated process']);
  assert.equal(fs.existsSync(lock), false);
  assert.equal(f.json(['log']).at(-1).type, 'unlock');
});
test('exclusive resources conflict and can be acquired and released during a task', t => {
  const f = fixture(t); f.assign('T1', 'a', 'app/a', 'git-index'); f.assign('T2', 'b', 'app/b', 'git-index');
  f.claim('T1', 'a', 'app/a', 'git-index');
  f.run(['claim', 'T2', '--agent', 'b', '--files', 'app/b', '--resources', 'git-index'], 3);
  f.run(['resources', 'T1', '--agent', 'a', '--remove', 'git-index']); f.claim('T2', 'b', 'app/b', 'git-index');
});
test('stale claims remain owned until explicit orchestrator recovery', t => {
  const f = fixture(t); f.assign('T1', 'a', 'app/shared'); f.assign('T2', 'b', 'app/shared'); f.claim('T1', 'a', 'app/shared');
  const journal = path.join(f.hub, '.runtime/events.jsonl'); const events = fs.readFileSync(journal, 'utf8').trim().split('\n').map(JSON.parse);
  const last = events.at(-1); last.state.agents.a.lastSeen = '2000-01-01T00:00:00.000Z';
  fs.appendFileSync(journal, JSON.stringify({ ...last, seq: last.seq + 1, type: 'test-clock' }) + '\n');
  assert.deepEqual(f.json(['check']).staleAgents, ['a']);
  f.run(['claim', 'T2', '--agent', 'b', '--files', 'app/shared'], 3);
  f.run(['release', 'T1', '--agent', 'orch', '--force', '--note', 'Actual executor stopped; scope inspected']);
  f.claim('T2', 'b', 'app/shared');
});
test('partial work can resume without surrendering its files', t => {
  const f = fixture(t); f.assign('T1', 'a', 'app/a'); f.claim('T1', 'a', 'app/a');
  f.run(['progress', 'T1', '--agent', 'a', '--partial', '--note', 'One check remains']);
  f.run(['progress', 'T1', '--agent', 'a', '--resume', '--note', 'Check now available']);
  assert.equal(f.json(['status']).tasks.T1.status, 'IN_PROGRESS');
});
test('completion needs claimed committed report, clean checks and a clean claimed tree', t => {
  const f = fixture(t); const report = 'docs/ecomos/evidence/T1/report.md';
  f.assign('T1', 'a', `app/a,${report}`); f.claim('T1', 'a', `app/a,${report}`);
  f.write('app/a'); f.write(report, 'Executed tests PASS\n'); const sha = f.commit(['app/a', report]);
  f.write('app/a', 'uncommitted\n');
  f.run(['done', 'T1', '--agent', 'a', '--commit', sha, '--evidence', report, '--summary', 'Work', '--checks', 'test -> PASS'], 1);
  f.commit(['app/a']); const tip = f.git('rev-parse', 'HEAD');
  f.run(['done', 'T1', '--agent', 'a', '--commit', tip, '--evidence', report, '--summary', 'Work', '--checks', 'test -> BLOCKED'], 1);
  f.submit('T1', 'a', tip, report); assert.equal(f.json(['status']).tasks.T1.status, 'REVIEW');
});
test('broad folder claims cannot submit a secret or protected child', t => {
  const f = fixture(t); const report = 'docs/ecomos/evidence/T1/report.md';
  f.assign('T1', 'a', `bundle,${report}`); f.claim('T1', 'a', `bundle,${report}`);
  f.write('bundle/.env.local', 'SYNTHETIC_TEST_ONLY=1\n'); f.write(report); const sha = f.commit(['bundle', report]);
  f.run(['done', 'T1', '--agent', 'a', '--commit', sha, '--evidence', report, '--summary', 'Work', '--checks', 'test -> PASS'], 1);
  assert.equal(f.json(['status']).tasks.T1.status, 'IN_PROGRESS');
});
test('interleaved registered commits pass while unauthorized own tip edits fail', t => {
  const f = fixture(t); const r1 = 'docs/ecomos/evidence/T1/report.md', r2 = 'docs/ecomos/evidence/T2/report.md';
  f.assign('T1', 'a', `app/a,${r1}`); f.assign('T2', 'b', `app/b,${r2}`);
  f.claim('T1', 'a', `app/a,${r1}`); f.claim('T2', 'b', `app/b,${r2}`);
  f.write('app/a'); f.write(r1); const a = f.commit(['app/a', r1]); f.submit('T1', 'a', a, r1);
  f.write('app/b'); f.write(r2); const b = f.commit(['app/b', r2]); f.submit('T2', 'b', b, r2);
  assert.deepEqual(f.json(['status']).tasks.T2.submission.files.sort(), ['app/b', r2].sort());
});
test('independent verification and acceptance enforce identity, SHA and separate evidence', t => {
  const f = fixture(t); const report = 'docs/ecomos/evidence/T1/report.md';
  f.assign('T1', 'a', `app/a,${report}`); f.claim('T1', 'a', `app/a,${report}`); f.write('app/a'); f.write(report); const sha = f.commit(['app/a', report]); f.submit('T1', 'a', sha, report);
  f.run(['accept', 'T1', '--agent', 'orch', '--note', 'premature'], 1);
  f.run(['claim', 'T1', '--agent', 'a', '--files', 'docs/ecomos/verification/T1/report.md'], 1);
  f.verify('T1', sha, '--inconclusive'); assert.equal(f.json(['status']).tasks.T1.status, 'REVIEW');
  f.verify('T1', sha); f.run(['accept', 'T1', '--agent', 'orch', '--note', 'Independent check passed']);
  assert.equal(f.json(['status']).tasks.T1.status, 'ACCEPTED');
});
test('new tasks and regressions invalidate dependent phase gates', t => {
  const f = fixture(t);
  for (const [id, agent] of [['T1', 'a'], ['T2', 'b']]) {
    const file = `app/${agent}`, report = `docs/ecomos/evidence/${id}/report.md`;
    f.assign(id, agent, `${file},${report}`); f.claim(id, agent, `${file},${report}`); f.write(file); f.write(report);
    const sha = f.commit([file, report]); f.submit(id, agent, sha, report); f.verify(id, sha); f.run(['accept', id, '--agent', 'orch', '--note', 'PASS']);
  }
  f.write('docs/ecomos/gate.md', 'Aggregate phase checks PASS\n');
  f.run(['gate', '0', '--agent', 'orch', '--evidence', 'docs/ecomos/gate.md', '--checks', 'aggregate tests -> PASS']);
  f.assign('T3', 'a', 'app/phase-one');
  f.run(['task', 'REGRESSION', '--agent', 'orch', '--title', 'New phase-zero failure', '--phase', '0']);
  assert.equal(f.json(['status']).gates['0'], undefined);
  f.run(['claim', 'T3', '--agent', 'a', '--files', 'app/phase-one'], 1);
});
test('concurrent claim race has one winner and a valid contiguous journal', async t => {
  const f = fixture(t); f.assign('T1', 'a', 'app/shared'); f.assign('T2', 'b', 'app/shared');
  function concurrent(id, agent) {
    return new Promise(resolve => {
      const child = spawn(process.execPath, [path.join(f.hub, 'hub.mjs'), 'claim', id, '--agent', agent, '--files', 'app/shared'], { cwd: f.root, env: f.env, windowsHide: true, stdio: 'ignore' });
      child.on('exit', code => resolve(code));
    });
  }
  assert.deepEqual((await Promise.all([concurrent('T1', 'a'), concurrent('T2', 'b')])).sort(), [0, 3]);
  const events = fs.readFileSync(path.join(f.hub, '.runtime/events.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  assert(events.every((event, i) => event.seq === i + 1));
});
test('journal corruption refuses a write rather than dropping history', t => {
  const f = fixture(t); const journal = path.join(f.hub, '.runtime/events.jsonl');
  fs.appendFileSync(journal, '{truncated\n'); const before = fs.readFileSync(journal, 'utf8');
  f.run(['heartbeat', '--agent', 'a'], 1); assert.equal(fs.readFileSync(journal, 'utf8'), before);
});
