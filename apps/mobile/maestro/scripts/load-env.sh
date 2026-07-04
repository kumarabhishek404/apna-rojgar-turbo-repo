#!/usr/bin/env bash
# Source maestro/.env into the current shell. Shell exports win over .env file.
load_maestro_env() {
  local root="${1:?maestro root required}"

  # Maestro requires Java; Homebrew openjdk@17 is keg-only on macOS
  if [ -d "/opt/homebrew/opt/openjdk@17/bin" ]; then
    export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
    export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
  elif [ -d "/usr/local/opt/openjdk@17/bin" ]; then
    export PATH="/usr/local/opt/openjdk@17/bin:$PATH"
    export JAVA_HOME="/usr/local/opt/openjdk@17"
  fi
  export PATH="$HOME/.maestro/bin:$PATH"

  # Android platform-tools (adb) — Homebrew SDK or Android Studio default
  if [ -n "${ANDROID_HOME:-}" ] && [ -d "$ANDROID_HOME/platform-tools" ]; then
    export PATH="$ANDROID_HOME/platform-tools:$PATH"
  elif [ -d "/opt/homebrew/share/android-commandlinetools/platform-tools" ]; then
    export ANDROID_HOME="/opt/homebrew/share/android-commandlinetools"
    export PATH="$ANDROID_HOME/platform-tools:$PATH"
  elif [ -d "$HOME/Library/Android/sdk/platform-tools" ]; then
    export ANDROID_HOME="$HOME/Library/Android/sdk"
    export PATH="$ANDROID_HOME/platform-tools:$PATH"
  fi

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
  export EXPO_DEV_CLIENT_URL="${EXPO_DEV_CLIENT_URL:-exp+labour-app://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081}"
  return 0
}
