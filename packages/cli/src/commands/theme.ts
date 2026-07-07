import { Command } from 'commander';
import * as p from '@clack/prompts';
import fs from 'fs';
import path from 'path';
import pc from 'picocolors';

export const themeCommand = new Command('theme')
  .description('Scaffold a new Ecom-os theme')
  .action(async () => {
    p.intro(pc.bgCyan(pc.black(' Ecom-os Theme Scaffolder ')));

    const project = await p.group(
      {
        name: () =>
          p.text({
            message: 'What is the name of your new theme?',
            placeholder: 'my-luxury-brand',
            validate: (value) => {
              if (!value) return 'Please enter a name.';
              if (!/^[a-z0-9-]+$/.test(value)) return 'Only lowercase letters, numbers, and dashes are allowed.';
            },
          }),
        base: () =>
          p.select({
            message: 'Which base aesthetic should we start from?',
            options: [
              { value: 'default', label: 'Default (Slate, 0.5rem radius)' },
              { value: 'minimal', label: 'Minimal (High contrast, 0 radius)' },
              { value: 'luxury', label: 'Luxury (Dark mode, elegant)' },
            ],
          }),
      },
      {
        onCancel: () => {
          p.cancel('Operation cancelled.');
          process.exit(0);
        },
      }
    );

    const s = p.spinner();
    s.start('Scaffolding theme files...');

    const themeDir = path.join(process.cwd(), '../../packages/themes/src/clients', project.name);
    
    if (fs.existsSync(themeDir)) {
      s.stop('Failed');
      p.log.error(pc.red(`Theme directory already exists: ${themeDir}`));
      process.exit(1);
    }

    // Create theme directory
    fs.mkdirSync(themeDir, { recursive: true });

    // Generate theme.ts
    const themeTsContent = `import { EcomTheme } from '../../types';

export const ${project.name.replace(/-([a-z])/g, g => g[1].toUpperCase())}Theme: EcomTheme = {
  name: '${project.name}',
  config: {
    colors: {
      background: '0 0% 100%',
      foreground: '0 0% 3.9%',
      primary: '0 0% 9%',
      primaryForeground: '0 0% 98%',
      // ... expand as needed based on ${project.base}
    },
    radius: '0.5rem',
  },
  templates: {
    // Override default Next.js routes here
    // e.g., 'home': () => import('./components/home'),
  }
};
`;
    fs.writeFileSync(path.join(themeDir, 'theme.ts'), themeTsContent);

    // Generate DESIGN.md
    const designMdContent = `# ${project.name} Design Guidelines
Base: ${project.base}

Add your client-specific design tokens, typography rules, and component constraints here.
`;
    fs.writeFileSync(path.join(themeDir, 'DESIGN.md'), designMdContent);

    // Update index.ts exports
    const indexPath = path.join(process.cwd(), '../../packages/themes/src/index.ts');
    if (fs.existsSync(indexPath)) {
      let indexContent = fs.readFileSync(indexPath, 'utf8');
      
      // We will blindly append for now, but in a real scenario we'd parse AST
      // Just add the import and the case in getTheme
      const themeExportName = `${project.name.replace(/-([a-z])/g, g => g[1].toUpperCase())}Theme`;
      indexContent = `import { ${themeExportName} } from './clients/${project.name}/theme';\n` + indexContent;
      
      // Inject into the switch statement. This is a bit hacky with regex.
      indexContent = indexContent.replace(
        /default:/,
        `case '${project.name}': return ${themeExportName};\n    default:`
      );
      
      fs.writeFileSync(indexPath, indexContent);
    }

    s.stop('Done');

    p.note(
      `Next steps:\n1. Edit packages/themes/src/clients/${project.name}/theme.ts\n2. Run pnpm dev with THEME_NAME=${project.name}`,
      'Theme scaffolded successfully!'
    );

    p.outro(pc.green('Ready to build!'));
  });
