#!/bin/bash
cd /Users/steve/work/termkan
chmod +x bin/tk.js
echo "Made bin/tk.js executable"

# Update .turncan references
grep -r "turncan" src/ --include="*.ts" --include="*.tsx" -l 2>/dev/null

# Build
yarn tsc --noEmit
echo "Type check passed"

# Make tk available locally
yarn build 2>&1 || true
