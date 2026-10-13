#!/usr/bin/env node
// Cut an EcomOS starter release: validate, bump root version, commit, tag.
// Dry run by default. Nothing is pushed. Usage:
//   node scripts/ecomos-release.mjs <version> [--yes] [--verify]
// <version> is semver without the leading "v", for example 1.0.0-rc.2 or 1.1.0.
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;
const args = process.argv.slice(2);
const version = args.find((a) => !a.startsWith('--'));
const apply = args.includes('--yes');
const verify = args.includes('--verify');

const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();
const problems = [];
const notes = [];

if (!version || !SEMVER.test(version)) {
  console.error('Usage: node scripts/ecomos-release.mjs <semver> [--yes] [--verify]');
  process.exit(2);
}
const tag = `v${version}`;

if (git('tag', '--list', tag)) problems.push(`Tag ${tag} already exists.`);

const dirty = git('status', '--porcelain', '--untracked-files=no')
  .split('\n')
  .filter((l) => l && !l.includes('plugins/wordpress-mcp'));
if (dirty.length) problems.push(`Tracked files have uncommitted changes:\n  ${dirty.join('\n  ')}`);

const changelog = readFileSync('docs/ecomos/CHANGELOG.md', 'utf8');
if (!changelog.includes(`## [${version}]`)) {
  problems.push(`docs/ecomos/CHANGELOG.md has no "## [${version}]" section.`);
}
const migrations = readFileSync('docs/ecomos/MIGRATIONS.md', 'utf8');
if (!migrations.includes(`## ${version}`)) {
  problems.push(`docs/ecomos/MIGRATIONS.md has no "## ${version}" section (write "None." if nothing changes).`);
}

if (verify) {
  const run = (label, cmd, cmdArgs) => {
    const r = spawnSync(cmd, cmdArgs, { stdio: 'inherit', shell: process.platform === 'win32' });
    if (r.status !== 0) problems.push(`${label} failed (exit ${r.status}).`);
    else notes.push(`${label}: PASS`);
  };
  run('architecture guard', 'node', ['node_modules/tsx/dist/cli.mjs', 'scripts/check-engine-imports.ts']);
  run('unit tests', 'node', ['node_modules/vitest/vitest.mjs', 'run']);
} else {
  notes.push('Checks NOT run (pass --verify to run the guard and unit tests). Lint, typecheck, build and live specs are never run here.');
}

console.log(`Release ${tag} from ${git('rev-parse', '--abbrev-ref', 'HEAD')} @ ${git('rev-parse', '--short', 'HEAD')}`);
notes.forEach((n) => console.log(`  note: ${n}`));
if (problems.length) {
  console.error('\nBlocked:');
  problems.forEach((p) => console.error(`  - ${p}`));
  process.exit(1);
}
if (!apply) {
  console.log('\nDry run OK. Re-run with --yes to bump the version, commit and tag. Nothing is pushed.');
  process.exit(0);
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
pkg.version = version;
writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
git('add', 'package.json');
git('commit', '--only', 'package.json', '-m', `chore(release): ${tag}`);
git('tag', '-a', tag, '-m', `EcomOS ${version}`);
console.log(`\nCreated commit and annotated tag ${tag} at ${git('rev-parse', '--short', 'HEAD')}. Push with: git push origin ${tag} (not done).`);
