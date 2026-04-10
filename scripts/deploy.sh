#!/usr/bin/env bash
# Local / manual deploy triggers (queues GitHub Actions or hits Render hook).
#
# CI on push: workflows run on main only when the commit message includes
#   [deploy:all] | [deploy:app] | [deploy:backend] | [deploy:website]
# Plain "git push" without those tags does not deploy. Use:
#   ./scripts/push-deploy.sh -app -backend
#
# Usage:
#   ./scripts/deploy.sh --deploy -app
#   pnpm deploy -- --deploy -website -app
#
# Environment (optional):
#   DEPLOY_REF           — git ref for gh workflow runs (default: main)
#   WEBSITE_DEPLOY_HOOK  — POST URL (e.g. Render deploy hook) when using -website

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

do_deploy=false
want_website=false
want_app=false
want_backend=false

usage() {
  cat <<'EOF'
Usage:
  ./scripts/deploy.sh --deploy [-website] [-app] [-backend]

Runs locally: queues GitHub Actions (gh) and/or POSTs WEBSITE_DEPLOY_HOOK.
Requires: gh auth login (for -app / -backend). Does not git push.

Examples (from repo root):
  ./scripts/deploy.sh --deploy -app
  ./scripts/deploy.sh --deploy -backend
  ./scripts/deploy.sh --deploy -app -backend
  ./scripts/deploy.sh --deploy -website
  WEBSITE_DEPLOY_HOOK='https://api.render.com/deploy/srv_xxx?key=yyy' \
    ./scripts/deploy.sh --deploy -website
  DEPLOY_REF=main ./scripts/deploy.sh --deploy -backend

pnpm:
  pnpm deploy -- --deploy -app
  pnpm deploy -- --deploy -website -app -backend

Flags (combine any subset):
  -website, --website   Website (hook or deploy-website.yml)
  -app, --app            Mobile EAS OTA workflow
  -backend, --backend    Backend EC2 workflow

Environment:
  DEPLOY_REF            Ref for gh workflow run (default: main)
  WEBSITE_DEPLOY_HOOK   Render (or other) deploy hook URL for -website
EOF
}

for arg in "$@"; do
  case "$arg" in
    --deploy)
      do_deploy=true
      ;;
    -website | --website | -webisite)
      want_website=true
      ;;
    -app | --app)
      want_app=true
      ;;
    -backend | --backend)
      want_backend=true
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      echo "Run with --help for usage." >&2
      exit 1
      ;;
  esac
done

if ! $do_deploy; then
  echo "Error: pass --deploy plus at least one of: -website -app -backend" >&2
  usage >&2
  exit 1
fi

if ! $want_website && ! $want_app && ! $want_backend; then
  echo "Error: --deploy requires at least one target: -website -app -backend" >&2
  exit 1
fi

REF="${DEPLOY_REF:-main}"

require_gh() {
  if ! command -v gh >/dev/null 2>&1; then
    echo "Error: GitHub CLI (gh) is not installed or not on PATH." >&2
    echo "Install: https://cli.github.com/ — required for -app and -backend." >&2
    exit 1
  fi
}

deploy_website() {
  echo "==> Deploy: website"
  if [[ -n "${WEBSITE_DEPLOY_HOOK:-}" ]]; then
    curl -fsS -X POST "$WEBSITE_DEPLOY_HOOK"
    echo "Website deploy hook requested OK."
    return 0
  fi
  if [[ -f "$ROOT/.github/workflows/deploy-website.yml" ]]; then
    require_gh
    gh workflow run deploy-website.yml --ref "$REF"
    echo "Queued GitHub workflow: deploy-website.yml ($REF)"
    return 0
  fi
  echo "Error: website deploy not configured." >&2
  echo "Set WEBSITE_DEPLOY_HOOK to your Render (or other) deploy hook URL, or add .github/workflows/deploy-website.yml" >&2
  return 1
}

deploy_app() {
  require_gh
  echo "==> Deploy: mobile app (EAS OTA)"
  gh workflow run deploy-mobile-ota.yml --ref "$REF"
  echo "Queued GitHub workflow: deploy-mobile-ota.yml ($REF)"
}

deploy_backend() {
  require_gh
  echo "==> Deploy: backend (EC2)"
  gh workflow run deploy-backend-ec2.yml --ref "$REF"
  echo "Queued GitHub workflow: deploy-backend-ec2.yml ($REF)"
}

failed=0
$want_website && { deploy_website || failed=1; }
$want_app && { deploy_app || failed=1; }
$want_backend && { deploy_backend || failed=1; }

if [[ "$failed" -ne 0 ]]; then
  exit 1
fi

echo "Done."
