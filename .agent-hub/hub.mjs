#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { HubError, requireThat, overlaps, list, text, identifier, filePath, git, sameRepository, loadState, alive, withLock, append, render, conflict, submittedSlice, dirtyPaths } from './lib/core.mjs';

const requestedHub = process.env.ECOM_HUB_ROOT ? path.resolve(process.env.ECOM_HUB_ROOT) : null;
const HUB = requestedHub ? (path.basename(requestedHub) === '.agent-hub' ? requestedHub : path.join(requestedHub, '.agent-hub')) : path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HUB);
const STATE = path.resolve(process.env.ECOM_HUB_STATE_DIR ?? path.join(HUB, '.runtime'));
const config = JSON.parse(fs.readFileSync(path.join(HUB, 'config.json'), 'utf8'));
const tasks = JSON.parse(fs.readFileSync(path.join(HUB, 'tasks.json'), 'utf8'));
const argv = process.argv.slice(2), command = argv.shift() ?? 'help', opts = {}, positions = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) {
    const key = argv[i].slice(2); requireThat(!(key in opts), `Repeated option: ${key}`);
    opts[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  } else positions.push(argv[i]);
}
const agentId = opts.agent ?? process.env.AGENT_ID;
const now = () => new Date().toISOString();
function actor(state, roles = config.roles) {
  identifier(agentId, 'Agent');
  const agent = state.agents[agentId];
  requireThat(agent && !agent.left && roles.includes(agent.role), `Join as ${roles.join(' or ')} before this command.`);
  return agent;
}
function taskOf(state) { const task = state.tasks[identifier(positions[0], 'Task')]; requireThat(task, 'Unknown task. Orchestrator must add or assign existing work.'); return task; }
function files(value, root) { const result = list(value).map(p => filePath(p, root, config)); requireThat(result.length, 'Declare at least one file or directory.'); return result; }
function resources(value) { const result = list(value); requireThat(result.every(x => config.resources.includes(x)), 'Unknown exclusive resource. See config.json.'); return result; }
function phaseReady(state, phase) { return (config.phaseDependencies[String(phase)] ?? []).every(dep => state.gates[dep]); }
function invalidateGates(state, phase) {
  const invalid = new Set([phase]); let changed = true;
  while (changed) { changed = false; for (const [key, deps] of Object.entries(config.phaseDependencies)) if (!invalid.has(Number(key)) && deps.some(dep => invalid.has(dep))) { invalid.add(Number(key)); changed = true; } }
  for (const key of invalid) delete state.gates[key];
  return [...invalid];
}
function proof(value) { const result = text(value, 'Checks'); requireThat(result.includes('->'), 'Checks need an actual command -> result.'); return result; }
function cleanProof(value) { const result = proof(value); requireThat(!/\bFAIL(?:ED)?\b|\bBLOCKED\b|NOT RUN|\bSKIPPED\b/i.test(result), 'Failed or blocked decisive checks require progress, not completion.'); return result; }
function evidence(value, root) {
  const relative = filePath(text(value, 'Evidence path'), root, config);
  requireThat(fs.existsSync(path.join(root, relative)) && fs.statSync(path.join(root, relative)).isFile() && fs.statSync(path.join(root, relative)).size > 0, 'Evidence must be an existing nonempty report.');
  return relative;
}
function holder(state, task, roles) { const agent = actor(state, roles); requireThat(task.claim?.owner === agent.id, 'Claim this task before changing its state.'); return agent; }
function commit(value, root) { requireThat(typeof value === 'string' && /^[a-f\d]{7,40}$/i.test(value), 'Submit an existing hexadecimal commit SHA.'); return git(root, ['rev-parse', '--verify', `${value}^{commit}`]); }

const help = `EcomOS local agent hub, Node 22+. No command deploys or merges application code.
Read .agent-hub/README.md and PROTOCOL.md before editing.
Commands:
  join --agent ID --role orchestrator|executor|verifier --lane LANE --tool TOOL [--worktree PATH]
  status | next | check | log | sync
  assign TASK --agent ORCH --to EXEC --files paths [--resources names] [--note text]
  task ID --agent ORCH --title text --phase 0..9 [--description text]
  claim TASK --agent ID --files paths [--resources names]
  files TASK --agent ID --add paths
  resources TASK --agent ID --add names|--remove names
  heartbeat --agent ID [--note text]
  progress TASK --agent ID --partial|--blocked|--resume --note text
  release TASK --agent ID [--force --note text]
  done TASK --agent EXEC --commit SHA --evidence report --summary text --checks 'command -> PASS'
  verify TASK --agent VERIFIER --commit SHA --ok|--fail|--inconclusive --evidence report --checks 'command -> result'
  accept TASK --agent ORCH --note text
  reopen TASK --agent ORCH --note text
  gate PHASE --agent ORCH --evidence report --checks 'command -> PASS'
  say text --agent ID [--to ID] | inbox --agent ID
  prompt TASK --agent ORCH | prompt --role ROLE --lane LANE
  leave --agent ID | unlock --agent ORCH --note text
Paths are repository-relative; lists are comma-separated. Conflicts exit 3.
Runtime board/journal: .agent-hub/.runtime (local and gitignored).
Use ECOM_HUB_ROOT for the one shared hub when working in isolated worktrees.`;

function execute(state) {
  if (command === 'join') {
    identifier(agentId, 'Agent');
    const role = opts.role, lane = opts.lane;
    requireThat(config.roles.includes(role) && config.lanes.includes(lane), 'Choose a valid role and lane.');
    requireThat((role === 'verifier') === (lane === 'verification') && (role === 'orchestrator') === (lane === 'orchestrator'), 'Role and lane must agree.');
    const existing = state.agents[agentId];
    requireThat(!existing || existing.left || (existing.role === role && existing.lane === lane), 'Active agent identity cannot change roles.');
    const workers = Object.values(state.agents).filter(a => !a.left && a.role !== 'orchestrator' && a.id !== agentId);
    requireThat(role === 'orchestrator' || workers.length < config.maxWorkers, `At most ${config.maxWorkers} workers may be registered; explicitly leave stopped agents.`);
    const worktree = fs.realpathSync(path.resolve(opts.worktree ?? ROOT));
    sameRepository(ROOT, worktree);
    state.agents[agentId] = { id: agentId, role, lane, tool: text(opts.tool ?? 'unknown', 'Tool'), worktree, lastSeen: now(), left: false, note: opts.note ? text(opts.note, 'Note') : '' };
    return { joined: agentId, role, lane, worktree };
  }
  const agent = actor(state);
  agent.lastSeen = now();
  if (command === 'heartbeat') { if (opts.note) agent.note = text(opts.note, 'Note'); return { heartbeat: agentId }; }
  if (command === 'task') {
    actor(state, ['orchestrator']); const id = identifier(positions[0], 'Task');
    requireThat(!state.tasks[id], 'Task already exists.');
    const phase = Number(opts.phase); requireThat(Number.isInteger(phase) && phase >= 0 && phase <= 9, 'Phase must be 0..9.');
    state.tasks[id] = { id, title: text(opts.title, 'Title'), description: opts.description ? text(opts.description, 'Description') : '', phase, status: 'OPEN', assignment: null, claim: null, submission: null, verification: null };
    invalidateGates(state, phase);
    return { added: id };
  }
  if (command === 'say') {
    const to = opts.to ? identifier(opts.to) : 'all'; requireThat(to === 'all' || state.agents[to], 'Unknown message recipient.');
    state.messages.push({ from: agentId, to, at: now(), text: text(positions.join(' '), 'Message') });
    return { sent: to };
  }
  if (command === 'leave') { requireThat(!Object.values(state.tasks).some(t => t.claim?.owner === agentId), 'Release owned claims before leaving.'); agent.left = true; return { left: agentId }; }
  if (command === 'gate') {
    actor(state, ['orchestrator']); const phase = Number(positions[0]);
    requireThat(Number.isInteger(phase) && phase >= 0 && phase <= 9 && phaseReady(state, phase), 'Phase prerequisites have not passed.');
    const phaseTasks = Object.values(state.tasks).filter(t => t.phase === phase);
    requireThat(phaseTasks.length && phaseTasks.every(t => t.status === 'ACCEPTED'), 'Every task in this phase needs independent verification and acceptance.');
    const integrated = git(ROOT, ['rev-parse', 'HEAD']);
    for (const task of phaseTasks) git(ROOT, ['merge-base', '--is-ancestor', task.submission.commit, integrated]);
    state.gates[phase] = { at: now(), by: agentId, evidence: evidence(opts.evidence, ROOT), checks: cleanProof(opts.checks), commit: integrated };
    return { phase, gate: 'PASS' };
  }
  const task = taskOf(state);
  if (command === 'assign') {
    actor(state, ['orchestrator']); requireThat(['OPEN', 'PARTIAL', 'BLOCKED', 'ASSIGNED'].includes(task.status) && !task.claim, 'Task is already held or under review.');
    requireThat(phaseReady(state, task.phase), 'Earlier phase gates have not passed.');
    const executor = state.agents[identifier(opts.to)]; requireThat(executor && !executor.left && executor.role === 'executor', 'Assign to a joined executor.');
    const scope = files(opts.files, executor.worktree), reserved = resources(opts.resources);
    task.assignment = { to: executor.id, files: scope, resources: reserved, base: git(executor.worktree, ['rev-parse', 'HEAD']), note: opts.note ? text(opts.note, 'Note') : '' };
    task.status = 'ASSIGNED'; task.submission = null; task.verification = null;
    return { assigned: task.id, to: executor.id, base: task.assignment.base };
  }
  if (command === 'claim') {
    requireThat(!task.claim, 'Task already has a claim.', 3);
    const scope = files(opts.files, agent.worktree), reserved = resources(opts.resources);
    if (agent.role === 'verifier') {
      requireThat(task.status === 'REVIEW' && task.submission?.by !== agentId, 'Verifier claims only another executor submission in REVIEW.');
      requireThat(scope.every(p => p.toLowerCase().startsWith(config.verificationRoot.toLowerCase() + '/')), 'Verifier may claim only its verification reports.');
    } else {
      requireThat(agent.role === 'executor' && task.assignment?.to === agentId && ['ASSIGNED', 'PARTIAL', 'BLOCKED'].includes(task.status), 'Executor needs an orchestrator assignment.');
      requireThat(phaseReady(state, task.phase), 'Phase prerequisites were invalidated; stop implementation until cleared.');
      requireThat(scope.every(p => task.assignment.files.some(allowed => overlaps(allowed, p) && (p.toLowerCase() === allowed.toLowerCase() || p.toLowerCase().startsWith(allowed.toLowerCase() + '/')))), 'Claim must stay inside assigned file scope.');
      requireThat(reserved.every(r => task.assignment.resources.includes(r)), 'Resource must be part of the assignment.');
      task.status = 'IN_PROGRESS';
    }
    conflict(state, task.id, scope, reserved);
    task.claim = { owner: agentId, files: scope, resources: reserved, since: now() };
    return { claimed: task.id, files: scope, resources: reserved };
  }
  if (command === 'files' || command === 'resources') {
    holder(state, task, ['executor', 'verifier']);
    if (command === 'files') {
      const extra = files(opts.add, agent.worktree);
      const allowed = agent.role === 'verifier' ? [config.verificationRoot] : task.assignment.files;
      requireThat(extra.every(p => allowed.some(a => p.toLowerCase() === a.toLowerCase() || p.toLowerCase().startsWith(a.toLowerCase() + '/'))), 'Additional file is outside the assignment. Ask orchestrator to revise scope after release.');
      conflict(state, task.id, extra, []); task.claim.files = [...new Set([...task.claim.files, ...extra])];
    } else {
      requireThat(Boolean(opts.add) !== Boolean(opts.remove), 'Choose --add or --remove.');
      const extra = resources(opts.add ?? opts.remove);
      if (opts.add) {
        requireThat(agent.role === 'verifier' || extra.every(r => task.assignment.resources.includes(r)), 'Resource is outside assignment.');
        conflict(state, task.id, [], extra); task.claim.resources = [...new Set([...task.claim.resources, ...extra])];
      } else task.claim.resources = task.claim.resources.filter(r => !extra.includes(r));
    }
    return { task: task.id, claim: task.claim };
  }
  if (command === 'release') {
    requireThat(task.claim, 'Task has no active claim.');
    requireThat(task.claim?.owner === agentId || (agent.role === 'orchestrator' && opts.force), 'Only holder or explicit orchestrator force may release.');
    if (agent.role === 'orchestrator') text(opts.note, 'Release reason');
    const wasVerifier = state.agents[task.claim.owner].role === 'verifier'; task.claim = null;
    if (!wasVerifier) task.status = task.status === 'IN_PROGRESS' ? 'ASSIGNED' : task.status;
    return { released: task.id };
  }
  if (command === 'progress') {
    holder(state, task, ['executor']); requireThat([opts.partial, opts.blocked, opts.resume].filter(Boolean).length === 1, 'Choose --partial, --blocked or --resume.');
    if (opts.resume) requireThat(phaseReady(state, task.phase), 'Phase prerequisites have not passed.');
    task.status = opts.resume ? 'IN_PROGRESS' : opts.blocked ? 'BLOCKED' : 'PARTIAL'; task.note = text(opts.note, 'Progress note'); return { task: task.id, status: task.status };
  }
  if (command === 'done') {
    holder(state, task, ['executor']); requireThat(task.status === 'IN_PROGRESS', 'Resume or claim active work before submitting.');
    requireThat(phaseReady(state, task.phase), 'Phase prerequisites have not passed.');
    const sha = commit(opts.commit, agent.worktree), report = evidence(opts.evidence, agent.worktree);
    requireThat(report.toLowerCase().startsWith(config.evidenceRoot.toLowerCase() + '/'), `Executor evidence must be under ${config.evidenceRoot}.`);
    const slice = submittedSlice(agent.worktree, task.assignment.base, sha, state, task.id);
    const changed = slice.files.map(p => filePath(p, agent.worktree, config));
    requireThat(changed.length > 0 && changed.every(p => task.claim.files.some(held => overlaps(held, p))), 'Submission contains changes outside claimed files or no changes.');
    requireThat(task.claim.files.some(p => overlaps(p, report)), 'Report must be inside the claim.');
    git(agent.worktree, ['cat-file', '-e', `${sha}:${report}`]);
    requireThat(!dirtyPaths(agent.worktree).some(p => task.claim.files.some(held => overlaps(held, p))), 'Claimed files have uncommitted changes.');
    task.submission = { by: agentId, commit: sha, commits: slice.commits, base: task.assignment.base, files: changed, evidence: report, summary: text(opts.summary, 'Summary'), checks: cleanProof(opts.checks), at: now() };
    task.status = 'REVIEW'; task.claim = null; task.verification = null;
    return { submitted: task.id, status: task.status, commit: sha };
  }
  if (command === 'verify') {
    holder(state, task, ['verifier']); requireThat(task.status === 'REVIEW' && task.submission.by !== agentId, 'Independent verifier required.');
    requireThat([opts.ok, opts.fail, opts.inconclusive].filter(Boolean).length === 1, 'Choose exactly one verdict.');
    const sha = commit(opts.commit, agent.worktree); requireThat(sha === task.submission.commit, 'Verify the exact submitted commit.');
    const report = evidence(opts.evidence, agent.worktree);
    requireThat(report !== task.submission.evidence && report.toLowerCase().startsWith(config.verificationRoot.toLowerCase() + '/') && task.claim.files.some(p => overlaps(p, report)), 'Use a separate claimed verification report.');
    task.verification = { by: agentId, commit: sha, evidence: report, checks: opts.ok ? cleanProof(opts.checks) : proof(opts.checks), verdict: opts.ok ? 'PASS' : opts.fail ? 'FAIL' : 'INCONCLUSIVE', at: now() };
    task.status = opts.ok ? 'VERIFIED' : opts.fail ? 'PARTIAL' : 'REVIEW'; task.claim = null;
    return { task: task.id, status: task.status, verdict: task.verification.verdict };
  }
  if (command === 'accept') {
    actor(state, ['orchestrator']); requireThat(task.status === 'VERIFIED' && task.verification?.verdict === 'PASS', 'Independent PASS required before acceptance.');
    requireThat(phaseReady(state, task.phase), 'Phase prerequisites have not passed.');
    task.status = 'ACCEPTED'; task.acceptance = { by: agentId, at: now(), note: text(opts.note, 'Acceptance note') }; return { accepted: task.id, commit: task.submission.commit };
  }
  if (command === 'reopen') {
    actor(state, ['orchestrator']); requireThat(!task.claim, 'Release the existing claim first.'); task.note = text(opts.note, 'Reopen reason');
    task.history = [...(task.history ?? []), { submission: task.submission, verification: task.verification, acceptance: task.acceptance }];
    task.status = 'OPEN'; task.assignment = null; task.submission = null; task.verification = null; delete task.acceptance;
    // A regression invalidates this phase and every transitive dependent gate.
    return { reopened: task.id, invalidatedGates: invalidateGates(state, task.phase) };
  }
  throw new HubError('Unknown command. Run help.');
}

function readOnly(state, events) {
  if (command === 'status') return state;
  if (command === 'log') return events.slice(-20).map(({ state: ignored, ...event }) => event);
  if (command === 'inbox') { actor(state); return state.messages.filter(m => m.to === agentId || m.to === 'all').slice(-30); }
  if (command === 'next') return { review: Object.values(state.tasks).filter(t => t.status === 'REVIEW'), assignable: Object.values(state.tasks).filter(t => ['OPEN', 'PARTIAL', 'BLOCKED'].includes(t.status) && !t.claim && phaseReady(state, t.phase)) };
  if (command === 'check') {
    for (const task of Object.values(state.tasks)) if (task.claim) conflict(state, task.id, task.claim.files, task.claim.resources);
    return { integrity: 'PASS', staleAgents: Object.values(state.agents).filter(a => !a.left && !alive(a, config.staleMinutes)).map(a => a.id), claimsExpireAutomatically: false, recordedAssertionsAreNotRuntimeProof: true };
  }
  if (command === 'prompt') {
    if (opts.role) {
      requireThat(config.roles.includes(opts.role), 'Choose a role.');
      const lane = opts.lane ?? (opts.role === 'orchestrator' ? 'orchestrator' : 'verification');
      const folder = opts.role === 'orchestrator' ? 'orchestrator' : opts.role === 'verifier' ? 'agent-5-verifier' : ({ catalog: 'agent-a', commerce: 'agent-b', experience: 'agent-c', platform: 'agent-d' })[lane];
      requireThat(folder, 'Choose an executor lane.'); return fs.readFileSync(path.join(HUB, 'ecomos-agent-system', folder, 'START.md'), 'utf8');
    }
    actor(state, ['orchestrator']); const task = taskOf(state); requireThat(task.assignment, 'Assign a task before generating its prompt.');
    return `Work on ${task.id}: ${task.title}\nRepository/worktree: ${state.agents[task.assignment.to].worktree}\nShared hub: ${HUB}\nSet ECOM_HUB_ROOT=${ROOT}\nAgent: ${task.assignment.to}\nBase commit: ${task.assignment.base}\nAssigned files: ${task.assignment.files.join(', ')}\nResources: ${task.assignment.resources.join(', ')}\nRead AGENTS.md, .agent-hub/PROTOCOL.md, .agent-hub/shared/PROJECT_CONTEXT.md, .agent-hub/shared/BUSINESS_RULES.md and this phase in .agent-hub/shared/ROADMAP.md.\n${task.description ?? ''}\n${task.assignment.note}\nClaim before editing. Submit committed evidence, then stop for independent verification. Do not deploy, push, merge, print secrets or claim unrun checks.\n`;
  }
  return null;
}

try {
  if (command === 'help') console.log(help);
  else if (command === 'unlock') {
    const { state } = loadState(STATE, tasks); actor(state, ['orchestrator']); text(opts.note, 'Unlock reason');
    const recovery = path.join(STATE, '.unlock');
    try { fs.mkdirSync(recovery); } catch (error) { if (error.code === 'EEXIST') throw new HubError('Another recovery is active. Preserve its directory if it crashed.', 3); throw error; }
    try {
    const lock = path.join(STATE, '.lock'), ownerFile = path.join(lock, 'owner.json');
    requireThat(fs.existsSync(ownerFile), 'Lock owner is missing. Preserve the directory and investigate manually.');
    const owner = JSON.parse(fs.readFileSync(ownerFile, 'utf8')); requireThat(owner.host === os.hostname(), 'Do not clear another machine lock.');
    let dead = false; try { process.kill(owner.pid, 0); } catch (error) { dead = error.code === 'ESRCH'; }
    requireThat(dead, 'Lock owner is alive or cannot be proven dead.', 3);
    requireThat(JSON.parse(fs.readFileSync(ownerFile, 'utf8')).token === owner.token, 'Lock changed; retry.', 3);
    fs.unlinkSync(ownerFile); fs.rmdirSync(lock);
    withLock(STATE, () => { const fresh = loadState(STATE, tasks); append(STATE, fresh.events, fresh.state, 'unlock', agentId, { note: opts.note }); render(STATE, fresh.state, config); });
    } finally { fs.rmdirSync(recovery); }
    console.log('Recovered lock owned by a terminated local process.');
  } else if (['status', 'next', 'check', 'log', 'inbox', 'prompt'].includes(command)) {
    const { state, events } = loadState(STATE, tasks); const result = readOnly(state, events);
    console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
  } else {
    const result = withLock(STATE, () => {
      const { state, events } = loadState(STATE, tasks);
      if (command === 'sync') { render(STATE, state, config); return { rebuilt: ['BOARD.md', 'CHANGELOG.md'] }; }
      const result = execute(state); append(STATE, events, state, command, agentId, { task: positions[0] ?? null }); render(STATE, state, config); return result;
    });
    console.log(JSON.stringify(result, null, 2));
  }
} catch (error) {
  console.error(error instanceof HubError ? error.message : 'Hub failed safely. Inspect configuration, journal, and repository paths.');
  process.exitCode = error instanceof HubError ? error.code : 1;
}
