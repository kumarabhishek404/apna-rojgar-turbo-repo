#!/usr/bin/env bash
# Run Maestro smoke suite with .env variables.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

"$SCRIPT_DIR/check-ready.sh" --require-credentials

# shellcheck disable=SC1091
source "$SCRIPT_DIR/load-env.sh"
load_maestro_env "$ROOT"

"$SCRIPT_DIR/ensure-metro.sh"
adb reverse tcp:8081 tcp:8081 >/dev/null 2>&1 || true
adb shell input keyevent KEYCODE_WAKEUP >/dev/null 2>&1 || true
adb shell wm dismiss-keyguard >/dev/null 2>&1 || true
adb shell pm clear "$APP_ID" >/dev/null 2>&1 || true

mkdir -p "$ROOT/reports"

echo ""
echo "Running smoke suite..."
maestro test smoke/smoke-suite.yaml \
  -e APP_ID="$APP_ID" \
  -e STAGING_OTP="$STAGING_OTP" \
  -e WORKER_MOBILE="$WORKER_MOBILE" \
  -e EMPLOYER_MOBILE="${EMPLOYER_MOBILE:-$WORKER_MOBILE}" \
  -e MEDIATOR_MOBILE="${MEDIATOR_MOBILE:-$WORKER_MOBILE}" \
  -e ADMIN_MOBILE="${ADMIN_MOBILE:-$WORKER_MOBILE}" \
  -e SAMPLE_JOB_ID="${SAMPLE_JOB_ID:-}" \
  -e EXPO_DEV_CLIENT_URL="$EXPO_DEV_CLIENT_URL" \
  --format junit \
  --output "$ROOT/reports/maestro-smoke-junit.xml"

echo ""
echo "Done. Report: reports/maestro-smoke-junit.xml"
