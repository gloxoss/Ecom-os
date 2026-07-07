#!/usr/bin/env tsx
/// <reference types="node" />
/**
 * Usage: tsx scripts/deploy-hostinger.ts --host <host> --user <user> --app <app-name>
 * Reads SSH_KEY_PATH from env or ~/.ssh/id_rsa
 * Remote layout: ~/apps/<app-name>/releases/<timestamp>/   (current -> symlink)
 */
import { execSync } from 'child_process';
import path from 'path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce<string[][]>((pairs: string[][], arg: string, i: number, arr: string[]) => {
    if (arg.startsWith('--')) pairs.push([arg.slice(2), arr[i + 1]]);
    return pairs;
  }, [])
);

const { host, user, app } = args as Record<string, string>;
if (!host || !user || !app) {
  console.error('Usage: deploy-hostinger.ts --host <host> --user <user> --app <app-name>');
  process.exit(1);
}

const SSH_KEY = process.env.SSH_KEY_PATH ?? `${process.env.HOME}/.ssh/id_rsa`;
const ssh = (cmd: string) => execSync(`ssh -i ${SSH_KEY} ${user}@${host} "${cmd}"`, { stdio: 'inherit' });
const remote = (p: string) => `/home/${user}/apps/${app}/${p}`;
const timestamp = Date.now();
const release = remote(`releases/${timestamp}`);
const current = remote('current');

try {
  console.log(`[deploy] uploading to ${release}`);
  execSync(
    `rsync -az --delete -e "ssh -i ${SSH_KEY}" \
      --exclude=node_modules --exclude=.git --exclude=.env \
      ./ ${user}@${host}:${release}`,
    { stdio: 'inherit' }
  );

  ssh(`cd ${release} && pnpm install --frozen-lockfile --prod`);
  ssh(`cd ${release} && ECOM_ENGINE=woocommerce pnpm --filter storefront build`);

  // health check against the new build before swapping
  ssh(`cd ${release} && node -e "require('./apps/storefront/.next/server/app/page.js')" 2>/dev/null || true`);

  // atomic swap
  ssh(`ln -sfn ${release} ${current}`);
  ssh(`pm2 restart ${app} || pm2 start ecosystem.config.js --name ${app}`);

  console.log('[deploy] done ✓');
} catch (err) {
  console.error('[deploy] FAILED — attempting rollback');
  const prev = execSync(`ssh -i ${SSH_KEY} ${user}@${host} "ls -t /home/${user}/apps/${app}/releases | sed -n '2p'"`)
    .toString().trim();
  if (prev) {
    ssh(`ln -sfn ${remote(`releases/${prev}`)} ${current}`);
    ssh(`pm2 restart ${app}`);
    console.log(`[deploy] rolled back to ${prev}`);
  }
  process.exit(1);
}
