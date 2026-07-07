module.exports = {
  apps: [{
    name: process.env.APP_NAME ?? 'ecom-os',
    cwd: './apps/storefront',
    script: 'node_modules/.bin/next',
    args: 'start',
    env: { NODE_ENV: 'production', PORT: 3000 },
  }],
};
