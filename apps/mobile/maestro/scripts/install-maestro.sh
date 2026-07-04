#!/usr/bin/env bash
# Install Maestro CLI to ~/.maestro/bin (idempotent).
set -euo pipefail

export PATH="$HOME/.maestro/bin:$PATH"

if command -v maestro >/dev/null 2>&1; then
  echo "Maestro already installed: $(maestro --version 2>/dev/null | head -1 || echo ok)"
  exit 0
fi

echo "Installing Maestro CLI..."
curl -Ls "https://get.maestro.mobile.dev" | bash
export PATH="$HOME/.maestro/bin:$PATH"

if command -v maestro >/dev/null 2>&1; then
  echo "Maestro installed: $(maestro --version 2>/dev/null | head -1 || echo ok)"
  echo "Add to your shell profile if needed: export PATH=\"\$HOME/.maestro/bin:\$PATH\""
else
  echo "Maestro install finished but 'maestro' is not on PATH." >&2
  echo "Run: export PATH=\"\$HOME/.maestro/bin:\$PATH\"" >&2
  exit 1
fi

# Java hint (Maestro requires JDK 11+)
if ! command -v java >/dev/null 2>&1 || ! java -version >/dev/null 2>&1; then
  echo ""
  echo "Java not found. Install JDK 17 before running tests:"
  echo "  brew install openjdk@17"
fi
