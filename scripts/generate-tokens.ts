import { brandConfig } from '../apps/storefront/brand.config';
import { writeBrandStylesheets } from './brand-styles';

const { themeName, files } = writeBrandStylesheets(brandConfig);

console.log(`✅ Brand tokens and theme variables written for theme "${themeName}":`);
files.forEach((file) => console.log(`   ${file}`));
