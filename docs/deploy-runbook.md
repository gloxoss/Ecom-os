# Deploy Runbook

Deployments to Hostinger VPS are automated using the `deploy-hostinger.ts` script. The script performs an atomic deployment:
1. Uploads files using `rsync`
2. Installs production dependencies and builds the storefront
3. Performs a health check against the new build
4. Symbolically links the new release and restarts PM2

If any step fails, the script automatically rolls back to the previous release.

## Execution
```bash
npx tsx scripts/deploy-hostinger.ts --host <host> --user <user> --app <app-name>
```

Ensure `SSH_KEY_PATH` is set in your environment variables, or it defaults to `~/.ssh/id_rsa`.

## Acceptance Checklist
- Middleware security headers correctly injected
- PII-redacting structured logger enabled
- Rate-limiting rules active
- PM2 manages node processes successfully
