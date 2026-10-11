#!/usr/bin/env node

import { Command } from 'commander';
import { themeCommand } from './commands/theme';
import { cmsCommand } from './commands/cms';
import { provisionCommand } from './commands/provision';

const program = new Command();

program
  .name('ecom')
  .description('Ecom-OS Developer CLI')
  .version('1.0.0');

program.addCommand(themeCommand);
program.addCommand(cmsCommand);
program.addCommand(provisionCommand);

program.parse(process.argv);
