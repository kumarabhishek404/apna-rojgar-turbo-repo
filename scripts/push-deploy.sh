#!/usr/bin/env bash
# Push the current branch to origin and trigger CI deploys by adding an empty commit
# whose message includes deploy tags (see .github/workflows/deploy-*.yml).
#
# Plain "git push" without these tags on your commits does NOT run deploy workflows.
#
# Usage:
#   ./scripts/push-deploy.sh -app
#   ./scripts/push-deploy.sh -app -backend
#   ./scripts/push-deploy.sh -website
#   ./scripts/push-deploy.sh -all
#
# pnpm:
#   pnpm push-deploy -- -app -backend
#
# You can instead put the same tags in any regular commit message, then git push:
#   git commit -m "fix auth [deploy:app]"
#   git push

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

want_website=false
want_app=false
want_backend=false
want_all=false

usage() {
  cat <<'EOF'
Usage:
  ./scripts/push-deploy.sh [-all] [-website] [-app] [-backend]

Creates an empty commit with [deploy:…] tags and git push origin <branch>.
CI deploy workflows on main only run when that message includes the tags.

Examples (checkout main, then):
  ./scripts/push-deploy.sh -app
  ./scripts/push-deploy.sh -backend
  ./scripts/push-deploy.sh -app -backend
  ./scripts/push-deploy.sh -all

pnpm:
  pnpm push-deploy -- -app
  pnpm push-deploy -- -app -backend
  pnpm push-deploy -- -all

Deploy tags inside a normal commit (then push as usual):
  git add -A && git commit -m "fix: login [deploy:app]" && git push origin main
  git commit -m "release: api [deploy:backend]" && git push origin main
  git commit -m "ship everything [deploy:all]" && git push origin main

Manual run in GitHub: Actions → workflow → "Run workflow" (no tag needed).

-all writes [deploy:all] → runs both mobile (EAS OTA) and backend (EC2) workflows.
  (Website is not on GitHub Actions yet; use ./scripts/deploy.sh --deploy -website.)
EOF
}

for arg in "$@"; do
  case "$arg" in
    -h | --help)
      usage
      exit 0
      ;;
    -all | --all)
      want_all=true
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
    *)
      echo "Unknown option: $arg" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if $want_all; then
  want_website=true
  want_app=true
  want_backend=true
fi

if ! $want_website && ! $want_app && ! $want_backend; then
  echo "Error: pass at least one of: -all -website -app -backend" >&2
  usage >&2
  exit 1
fi

tags=()
$want_app && tags+=('[deploy:app]')
$want_backend && tags+=('[deploy:backend]')
$want_website && tags+=('[deploy:website]')

# If -all, use single token workflows understand
if $want_all; then
  msg="ci: deploy all [deploy:all]"
else
  msg="ci: deploy ${tags[*]}"
fi

branch="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$branch" == "HEAD" ]]; then
  echo "Error: detached HEAD; checkout a branch first." >&2
  exit 1
fi

if [[ "$branch" != "main" ]]; then
  echo "Note: deploy workflows on GitHub only react to pushes to main (current branch: $branch)." >&2
fi

git commit --allow-empty -m "$msg"
git push origin "$branch"

echo "Pushed. Deploy workflows will run if this branch is main and Actions are enabled."
