#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

POETRY_BIN="${POETRY_BIN:-$(command -v poetry || true)}"
if [[ -z "$POETRY_BIN" && -x "$HOME/Library/Python/3.12/bin/poetry" ]]; then
  POETRY_BIN="$HOME/Library/Python/3.12/bin/poetry"
fi
if [[ -z "$POETRY_BIN" ]]; then
  echo "Poetry not found. Install Poetry or set POETRY_BIN." >&2
  exit 1
fi

cd "$ROOT_DIR/apps/api"
"$POETRY_BIN" run uvicorn main:app --reload --host 127.0.0.1 --port 8000 &
API_PID=$!

cd "$ROOT_DIR/apps/web"
npm run dev &
WEB_PID=$!

cleanup() {
  kill "$API_PID" "$WEB_PID" 2>/dev/null || true
}
trap cleanup EXIT

wait "$API_PID" "$WEB_PID"

