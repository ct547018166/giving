#!/usr/bin/env bash
set -euo pipefail

echo "ℹ️ deploy-ssh-update.sh has been renamed to update.sh"
echo "   Running: bash update.sh"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$SCRIPT_DIR/update.sh" "$@"
