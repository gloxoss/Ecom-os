# Section 08: Polish & Deploy

## Overview
Finalize the codebase for its first staging deployment. This includes optimizing performance to hit the Lighthouse ≥ 90 target, ensuring accessibility (WCAG AA) standards, and adding the required pre-commit hooks (Husky/lint-staged) to enforce code quality moving forward.

## Risk: green - Iterative improvements
Optimization and linting are low risk. The main challenge is achieving the Lighthouse score if earlier sections introduced heavy client-side bundles.

## Dependencies
- **Depends on:** all previous sections
- **Blocks:** none
- **Parallel batch:** 7

## TDD Test Stubs
- Test: Lighthouse CLI audit on the built output scores ≥ 90 on Mobile Performance.
- Test: Axe accessibility audit passes with no critical violations.
- Test: Attempting to commit code with a TypeScript error is blocked by Husky.

## Tasks

<task type="auto" id="08-01">
  <name>Configure Pre-commit Hooks</name>
  <files>package.json, .husky/pre-commit</files>
  <action>
    Install Husky and lint-staged. Configure them to run ESLint, Prettier, and TypeScript compiler checks on staged files before allowing a commit.
  </action>
  <verify>Make an intentional TS error and try to commit. It should fail.</verify>
  <done>Code quality gates are enforced locally.</done>
</task>

<task type="auto" id="08-02">
  <name>Performance Audit & Optimization</name>
  <files>apps/storefront/src/app/layout.tsx, apps/storefront/src/app/page.tsx</files>
  <action>
    Run a local Lighthouse audit. Identify any render-blocking resources or oversized chunks. Apply `next/dynamic` to heavy components (like the CartDrawer or GSAP animations) if necessary to defer loading.
  </action>
  <verify>Lighthouse mobile performance score must be ≥ 90.</verify>
  <done>The application meets the strict performance requirements.</done>
</task>

<task type="auto" id="08-03">
  <name>Accessibility Audit</name>
  <files>apps/storefront/src/components/ui/*.tsx</files>
  <action>
    Run `@axe-core/react` or a browser extension to find a11y issues. Ensure all buttons have accessible names, inputs have labels, and color contrasts are sufficient across light and dark modes.
  </action>
  <verify>No critical accessibility violations reported.</verify>
  <done>The storefront is usable by everyone.</done>
</task>
