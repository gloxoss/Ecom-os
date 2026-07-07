#!/bin/bash
set -e

# Rule 1: No direct engine adapter imports in storefront (except lib/engine.ts)
echo "Checking for illegal direct engine imports..."
ILLEGAL=$(grep -rnE "import .* from '.*engine-(woocommerce|vendure)" apps/storefront/src \
  | grep -v "apps/storefront/src/lib/engine.ts" || true)
if [ -n "$ILLEGAL" ]; then
  echo "❌ Illegal direct engine imports:"
  echo "$ILLEGAL"
  exit 1
fi
echo "✅ Engine imports clean."

# Rule 2: Every addon in plugins/ must export register and disable
echo "Checking addon exports..."
for dir in plugins/*/; do
  # Check if directory exists
  if [ ! -d "$dir" ]; then continue; fi
  index="${dir}index.ts"
  if [ ! -f "$index" ]; then continue; fi
  if ! grep -q "export function register" "$index"; then
    echo "❌ $index is missing export 'register'"
    exit 1
  fi
  if ! grep -q "export function disable" "$index"; then
    echo "❌ $index is missing export 'disable'"
    exit 1
  fi
done
echo "✅ Addon exports clean."

exit 0
