import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import ts from '../apps/storefront/node_modules/typescript';

function walk(dir: string, fileList: string[] = []): string[] {
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (statSync(filePath).isDirectory()) {
        walk(filePath, fileList);
      } else {
        fileList.push(filePath);
      }
    }
  } catch (e) {
    // Ignore if directory doesn't exist
  }
  return fileList;
}

console.log("Checking for illegal direct engine imports...");
let illegalCount = 0;
const storefrontFiles = walk('apps/storefront/src');
for (const file of storefrontFiles) {
  if (file.replace(/\\/g, '/').endsWith('lib/engine.ts')) continue;
  const content = readFileSync(file, 'utf-8');
  if (/import .* from '.*engine-(woocommerce|vendure)/.test(content)) {
    console.error(`❌ Illegal direct engine import in ${file}`);
    illegalCount++;
  }
}

if (illegalCount > 0) process.exit(1);
console.log("✅ Engine imports clean.");

console.log("Checking addon exports...");
try {
  const packagesDir = 'packages';
  const packages = readdirSync(packagesDir);
  for (const pkg of packages) {
    if (pkg.startsWith('addons-')) {
      const index = path.join(packagesDir, pkg, 'src/index.ts');
      try {
        const content = readFileSync(index, 'utf-8');
        const source = ts.createSourceFile(index, content, ts.ScriptTarget.Latest, true);
        const exports = new Set<string>();
        for (const statement of source.statements) {
          if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
            for (const element of statement.exportClause.elements) exports.add(element.name.text);
          }
          if (ts.canHaveModifiers(statement) && ts.getModifiers(statement)?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
            if (ts.isFunctionDeclaration(statement) && statement.name) exports.add(statement.name.text);
            if (ts.isVariableStatement(statement)) {
              for (const declaration of statement.declarationList.declarations) {
                if (ts.isIdentifier(declaration.name)) exports.add(declaration.name.text);
              }
            }
          }
        }
        if (!exports.has('register')) {
          console.error(`❌ ${index} is missing export 'register'`);
          process.exit(1);
        }
        if (!exports.has('disable')) {
          console.error(`❌ ${index} is missing export 'disable'`);
          process.exit(1);
        }
      } catch (err) {
        // file doesn't exist
      }
    }
  }
} catch (e) {}

console.log("✅ Addon exports clean.");
process.exit(0);
