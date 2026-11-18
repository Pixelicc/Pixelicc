#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="${REPO_DIR:-$(cd "${SCRIPT_DIR}/.." && pwd)}"
cd "${REPO_DIR}"

if [[ -f "${REPO_DIR}/.env" ]]; then
  set -a
  source "${REPO_DIR}/.env"
  set +a
fi

git pull --ff-only
bun install --frozen-lockfile --production
bun run index.ts

if git diff --quiet -- README.md; then
  echo "README.md unchanged; skipping commit"
  exit 0
fi

git add README.md
git -c user.name="github-actions" \
  -c user.email="41898282+github-actions[bot]@users.noreply.github.com" \
  commit -m "Updated \`README.md\` File"
git push
