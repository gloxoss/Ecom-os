#!/usr/bin/env node
// Preview or apply an EcomOS starter update inside a client instance.
// Dry run by default: it never touches the working tree unless --apply is given.
//   node scripts/ecomos-upgrade.mjs [--remote starter] [--to <tag|branch>] [--apply] [--verify]
// Without --to it targets the newest vX.Y.Z tag on the remote, else the remote's
// sprint-integrated-authoritative branch.
import { execFileSync, spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const remote = opt('remote', 'starter');
const apply = args.includes('--apply');
const verify = args.includes('--verify');

const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();
const tryGit = (...a) => {
  try {
    return git(...a);
  } catch {
    return null;
  }
};
const die = (msg) => {
  console.error(msg);
  process.exit(1);
};

if (!tryGit('remote', 'get-url', remote)) die(`No git remote named "${remote}". Add it: git remote add ${remote} <path-or-url-of-the-starter>`);

const dirty = git('status', '--porcelain', '--untracked-files=no').split('\n').filter(Boolean);
if (dirty.length) die(`Working tree has uncommitted tracked changes. Commit or stash first:\n  ${dirty.join('\n  ')}`);

console.log(`Fetching ${remote} (with tags)...`);
git('fetch', '--tags', remote);

const semverTags = git('tag', '--list', 'v*', '--sort=-v:refname').split('\n').filter((t) => /^v\d+\.\d+\.\d+/.test(t));
let target = opt('to', null);
if (!target) {
  target = semverTags[0] || `${remote}/sprint-integrated-authoritative`;
  if (!semverTags[0]) console.log('No release tags found: following the starter branch tip (less safe than a pinned tag).');
}
const targetSha = tryGit('rev-parse', '--verify', `${target}^{commit}`) || tryGit('rev-parse', '--verify', `${remote}/${target}^{commit}`);
if (!targetSha) die(`Cannot resolve target "${target}".`);

const head = git('rev-parse', 'HEAD');
const base = git('merge-base', head, targetSha);
console.log(`\nInstance: ${git('rev-parse', '--abbrev-ref', 'HEAD')} @ ${head.slice(0, 7)}`);
console.log(`Target:   ${target} @ ${targetSha.slice(0, 7)}   (common base ${base.slice(0, 7)})`);

if (base === targetSha) {
  console.log('\nAlready up to date: the target is already part of this instance.');
  process.exit(0);
}

const incoming = git('log', '--oneline', `${base}..${targetSha}`).split('\n').filter(Boolean);
console.log(`\nIncoming commits: ${incoming.length}`);
incoming.slice(0, 25).forEach((l) => console.log(`  ${l}`));
if (incoming.length > 25) console.log(`  ... and ${incoming.length - 25} more`);

const theirs = git('diff', '--name-only', `${base}..${targetSha}`).split('\n').filter(Boolean);
const mine = new Set(git('diff', '--name-only', `${base}..${head}`).split('\n').filter(Boolean));
const touches = (re) => theirs.filter((f) => re.test(f));
console.log('\nWhat changes:');
console.log(`  core code (packages/, apps/, scripts/): ${touches(/^(packages|apps|scripts)\//).length} files`);
console.log(`  WordPress plugins (plugins/): ${touches(/^plugins\//).length} files${touches(/^plugins\//).length ? '  -> plugin update needed on the instance WordPress, back up its database first' : ''}`);
console.log(`  dependencies (pnpm-lock.yaml): ${touches(/^pnpm-lock\.yaml$/).length ? 'changed -> pnpm install needed' : 'unchanged'}`);
console.log(`  migration notes (docs/ecomos/MIGRATIONS.md): ${touches(/MIGRATIONS\.md$/).length ? 'CHANGED, read below' : 'unchanged'}`);

const both = theirs.filter((f) => mine.has(f));
if (both.length) {
  console.log(`\nFiles changed on BOTH sides (conflict risk): ${both.length}`);
  both.slice(0, 15).forEach((f) => console.log(`  ${f}`));
  console.log('  Rule: instance-specific work belongs in clients/<client>/, its theme, and .env.local, not in core files.');
}

const mig = tryGit('diff', `${base}..${targetSha}`, '--', 'docs/ecomos/MIGRATIONS.md');
if (mig) {
  console.log('\nMigration notes added by this update:');
  mig
    .split('\n')
    .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
    .forEach((l) => console.log(`  ${l.slice(1)}`));
}

const trial = spawnSync('git', ['merge-tree', '--write-tree', '--no-messages', head, targetSha], { encoding: 'utf8' });
if (trial.status === 0) console.log('\nTrial merge: clean (no conflicts).');
else if (trial.status === 1) console.log('\nTrial merge: CONFLICTS expected. Files:\n  ' + trial.stdout.split('\n').slice(1).filter(Boolean).slice(0, 15).join('\n  '));
else console.log('\nTrial merge: could not be evaluated (needs git 2.38 or newer).');

if (!apply) {
  console.log('\nDry run only. Nothing changed. Re-run with --apply to merge on a new branch (add --verify to run checks).');
  process.exit(0);
}

const stamp = new Date().toISOString().slice(0, 10);
const branch = `upgrade/${target.replace(/[^\w.-]/g, '-')}-${stamp}`;
const original = git('rev-parse', '--abbrev-ref', 'HEAD');
git('checkout', '-b', branch);
const merge = spawnSync('git', ['merge', '--no-ff', '-m', `chore(upgrade): merge EcomOS ${target}`, targetSha], { stdio: 'inherit' });
if (merge.status !== 0) {
  spawnSync('git', ['merge', '--abort'], { stdio: 'inherit' });
  git('checkout', original);
  git('branch', '-D', branch);
  die(`\nMerge conflicted and was aborted. Your branch ${original} is untouched. Resolve by hand on a scratch branch.`);
}
console.log(`\nMerged on branch ${branch}. Your original branch ${original} is untouched.`);

const pnpm = process.env.ECOM_PNPM || 'pnpm';
const step = (label, cmd, cmdArgs) => {
  const r = spawnSync(cmd, cmdArgs, { stdio: 'inherit', shell: process.platform === 'win32' });
  console.log(`  ${label}: ${r.status === 0 ? 'PASS' : `FAIL (exit ${r.status})`}`);
  return r.status === 0;
};
if (touches(/^pnpm-lock\.yaml$/).length) step('install', pnpm, ['install', '--frozen-lockfile']);
if (verify) {
  step('architecture guard', 'node', ['node_modules/tsx/dist/cli.mjs', 'scripts/check-engine-imports.ts']);
  step('unit tests', 'node', ['node_modules/vitest/vitest.mjs', 'run']);
  console.log('  lint, typecheck, build and live specs are NOT run here; run them before merging the branch.');
} else {
  console.log('  Checks NOT run (use --verify). Run the full verify set before merging this branch.');
}
console.log(`\nNext: review, run your staging specs, then: git checkout ${original} && git merge ${branch}`);
