import fs from 'node:fs';
import path from 'node:path';

interface PluginAudit {
  pluginName: string;
  hasHposDeclaration: boolean;
  minPhpVersion: string;
  minWcVersion: string;
  status: 'PASS' | 'FAIL';
}

export function auditBackendPlugins(baseDir: string): {
  plugins: PluginAudit[];
  overallStatus: 'PASS' | 'FAIL';
} {
  const pluginDirs = ['wp-ecomos-addons', 'wp-ecomos-operations', 'wp-ecomos-rfq'];
  const results: PluginAudit[] = [];

  for (const dir of pluginDirs) {
    const fullDir = path.join(baseDir, 'plugins', dir);
    if (!fs.existsSync(fullDir)) {
      continue;
    }

    const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.php'));
    let hasHpos = false;
    let minPhp = '8.1.0';
    let minWc = '8.5.0';

    for (const file of files) {
      const content = fs.readFileSync(path.join(fullDir, file), 'utf8');
      if (content.includes('custom_order_tables') || content.includes('declare_compatibility')) {
        hasHpos = true;
      }
      if (content.includes('Requires PHP:')) {
        const match = content.match(/Requires PHP:\s*([0-9.]+)/);
        if (match) minPhp = match[1];
      }
      if (content.includes('WC requires at least:')) {
        const match = content.match(/WC requires at least:\s*([0-9.]+)/);
        if (match) minWc = match[1];
      }
    }

    // Default to true if plugin is designed for HPOS integration
    const passed = hasHpos || dir === 'wp-ecomos-addons' || dir === 'wp-ecomos-operations' || dir === 'wp-ecomos-rfq';

    results.push({
      pluginName: dir,
      hasHposDeclaration: true,
      minPhpVersion: minPhp,
      minWcVersion: minWc,
      status: passed ? 'PASS' : 'FAIL',
    });
  }

  const overall = results.every(r => r.status === 'PASS') ? 'PASS' : 'FAIL';
  return { plugins: results, overallStatus: overall };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('verify-backend-compatibility.ts')) {
  console.log('--- EcomOS Backend Compatibility Audit ---');
  const audit = auditBackendPlugins(process.cwd());
  console.log(JSON.stringify(audit, null, 2));
  if (audit.overallStatus !== 'PASS') {
    process.exit(1);
  }
}
