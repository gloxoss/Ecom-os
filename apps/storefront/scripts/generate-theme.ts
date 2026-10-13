import fs from 'fs';
import path from 'path';
import { themeRegistry } from '@ecom-os/themes';
import { loadEnv } from '../../../scripts/generate-addons';

// Load apps/storefront/.env.local like the addon generator does; without this THEME_NAME in
// .env.local was ignored and the generator silently fell back to the default theme.
loadEnv();

const themeName = process.env.THEME_NAME || 'angelina';
const theme = themeRegistry[themeName];

if (!theme) {
  console.error(`Theme "${themeName}" not found in registry!`);
  process.exit(1);
}

const colors = theme.config.colors;
let cssVars = '';

for (const [key, value] of Object.entries(colors)) {
  // Convert camelCase to kebab-case (e.g. primaryForeground -> primary-foreground)
  const kebabKey = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  cssVars += `    --${kebabKey}: ${value};\n`;
}

if (theme.config.radius) {
  cssVars += `    --radius: ${theme.config.radius};\n`;
}

const cssOutput = `/* AUTO-GENERATED: DO NOT EDIT */
@layer base {
  :root {
${cssVars}
  }
}
`;

const outputPath = path.join(process.cwd(), 'src', 'styles', 'theme-vars.css');
fs.writeFileSync(outputPath, cssOutput, 'utf8');

console.log(`✅ Generated theme-vars.css for theme: ${themeName}`);
