import { brandConfig } from '../brand.config';
import { writeBrandStylesheets } from '../../../scripts/brand-styles';

// The storefront's own dev/build scripts call this entry point; the repo root's
// predev/prebuild call scripts/generate-tokens.ts. Both write the same two
// stylesheets from the same resolution, so neither can drift from the other.
const { themeName, files } = writeBrandStylesheets(brandConfig);

console.log(`✅ Generated brand tokens and theme variables for theme: ${themeName}`);
files.forEach((file) => console.log(`   ${file}`));
