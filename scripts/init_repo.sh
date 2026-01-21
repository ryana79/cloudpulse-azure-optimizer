#!/usr/bin/env bash
set -euo pipefail

git init
git checkout -b main
git add .
git commit -m "chore: initial scaffold"
git remote add origin https://github.com/your-org/cloudpulse.git

echo ""
echo "Run the following to push:"
echo "  git push -u origin main"

