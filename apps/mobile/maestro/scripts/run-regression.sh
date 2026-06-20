#!/usr/bin/env bash
# Run Maestro regression suite (smoke + role E2E journeys).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

"$ROOT/scripts/check-ready.sh" --require-regression

# shellcheck disable=SC1091
source "$ROOT/scripts/load-env.sh"
load_maestro_env "$ROOT"

mkdir -p "$ROOT/reports"

echo ""
echo "Running regression suite..."
maestro test regression/regression-suite.yaml \
  -e APP_ID="$APP_ID" \
  -e STAGING_OTP="$STAGING_OTP" \
  -e WORKER_MOBILE="$WORKER_MOBILE" \
  -e EMPLOYER_MOBILE="$EMPLOYER_MOBILE" \
  -e MEDIATOR_MOBILE="$MEDIATOR_MOBILE" \
  -e ADMIN_MOBILE="${ADMIN_MOBILE:-$WORKER_MOBILE}" \
  -e SAMPLE_JOB_ID="${SAMPLE_JOB_ID:-}" \
  --format junit \
  --output "$ROOT/reports/maestro-regression-junit.xml"

echo ""
echo "Done. Report: reports/maestro-regression-junit.xml"
