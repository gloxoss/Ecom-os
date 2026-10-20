import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pack = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(pack, 'manifest.json'), 'utf8'));
const ids = new Set(manifest.tasks.map(task => task.id));
assert.equal(ids.size, manifest.tasks.length, 'Duplicate task ID');
assert.equal(manifest.agents.length, 4, 'Expected four sessions');
for (const agent of manifest.agents) assert.ok(fs.existsSync(path.join(pack, agent.prompt)), 'Missing prompt');
const resources = new Set(['git-index', 'workspace-install', 'workspace-build', 'storefront-dev', 'php-staging', 'browser']);
const byId = new Map(manifest.tasks.map(task => [task.id, task]));
const visiting = new Set(), visited = new Set();
function visit(id) {
  assert.ok(ids.has(id), 'Unknown dependency ' + id);
  assert.ok(!visiting.has(id), 'Dependency cycle at ' + id);
  if (visited.has(id)) return;
  visiting.add(id);
  for (const dep of byId.get(id).dependsOn) visit(dep);
  visiting.delete(id);
  visited.add(id);
}
function overlaps(a, b) {
  a = a.toLowerCase(); b = b.toLowerCase();
  return a === b || a.startsWith(b + '/') || b.startsWith(a + '/');
}
for (const task of manifest.tasks) {
  assert.match(task.id, /^ECO-\d+$/);
  assert.equal(task.hubPhase, 9);
  assert.ok(['commerce', 'rfq', 'recovery'].includes(task.owner));
  assert.ok(task.files.length && task.acceptance.length);
  for (const file of task.files) {
    assert.ok(!path.isAbsolute(file) && !file.includes('\\') && !file.split('/').includes('..'), 'Unsafe scope ' + file);
    for (const protectedPath of ['.git', 'node_modules', 'plugins/wordpress-mcp', '.agent-hub/.runtime']) {
      assert.ok(!overlaps(file, protectedPath), 'Protected scope ' + file);
    }
  }
  for (const resource of task.resources) assert.ok(resources.has(resource), 'Unknown resource');
  visit(task.id);
}
for (let a = 0; a < manifest.tasks.length; a++) {
  for (let b = a + 1; b < manifest.tasks.length; b++) {
    const first = manifest.tasks[a], second = manifest.tasks[b];
    if (first.owner === second.owner) continue;
    assert.ok(!first.files.some(x => second.files.some(y => overlaps(x, y))), 'Cross-owner overlap: ' + first.id + '/' + second.id);
  }
}
assert.ok(byId.get('ECO-1102').dependsOn.includes('ECO-1101'), 'Checkout tasks must be sequential');
assert.equal(byId.get('ECO-1107').dependsOn.length, 6, 'Sprint A needs six repairs');
for (const id of ['ECO-1211', 'ECO-1212', 'ECO-1213']) {
  assert.ok(byId.get('ECO-1204').dependsOn.includes(id), 'Sprint B omitted original requirement proof');
}
console.log('PASS: ' + manifest.tasks.length + ' unique tasks, acyclic dependencies, four prompts, valid scopes/resources, no cross-owner file overlap.');

