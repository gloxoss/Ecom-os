import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discover, generate, renderProfiles } from './generate-clients.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const normalize = (text) => text.replace(/\r\n/g, '\n');

function scratchRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ecomos-clients-'));
  const write = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  };
  return { root, write };
}

test('committed generated registries match the folders on disk (no drift)', () => {
  for (const out of generate(rootDir)) {
    assert.equal(
      normalize(fs.readFileSync(out.file, 'utf8')),
      out.content,
      `${path.relative(rootDir, out.file)} is stale. Run: node scripts/generate-clients.mjs`
    );
  }
});

test('a new client is picked up without editing any existing file', () => {
  const { root, write } = scratchRepo();
  write('clients/acme/profile.ts', 'export const acmeProfile = {};\n');
  write('packages/themes/src/clients/acme/theme.ts', 'export const acmeTheme = {};\n');
  const [profiles, themes] = generate(root);
  assert.match(profiles.content, /import \{ acmeProfile \} from '..\/..\/..\/clients\/acme\/profile';/);
  assert.match(profiles.content, /acme: acmeProfile,/);
  assert.match(themes.content, /import \{ acmeTheme \} from '.\/clients\/acme\/theme';/);
  assert.match(themes.content, /acme: acmeTheme,/);
});

test('hyphenated client ids become quoted keys and output is sorted', () => {
  const { root, write } = scratchRepo();
  write('clients/zeta/profile.ts', 'export const zetaProfile = {};\n');
  write('clients/demo-2/profile.ts', 'export const demo2Profile = {};\n');
  const text = renderProfiles(discover(path.join(root, 'clients'), 'profile.ts', 'Profile'));
  assert.ok(text.indexOf('"demo-2": demo2Profile') < text.indexOf('zeta: zetaProfile'));
});

test('a folder without the expected file is skipped', () => {
  const { root, write } = scratchRepo();
  write('clients/notes/README.md', 'just docs\n');
  write('clients/acme/profile.ts', 'export const acmeProfile = {};\n');
  assert.deepEqual(
    discover(path.join(root, 'clients'), 'profile.ts', 'Profile').map((i) => i.id),
    ['acme']
  );
});

test('zero or several matching exports fail loudly instead of guessing', () => {
  const { root, write } = scratchRepo();
  write('clients/none/profile.ts', 'export const other = {};\n');
  assert.throws(() => discover(path.join(root, 'clients'), 'profile.ts', 'Profile'), /exactly one/);
  const second = scratchRepo();
  second.write('clients/two/profile.ts', 'export const aProfile = {};\nexport const bProfile = {};\n');
  assert.throws(() => discover(path.join(second.root, 'clients'), 'profile.ts', 'Profile'), /exactly one/);
});

test('two clients exporting the same name are rejected', () => {
  const { root, write } = scratchRepo();
  write('clients/a/profile.ts', 'export const sameProfile = {};\n');
  write('clients/b/profile.ts', 'export const sameProfile = {};\n');
  assert.throws(() => discover(path.join(root, 'clients'), 'profile.ts', 'Profile'), /used by both/);
});
