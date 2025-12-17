#!/usr/bin/env bash
set -euo pipefail

# Deploy without GitHub: push current workspace to server via SSH, then build & restart.
#
# Usage:
#   HOST=203.195.208.202 USER=root bash deploy-ssh-update.sh
#   HOST=203.195.208.202 USER=root KEY=~/.ssh/id_rsa bash deploy-ssh-update.sh
#   HOST=203.195.208.202 USER=root PORT=22 REMOTE_DIR=/opt/giving bash deploy-ssh-update.sh
#
# Notes:
# - This preserves server-side uploads and database by excluding:
#   public/uploads/, database.db, .env*.
# - Requires: ssh + rsync on your machine, and rsync on the server.

HOST="${HOST:-}"
USER="${USER:-root}"
PORT="${PORT:-22}"
KEY="${KEY:-}"
REMOTE_DIR="${REMOTE_DIR:-/opt/giving}"

if [[ -z "$HOST" ]]; then
  echo "❌ Missing HOST. Example: HOST=203.195.208.202 USER=root bash deploy-ssh-update.sh" >&2
  exit 1
fi

SSH_OPTS=("-p" "$PORT" "-o" "StrictHostKeyChecking=accept-new")
RSYNC_SSH=("ssh" "-p" "$PORT" "-o" "StrictHostKeyChecking=accept-new")

if [[ -n "$KEY" ]]; then
  SSH_OPTS+=("-i" "$KEY")
  RSYNC_SSH+=("-i" "$KEY")
fi

REMOTE="$USER@$HOST"

command -v rsync >/dev/null 2>&1 || { echo "❌ rsync not found (install it locally)." >&2; exit 1; }
command -v ssh >/dev/null 2>&1 || { echo "❌ ssh not found." >&2; exit 1; }

echo "🚀 Deploying to $REMOTE:$REMOTE_DIR (no GitHub)"

# Ensure remote dir exists
ssh "${SSH_OPTS[@]}" "$REMOTE" "mkdir -p '$REMOTE_DIR'"

# Push code (exclude runtime/persistent directories)
# --delete keeps server code in sync but exclusions preserve uploads/db/env.
rsync -az --delete \
  --exclude '.git/' \
  --exclude 'node_modules/' \
  --exclude '.next/' \
  --exclude 'database.db' \
  --exclude '.env' \
  --exclude '.env.*' \
  --exclude 'public/uploads/' \
  --exclude 'public/mediapipe/' \
  -e "${RSYNC_SSH[*]}" \
  ./ "$REMOTE:$REMOTE_DIR/"

echo "📦 Installing dependencies + building on server"
ssh "${SSH_OPTS[@]}" "$REMOTE" "cd '$REMOTE_DIR' && npm install && npm run build"

echo "♻️ Restarting pm2 process"
ssh "${SSH_OPTS[@]}" "$REMOTE" "cd '$REMOTE_DIR' && pm2 restart giving-app || pm2 start npm --name 'giving-app' -- start"

echo "🩺 Health check"
ssh "${SSH_OPTS[@]}" "$REMOTE" "sleep 3 && curl -fsS http://localhost:3000/api/health >/dev/null && echo '✅ Deployment successful' || (echo '❌ Health check failed' && exit 1)"

echo "✅ Done"
