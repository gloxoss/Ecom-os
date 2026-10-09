#!/usr/bin/env bash
set -euo pipefail

# Keep shell and CI callers on the same parser-based guard.
cd "$(dirname "$0")/.."
exec pnpm exec tsx scripts/check-engine-imports.ts
