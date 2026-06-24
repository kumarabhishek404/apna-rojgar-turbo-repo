#!/usr/bin/env bash
# Preflight checks before running Maestro tests.
# Usage: check-ready.sh [--require-credentials | --require-regression]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

REQUIRE_CREDS=0
REQUIRE_REGRESSION=0
if [ "${1:-}" = "--require-credentials" ]; then
  REQUIRE_CREDS=1
elif [ "${1:-}" = "--require-regression" ]; then
  REQUIRE_CREDS=1
  REQUIRE_REGRESSION=1
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}!${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }

is_valid_mobile() {
  local mobile="${1:-}"
  [[ -n "$mobile" && "$mobile" != "6397308499" && "$mobile" =~ ^[0-9]{10}$ ]]
}

# shellcheck disable=SC1091
source "$SCRIPT_DIR/load-env.sh"

load_env() {
  if [ ! -f "$ROOT/.env" ]; then
    if [ -f "$ROOT/.env.example" ]; then
      cp "$ROOT/.env.example" "$ROOT/.env"
      warn "Created maestro/.env from .env.example — set WORKER_MOBILE (10-digit staging account)"
    else
      warn ".env missing — create maestro/.env with WORKER_MOBILE"
      return 0
    fi
  fi

  ok ".env found"
  load_maestro_env "$ROOT"
}

echo "Apna Rojgar Maestro — preflight"
echo "================================"

load_maestro_env "$ROOT"

# Maestro CLI
if command -v maestro >/dev/null 2>&1; then
  ok "Maestro CLI: $(maestro --version 2>/dev/null | head -1 || echo installed)"
else
  fail "Maestro not installed. Run: pnpm test:maestro:install"
fi

# Java (required by Maestro)
if command -v java >/dev/null 2>&1 && java -version >/dev/null 2>&1; then
  ok "Java: $(java -version 2>&1 | head -1)"
else
  fail "Java not found (Maestro requires JDK 11+).
  macOS: brew install openjdk@17
  Scripts auto-detect Homebrew openjdk@17 when installed."
fi

load_env

export APP_ID="${APP_ID:-com.kumarabhishek404.labourapp}"
export STAGING_OTP="${STAGING_OTP:-000000}"

if [ "$REQUIRE_CREDS" = 1 ]; then
  if ! is_valid_mobile "${WORKER_MOBILE:-}"; then
    echo ""
    fail "WORKER_MOBILE is required (10 digits, staging account with complete profile).
  1. cd apps/mobile/maestro
  2. Edit .env — set WORKER_MOBILE=XXXXXXXXXX
  3. Or run: WORKER_MOBILE=XXXXXXXXXX pnpm test:maestro:smoke"
  fi
  ok "WORKER_MOBILE set"

  if [ "$REQUIRE_REGRESSION" = 1 ]; then
    for var in EMPLOYER_MOBILE MEDIATOR_MOBILE; do
      if ! is_valid_mobile "${!var:-}"; then
        echo ""
        fail "$var is required for regression (10-digit staging account). Edit maestro/.env"
      fi
      ok "$var set"
    done
  fi
else
  if is_valid_mobile "${WORKER_MOBILE:-}"; then
    ok "WORKER_MOBILE set"
  else
    warn "WORKER_MOBILE not set (required for smoke — edit maestro/.env)"
  fi
  if is_valid_mobile "${EMPLOYER_MOBILE:-}"; then ok "EMPLOYER_MOBILE set"; else warn "EMPLOYER_MOBILE not set (optional for smoke)"; fi
  if is_valid_mobile "${MEDIATOR_MOBILE:-}"; then ok "MEDIATOR_MOBILE set"; else warn "MEDIATOR_MOBILE not set (optional for smoke)"; fi
fi

# Android device (awk avoids grep exit 1 + set -e when no devices)
if command -v adb >/dev/null 2>&1; then
  DEVICES=$(adb devices 2>/dev/null | awk '/\tdevice$/{count++} END {print count+0}')
  if [ "$DEVICES" -gt 0 ]; then
    ok "Android device/emulator connected ($DEVICES)"
  else
    fail "No Android device/emulator. Start emulator or connect device, then: adb devices"
  fi
else
  warn "adb not in PATH — skip device check"
fi

# App installed (grep in if-test — safe with set -e)
if command -v adb >/dev/null 2>&1; then
  if adb devices 2>/dev/null | awk '/\tdevice$/{found=1; exit} END{exit !found}'; then
    if adb shell pm list packages 2>/dev/null | grep -q "$APP_ID"; then
      ok "App installed: $APP_ID"
    else
      fail "App $APP_ID not installed on the connected device.
  Expo Go cannot be used — install the dev client or debug APK:
    pnpm --filter labour-app android
  Or: adb install -r path/to/your-build.apk"
    fi
  fi
fi

# Flow files
SMOKE="$ROOT/smoke/smoke-suite.yaml"
[ -f "$SMOKE" ] && ok "Smoke suite: smoke/smoke-suite.yaml" || fail "Missing smoke/smoke-suite.yaml"

GENERATED_COUNT=$(find "$ROOT/flows/generated" -name '*.yaml' 2>/dev/null | wc -l | tr -d ' ')
ok "Generated flows: $GENERATED_COUNT"

echo ""
echo -e "${GREEN}Ready to run:${NC}  pnpm test:maestro:smoke"
echo -e "${GREEN}Full regression:${NC} pnpm test:maestro:regression"
