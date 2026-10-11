import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';

export interface ProvisioningConfig {
  clientId: string;
  databaseUrl: string;
  storefrontUrl: string;
  encryptionKey: string;
  sessionSecret: string;
  allowedPaymentMethods: string[];
}

export function validateProvisioning(config: Partial<ProvisioningConfig>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.clientId || !/^[a-z0-9-]+$/.test(config.clientId)) {
    errors.push('Invalid or missing clientId');
  }

  if (!config.databaseUrl || !config.databaseUrl.startsWith('mysql://')) {
    errors.push('Database URL must be a valid mysql:// connection string');
  }

  if (!config.storefrontUrl || !config.storefrontUrl.startsWith('https://')) {
    errors.push('Storefront URL must be an https:// URL');
  }

  if (!config.encryptionKey || Buffer.from(config.encryptionKey, 'base64').length !== 32) {
    errors.push('Encryption key must be a valid 32-byte base64-encoded key');
  }

  if (!config.sessionSecret || config.sessionSecret.length < 32) {
    errors.push('Session secret must be at least 32 characters long');
  }

  if (!config.allowedPaymentMethods || !config.allowedPaymentMethods.includes('cod')) {
    errors.push('Allowed payment methods must include certified "cod" method');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export const provisionCommand = new Command('provision')
  .description('Validate a client environment configuration (provisioning is not implemented yet)')
  .argument('<client-id>', 'Unique client identifier')
  .option('--dry-run', 'Validate the configuration only; write no state', false)
  .action((clientId: string, options: { dryRun: boolean }) => {
    console.log(`[PROVISION] Validating environment for client: ${clientId}...`);
    const envPath = path.resolve(process.cwd(), `.env.${clientId}`);

    if (!fs.existsSync(envPath)) {
      console.error(`[PROVISION-ERROR] Missing configuration file: ${envPath}`);
      process.exit(1);
    }

    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    const parsed: Record<string, string> = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...rest] = trimmed.split('=');
      parsed[key.trim()] = rest.join('=').trim();
    }

    const validation = validateProvisioning({
      clientId,
      databaseUrl: parsed.DATABASE_URL,
      storefrontUrl: parsed.STOREFRONT_URL,
      encryptionKey: parsed.ECOM_OS_ENCRYPTION_KEY,
      sessionSecret: parsed.SESSION_COOKIE_SECRET,
      allowedPaymentMethods: parsed.ALLOWED_PAYMENT_METHODS?.split(','),
    });

    if (!validation.valid) {
      console.error('[PROVISION-FAIL] Validation errors:');
      for (const err of validation.errors) {
        console.error(`  - ${err}`);
      }
      process.exit(1);
    }

    if (!options.dryRun) {
      // Do not report success after only validating an input file. This command does
      // not create an environment, database, or secrets yet, so it fails explicitly
      // instead of implying a provisioned client.
      console.error(
        `[PROVISION-NOT-IMPLEMENTED] Client ${clientId} configuration is valid, but this ` +
          'command does not provision an environment, database, or secrets.',
      );
      console.error('[PROVISION-NOT-IMPLEMENTED] No state was written. Re-run with --dry-run for validation only.');
      process.exit(3);
    }

    console.log(
      `[PROVISION-VALIDATED] Client ${clientId} configuration is valid. ` +
        'Nothing was provisioned (--dry-run: validation only).',
    );
  });
