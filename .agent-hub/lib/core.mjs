import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export class HubError extends Error {
  constructor(message, code = 1) { super(message); this.code = code; }
}
export const requireThat = (condition, message, code = 1) => { if (!condition) throw new HubError(message, code); };
export const overlaps = (a, b) => {
  a = a.replace(/\/$/, '').toLowerCase(); b = b.replace(/\/$/, '').toLowerCase();
  return a === b || a.startsWith(b + '/') || b.startsWith(a + '/');
};
export const list = value => typeof value === 'string' ? [...new Set(value.split(',').map(x => x.trim()).filter(Boolean))] : [];
export function text(value, label) {
  requireThat(typeof value === 'string' && value.trim().length > 0 && value.length <= 8000, `${label} is required (maximum 8000 characters).`);
  requireThat(!/-----BEGIN .*PRIVATE KEY-----|\b(?:ck_|cs_)[a-f\d]{30,}|Bearer\s+\S{20,}|https?:\/\/[^\s/]+:[^\s/]+@/i.test(value), 'Do not put credentials or tokens in hub records.');
  return value.trim();
}
export function identifier(value, label = 'Identifier') {
  requireThat(typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,79}$/.test(value), `${label} has invalid characters.`);
  return value;
}
export function filePath(input, root, config) {
  requireThat(typeof input === 'string' && input.length > 0, 'Declare repository-relative file paths.');
  const normalized = input.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/$/, '');
  requireThat(!/[\x00-\x1f<>:"|?*]/.test(normalized) && !normalized.split('/').some(p => /[. ]$/.test(p)), 'Unsupported or ambiguous Windows path.');
  requireThat(!normalized.startsWith('/') && !/^[a-z]:/i.test(normalized) && !normalized.split('/').some(x => !x || x === '..' || x === '.'), 'Paths must stay inside the repository without traversal.');
  requireThat(!config.protectedPaths.some(p => overlaps(p, normalized)), `Protected path: ${normalized}`);
  const safeSegments = value => !value.split('/').some(part => ['.git', 'node_modules'].includes(part.toLowerCase()) || (part.toLowerCase().startsWith('.env') && part.toLowerCase() !== '.env.example')) && !/\.(pem|key|p12|pfx)$/i.test(value);
  requireThat(safeSegments(normalized), 'Secret/internal files cannot be claimed or used as evidence.');
  // Resolve existing ancestors so aliases/junctions cannot bypass a file claim.
  const absoluteRoot = fs.realpathSync(root);
  let ancestor = path.join(absoluteRoot, normalized);
  const tail = [];
  const exists = value => { try { fs.lstatSync(value); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } };
  while (!exists(ancestor)) { tail.unshift(path.basename(ancestor)); ancestor = path.dirname(ancestor); }
  const resolved = path.resolve(fs.realpathSync(ancestor), ...tail);
  const relative = path.relative(absoluteRoot, resolved).replace(/\\/g, '/');
  requireThat(relative && relative !== '..' && !relative.startsWith('../') && !path.isAbsolute(relative), 'Path resolves outside the repository.');
  requireThat(!config.protectedPaths.some(p => overlaps(p, relative)), 'Path alias points into a protected directory.');
  requireThat(safeSegments(relative), 'Path alias points into a secret/internal file.');
  return relative;
}
export function git(root, args) {
  try { return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], timeout: 15000 }).trim(); }
  catch { throw new HubError(`Git check failed: ${args[0]}. Check the repository and submitted commit.`); }
}
export function commonGit(root) { return fs.realpathSync(path.resolve(root, git(root, ['rev-parse', '--git-common-dir']))); }
export function sameRepository(root, candidate) { requireThat(commonGit(root).toLowerCase() === commonGit(candidate).toLowerCase(), 'Worktree must belong to this EcomOS repository.'); }
export function readEvents(stateDir) {
  const journal = path.join(stateDir, 'events.jsonl');
  if (!fs.existsSync(journal)) return [];
  return fs.readFileSync(journal, 'utf8').split('\n').filter(Boolean).map((line, index) => {
    let event;
    try { event = JSON.parse(line); } catch { throw new HubError(`Corrupt journal at line ${index + 1}. Preserve the file and recover it before writing.`); }
    requireThat(event.seq === index + 1 && event.state && event.type, `Invalid journal sequence at line ${index + 1}.`);
    return event;
  });
}
export function initialState(tasks) {
  return { agents: {}, tasks: Object.fromEntries(tasks.map(task => [task.id, { ...task, status: 'OPEN', assignment: null, claim: null, submission: null, verification: null }])), gates: {}, messages: [] };
}
export function loadState(stateDir, tasks) {
  const events = readEvents(stateDir);
  return { state: events.at(-1)?.state ?? initialState(tasks), events };
}
export function alive(agent, minutes) {
  return agent && !agent.left && Date.now() - Date.parse(agent.lastSeen) < minutes * 60000;
}
export function withLock(stateDir, operation) {
  fs.mkdirSync(stateDir, { recursive: true });
  const lock = path.join(stateDir, '.lock');
  const token = randomUUID();
  const deadline = Date.now() + 10000;
  while (true) {
    try { fs.mkdirSync(lock); break; }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      requireThat(Date.now() < deadline, 'Hub lock is busy. Retry; a crashed owner requires explicit unlock.', 3);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
  }
  const ownerFile = path.join(lock, 'owner.json');
  fs.writeFileSync(ownerFile, JSON.stringify({ pid: process.pid, host: os.hostname(), token, createdAt: new Date().toISOString() }));
  try { return operation(); }
  finally {
    // Never remove another process's lock, even if somebody manually changed it.
    if (fs.existsSync(ownerFile) && JSON.parse(fs.readFileSync(ownerFile, 'utf8')).token === token) {
      fs.unlinkSync(ownerFile); fs.rmdirSync(lock);
    }
  }
}
export function append(stateDir, events, state, type, agent, details = {}) {
  const event = { seq: events.length + 1, at: new Date().toISOString(), type, agent, ...details, state };
  const fd = fs.openSync(path.join(stateDir, 'events.jsonl'), 'a');
  try { fs.writeFileSync(fd, JSON.stringify(event) + '\n'); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  return event;
}
export function render(stateDir, state, config) {
  const lines = ['# EcomOS agent board', '', 'Generated from the local journal. Do not edit this view.', '', '## Agents', ''];
  for (const agent of Object.values(state.agents)) lines.push(`- ${agent.id}: ${agent.role}/${agent.lane}, ${agent.left ? 'LEFT' : alive(agent, config.staleMinutes) ? 'ACTIVE' : 'STALE, claims retained'}`);
  lines.push('', '## Tasks', '');
  for (const task of Object.values(state.tasks)) lines.push(`- ${task.id}: ${task.status}, ${task.assignment?.to ?? 'unassigned'}${task.claim ? `, files: ${task.claim.files.join(', ')}, resources: ${task.claim.resources.join(', ')}` : ''}`);
  lines.push('', '## Phase gates', '', ...Object.entries(state.gates).map(([phase, gate]) => `- Phase ${phase}: PASS at ${gate.commit}`));
  fs.writeFileSync(path.join(stateDir, 'BOARD.md'), lines.join('\n') + '\n');
  const changes = Object.values(state.tasks).filter(t => t.submission).map(t => `- ${t.id}: ${t.status}, submitted ${t.submission.commit}, report ${t.submission.evidence}`);
  fs.writeFileSync(path.join(stateDir, 'CHANGELOG.md'), '# EcomOS submission log\n\n' + changes.join('\n') + '\n');
}
export function conflict(state, taskId, files, resources) {
  for (const task of Object.values(state.tasks)) {
    if (task.id === taskId || !task.claim) continue;
    const file = files.find(a => task.claim.files.some(b => overlaps(a, b)));
    const resource = resources.find(a => task.claim.resources.includes(a));
    requireThat(!file && !resource, `Conflict with ${task.id} held by ${task.claim.owner}: ${file ?? resource}. Stale claims are not free.`, 3);
  }
}
export function changedPaths(root, base, commit) {
  git(root, ['merge-base', '--is-ancestor', base, commit]);
  return git(root, ['diff', '--name-only', base, commit]).split('\n').filter(Boolean);
}
export function submittedSlice(root, base, sha, state, taskId) {
  git(root, ['merge-base', '--is-ancestor', base, sha]);
  const known = new Set(Object.values(state.tasks).filter(t => t.id !== taskId && t.submission).flatMap(t => t.submission.commits ?? [t.submission.commit]));
  const commits = git(root, ['rev-list', '--reverse', `${base}..${sha}`]).split('\n').filter(Boolean).filter(id => !known.has(id));
  const changed = new Set();
  for (const id of commits) {
    requireThat(git(root, ['rev-list', '--parents', '-n', '1', id]).split(' ').length <= 2, 'Executor submissions must not include unregistered merge commits.');
    for (const file of git(root, ['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', id]).split('\n').filter(Boolean)) changed.add(file);
  }
  requireThat(commits.includes(sha), 'Submit your own new tip commit, not another task submission.');
  return { commits, files: [...changed] };
}
export function dirtyPaths(root) {
  const result = execFileSync('git', ['-C', root, 'status', '--porcelain=v1', '-z', '--untracked-files=all'], { encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], timeout: 15000 });
  const entries = result.split('\0').filter(Boolean), paths = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    paths.push(entry.slice(3));
    if (/^[RC]|^ [RC]/.test(entry)) { if (entries[i + 1]) paths.push(entries[++i]); }
  }
  return paths;
}
