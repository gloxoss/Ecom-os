#!/usr/bin/env node

import { Command } from 'commander';
import { themeCommand } from './commands/theme';
import { cmsCommand } from './commands/cms';

const program = new Command();

program
  .name('ecom')
  .description('Ecom-OS Developer CLI')
  .version('1.0.0');

program.addCommand(themeCommand);
program.addCommand(cmsCommand);

program.parse(process.argv);
