#!/usr/bin/env bash
# Push Cursor backend env files into GitHub Actions secrets.
# Deploy then writes the same files onto EC2 — no separate server editing.
#
# Usage (from repo root, with gh auth login):
#   ./scripts/sync-backend-env-secrets.sh
#
# Requires local files:
#   apps/backend/.env
#   apps/backend/.env.production

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$ROOT/apps/backend"
ENV_FILE="$BACKEND/.env"
PROD_FILE="$BACKEND/.env.production"

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) is required. https://cli.github.com/" >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: missing $ENV_FILE" >&2
  exit 1
fi
if [ ! -f "$PROD_FILE" ]; then
  echo "Error: missing $PROD_FILE" >&2
  exit 1
fi

# Guard: base .env must not force development (breaks production DB selection)
if grep -Eq '^[[:space:]]*NODE_ENV[[:space:]]*=[[:space:]]*development' "$ENV_FILE"; then
  echo "Error: $ENV_FILE sets NODE_ENV=development." >&2
  echo "Remove NODE_ENV from .env (use .env.local for dev, .env.production for prod)." >&2
  exit 1
fi

if ! grep -Eq '^[[:space:]]*PRODUCTION_DB_NAME[[:space:]]*=' "$PROD_FILE"; then
  echo "Error: $PROD_FILE must set PRODUCTION_DB_NAME (e.g. LABOUR_APP)." >&2
  exit 1
fi

echo "==> Setting GitHub secret BACKEND_ENV_B64 from apps/backend/.env"
base64 < "$ENV_FILE" | gh secret set BACKEND_ENV_B64

echo "==> Setting GitHub secret BACKEND_ENV_PRODUCTION_B64 from apps/backend/.env.production"
base64 < "$PROD_FILE" | gh secret set BACKEND_ENV_PRODUCTION_B64

echo "Done. Next deploy will write these files on EC2 and start with npm start (production DB)."
echo "Deploy: ./scripts/deploy.sh --deploy -backend"
echo "Or push to main with [deploy:backend] in the commit message."
