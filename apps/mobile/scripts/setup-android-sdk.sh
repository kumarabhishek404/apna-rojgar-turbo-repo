#!/usr/bin/env bash
# Install Android SDK packages required for labour-app native builds (macOS + Homebrew).
set -euo pipefail

export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"

if ! command -v sdkmanager >/dev/null 2>&1; then
  echo "Installing Android command-line tools..."
  brew install --cask android-commandlinetools
fi

echo "Accepting SDK licenses..."
yes | sdkmanager --licenses >/dev/null

echo "Installing SDK packages (platform 35, build-tools, NDK)..."
sdkmanager \
  "platform-tools" \
  "platforms;android-35" \
  "build-tools;35.0.0" \
  "ndk;27.1.12297006"

LOCAL_PROPS="$(cd "$(dirname "$0")/../android" && pwd)/local.properties"
cat > "$LOCAL_PROPS" <<EOF
## Local Android SDK path — do not commit (gitignored)
sdk.dir=${ANDROID_HOME}
EOF

echo ""
echo "Android SDK ready at: $ANDROID_HOME"
echo "Wrote: $LOCAL_PROPS"
echo ""
echo "Add to ~/.zshrc (recommended):"
echo '  export ANDROID_HOME="/opt/homebrew/share/android-commandlinetools"'
echo '  export PATH="$ANDROID_HOME/platform-tools:$PATH"'
