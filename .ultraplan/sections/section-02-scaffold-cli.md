# Section 02: CLI Scaffold Tool

## Overview
Build a command-line tool (`@ecom-os/cli`) to easily scaffold new storefront instances for clients. The CLI should prompt the user for the client's name, primary engine (WC vs Vendure), and desired addons. It then clones the `apps/storefront` template into a new directory and injects the proper brand configuration and environment variables.

## Risk: green - Standard file manipulation
Writing CLI prompts and copying files is a well-understood process. It uses standard Node.js APIs and inquirer/prompts libraries.

## Dependencies
- **Depends on:** section-01
- **Blocks:** none
- **Parallel batch:** 2

## TDD Test Stubs
- Test: CLI prompts correctly for project name and engine type.
- Test: CLI copies the `apps/storefront` template to the specified output directory.
- Test: CLI updates the new `package.json` with the client's project name.
- Test: CLI correctly injects `ADDONS` into the new `.env` file based on selection.

## Tasks

<task type="auto" id="02-01">
  <name>Initialize CLI package</name>
  <files>packages/cli/package.json, packages/cli/src/index.ts</files>
  <action>
    Create a new package in the monorepo named `@ecom-os/cli`. Setup TypeScript, Commander.js, and Prompts. Add a `bin` entry in package.json to make it executable.
  </action>
  <verify>Run the CLI executable locally and see a basic help output.</verify>
  <done>The CLI package is initialized and executable.</done>
</task>

<task type="auto" id="02-02">
  <name>Implement interactive prompts</name>
  <files>packages/cli/src/index.ts</files>
  <action>
    Add prompts asking for: 1) Project Name, 2) Engine (WooCommerce/Vendure), 3) Addons (multi-select list). Save these answers into a configuration object.
  </action>
  <verify>Run the CLI, answer the prompts, and verify the correct config object is logged.</verify>
  <done>The CLI successfully collects required deployment configuration from the user.</done>
</task>

<task type="auto" id="02-03">
  <name>Implement scaffolding logic</name>
  <files>packages/cli/src/scaffold.ts</files>
  <action>
    Copy the contents of `apps/storefront` to a new folder named after the project. Update the copied `package.json` name. Generate an `.env.local` file with `ADDONS=...` based on user selections.
  </action>
  <verify>Run the CLI, complete the prompts, and verify a new valid Next.js app is created in the target folder.</verify>
  <done>The CLI can successfully generate new customized client deployments.</done>
</task>
