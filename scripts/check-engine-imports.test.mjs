import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const loader = pathToFileURL(require.resolve('tsx/esm')).href;
const guard = fileURLToPath(new URL('./check-engine-imports.ts', import.meta.url));
function run({ content = '', file = 'apps/storefront/src/page.tsx', addon = 'export function register() {} export const disable = () => {};', missingSource = false, missingAddon = false } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'ecomos-guard-'));
  const write = (name, text) => { mkdirSync(path.dirname(path.join(dir, name)), { recursive: true }); writeFileSync(path.join(dir, name), text); };
  try {
    mkdirSync(path.join(dir, 'packages/addons-fixture/src'), { recursive: true });
    if (!missingSource) write(file, content);
    if (!missingAddon) write('packages/addons-fixture/src/index.ts', addon);
    return spawnSync(process.execPath, ['--import', loader, guard], { cwd: dir, encoding: 'utf8', timeout: 15000 });
  } finally {
    assert.equal(path.dirname(path.resolve(dir)), path.resolve(tmpdir()));
    assert.ok(path.basename(dir).startsWith('ecomos-guard-'));
    rmSync(dir, { recursive: true, force: true });
  }
}
for (const [label, content] of Object.entries({
  doubleQuote: 'import { Woo } from "@ecom-os/engine-woocommerce";',
  multiline: 'import {\n Woo\n} from "@ecom-os/engine-woocommerce";',
  reexport: 'export { Woo } from "@ecom-os/engine-vendure";',
  dynamic: 'const engine = import("@ecom-os/engine-woocommerce");',
  require: 'const engine = require("@ecom-os/engine-woocommerce");',
  importEquals: 'import engine = require("@ecom-os/engine-woocommerce");'
})) test(`rejects ${label} adapter reference`, () => assert.equal(run({ content }).status, 1));
test('only canonical lib/engine is exempt', () => {
  assert.equal(run({ file: 'apps/storefront/src/lib/engine.ts', content: 'export { Woo } from "@ecom-os/engine-woocommerce";' }).status, 0);
  assert.equal(run({ file: 'apps/storefront/src/other/lib/engine.ts', content: 'export { Woo } from "@ecom-os/engine-woocommerce";' }).status, 1);
});
test('allows engine contracts, comments and ordinary modules', () => assert.equal(run({ content: 'import type { Product } from "@ecom-os/ecom-engine"; // engine-woocommerce\nconst text = "engine-vendure";' }).status, 0));
test('allows named runtime reexports', () => assert.equal(run({ addon: 'export { register, disable } from "./implementation";' }).status, 0));
test('type-only exports do not satisfy runtime contract', () => assert.equal(run({ addon: 'export type { register, disable } from "./implementation";' }).status, 1));
test('missing required export fails', () => assert.equal(run({ addon: 'export function register() {}' }).status, 1));
test('missing source tree fails closed', () => assert.equal(run({ missingSource: true }).status, 1));
test('missing addon entrypoint fails closed', () => assert.equal(run({ missingAddon: true }).status, 1));
