#!/usr/bin/env bash
# Ensure Metro is listening on :8081 for Expo dev client Maestro runs.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PORT="${METRO_PORT:-8081}"

if curl -sf "http://127.0.0.1:${PORT}/status" >/dev/null 2>&1; then
  echo "Metro already running on port ${PORT}"
  exit 0
fi

echo "Starting Metro on port ${PORT}..."
cd "$ROOT"
WATCHMAN_USE_POLLING=true pnpm exec expo start --port "$PORT" --non-interactive >/tmp/apna-rojgar-metro.log 2>&1 &
METRO_PID=$!

for _ in $(seq 1 90); do
  if curl -sf "http://127.0.0.1:${PORT}/status" >/dev/null 2>&1; then
    echo "Metro ready (pid ${METRO_PID})"
    exit 0
  fi
  sleep 2
done

echo "Metro failed to start within 3 minutes. See /tmp/apna-rojgar-metro.log" >&2
tail -30 /tmp/apna-rojgar-metro.log >&2 || true
exit 1
