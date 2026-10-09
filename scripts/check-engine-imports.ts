import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : /\.[cm]?[jt]sx?$/.test(file) ? [file] : [];
  });
}

function source(file: string): ts.SourceFile {
  return ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
}

function moduleReferences(tree: ts.SourceFile): string[] {
  const references: string[] = [];
  const visit = (node: ts.Node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) references.push(node.moduleSpecifier.text);
    if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference) && node.moduleReference.expression && ts.isStringLiteral(node.moduleReference.expression)) references.push(node.moduleReference.expression.text);
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
      const argument = node.arguments[0];
      if (argument && (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument))) references.push(argument.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return references;
}

function exportedNames(tree: ts.SourceFile): Set<string> {
  const names = new Set<string>();
  for (const statement of tree.statements) {
    if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) if (!element.isTypeOnly && !statement.isTypeOnly) names.add(element.name.text);
    }
    if (ts.canHaveModifiers(statement) && ts.getModifiers(statement)?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      if (ts.isFunctionDeclaration(statement) && statement.name) names.add(statement.name.text);
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text);
      }
    }
  }
  return names;
}

try {
  const violations: string[] = [];
  for (const file of walk('apps/storefront/src')) {
    if (file.replace(/\\/g, '/') === 'apps/storefront/src/lib/engine.ts') continue;
    if (moduleReferences(source(file)).some(reference => /(?:^|\/)engine-(?:woocommerce|vendure)(?:\/|$)/.test(reference))) violations.push(`Direct engine adapter import outside lib/engine.ts: ${file}`);
  }
  for (const entry of readdirSync('packages', { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith('addons-')) continue;
    const index = path.join('packages', entry.name, 'src/index.ts');
    const names = exportedNames(source(index));
    for (const required of ['register', 'disable']) if (!names.has(required)) violations.push(`${index} is missing runtime export '${required}'`);
  }
  if (violations.length) throw new Error(violations.join('\n'));
  console.log('Engine imports and addon runtime exports clean.');
} catch (error) {
  // Missing source directories or addon entrypoints must never look like a pass.
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
