import * as fs from 'fs';
import * as path from 'path';
import { BrandConfigSchema, generateTokensCSS } from '../packages/brand-config';
import { brandConfig } from '../apps/storefront/brand.config';

function main() {
  console.log('Generating brand tokens...');

  // Validate the configuration
  const parsed = BrandConfigSchema.safeParse(brandConfig);
  if (!parsed.success) {
    console.error('❌ Invalid brand config:');
    parsed.error.issues.forEach(err => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }

  // Generate CSS
  const css = generateTokensCSS(parsed.data);

  // Write to styles directory
  const outPath = path.resolve(__dirname, '../apps/storefront/src/styles/brand.tokens.css');
  
  // Ensure directory exists
  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outPath, css);
  console.log(`✅ Tokens successfully written to ${outPath}`);
}

main();
