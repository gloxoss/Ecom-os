import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const pack = path.dirname(fileURLToPath(import.meta.url));
const root = process.env.ECOM_HUB_ROOT || fileURLToPath(new URL('../../../', import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(pack, 'manifest.json'), 'utf8'));
const result = spawnSync(process.execPath, [path.join(root, '.agent-hub/hub.mjs'), 'status'], {
  cwd: root, encoding: 'utf8', env: { ...process.env, ECOM_HUB_ROOT: root }, maxBuffer: 8 * 1024 * 1024,
});
if (result.error || result.status !== 0) {
  console.error('Cannot read canonical hub status:', result.error?.message || result.stderr.trim());
  process.exit(1);
}
const state = JSON.parse(result.stdout);
const missing = manifest.tasks.filter(task => !state.tasks[task.id]).map(task => task.id);
if (missing.length) {
  console.error('Missing canonical tasks:', missing.join(', '));
  process.exit(1);
}
console.log('Execution completion from canonical hub. This is not product readiness.');
for (const [label, matches] of [
  ['Sprint A', task => task.stage.startsWith('A')],
  ['Sprint B', task => task.stage === 'B'],
  ['Release preparation', task => task.stage === 'R'],
]) {
  const tasks = manifest.tasks.filter(matches);
  const accepted = tasks.filter(task => state.tasks[task.id].status === 'ACCEPTED').length;
  console.log(label + ': ' + accepted + '/' + tasks.length + ' independently accepted');
}
for (const task of manifest.tasks) {
  console.log(task.id + ' | ' + task.owner + ' | ' + state.tasks[task.id].status + ' | ' + task.title);
}
const workers = Object.values(state.agents).filter(agent => !agent.left && agent.role !== 'orchestrator');
console.log('Registered executor/verifier workers: ' + workers.length + '/4 (stale workers still count)');
console.log('Sprint A gate: ' + state.tasks['ECO-1107'].status);
console.log('Sprint B gate: ' + state.tasks['ECO-1204'].status);
console.log('Release packet: ' + state.tasks['ECO-1302'].status);

