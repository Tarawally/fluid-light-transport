#!/bin/bash
set -e

echo "🔄 Generating API reference from src/engine.js..."

cd "$(dirname "$0")/../.."

# 1. Generate API Reference (Markdown)
# Only update the file if content has changed to prevent preview reload loops
npx jsdoc2md src/engine.js > docs/api-reference-temp.md
if ! diff -q docs/api-reference-temp.md docs/api-reference-generated.md >/dev/null 2>&1; then
  mv docs/api-reference-temp.md docs/api-reference-generated.md
  echo "📝 API reference updated."
else
  rm docs/api-reference-temp.md
fi

# 2. Sync Demo Assets
# We use 'cp -u' (update) to only overwrite if the source is newer.
# This avoids triggering Quarto's file-watch reload when files are identical.
cp -u index.html docs/demo.html
cp -u theme-sync.js docs/theme-sync.js
mkdir -p docs/src docs/assets
cp -ur src/* docs/src/
cp -ur assets/* docs/assets/

echo "✅ Sync complete."

echo "✅ API reference and demo files synced"
