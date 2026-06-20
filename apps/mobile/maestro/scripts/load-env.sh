#!/usr/bin/env bash
# Source maestro/.env into the current shell. Shell exports win over .env file.
load_maestro_env() {
  local root="${1:?maestro root required}"
  local saved_worker="${WORKER_MOBILE:-}"
  local saved_employer="${EMPLOYER_MOBILE:-}"
  local saved_mediator="${MEDIATOR_MOBILE:-}"
  local saved_admin="${ADMIN_MOBILE:-}"

  if [ -f "$root/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    source "$root/.env"
    set +a
  fi

  if [ -n "$saved_worker" ]; then export WORKER_MOBILE="$saved_worker"; fi
  if [ -n "$saved_employer" ]; then export EMPLOYER_MOBILE="$saved_employer"; fi
  if [ -n "$saved_mediator" ]; then export MEDIATOR_MOBILE="$saved_mediator"; fi
  if [ -n "$saved_admin" ]; then export ADMIN_MOBILE="$saved_admin"; fi

  export APP_ID="${APP_ID:-com.kumarabhishek404.labourapp}"
  export STAGING_OTP="${STAGING_OTP:-000000}"
  return 0
}
