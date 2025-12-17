#!/usr/bin/env bash
set -euo pipefail

############################################
# deploy-ssh-update.sh
#
# Default (remote mode):
#   1) Manually SSH into the server (so you only verify/login once)
#   2) Run this script on the server to install/build/restart
#
# Optional (local sync mode):
#   If you set HOST=... on your laptop, the script will rsync code to the server,
#   then tell you which commands to run after you SSH in.
############################################

# Remote mode settings (used on the server)
APP_DIR="${APP_DIR:-/opt/giving}"
PM2_NAME="${PM2_NAME:-giving-app}"
HEALTH_URL="${HEALTH_URL:-http://localhost:3000/api/health}"

# Local sync mode settings (used on your laptop when HOST is set)
HOST="${HOST:-}"
USER="${USER:-root}"
PORT="${PORT:-22}"
KEY="${KEY:-}"
REMOTE_DIR="${REMOTE_DIR:-/opt/giving}"

MODE="remote"
if [[ -n "$HOST" ]]; then
  MODE="local-sync"
fi
echo "▶ deploy-ssh-update.sh mode: $MODE"

health_check() {
  local url="$1"
  if command -v curl >/dev/null 2>&1; then
    curl -fsS "$url" >/dev/null
    return 0
  fi
  if command -v wget >/dev/null 2>&1; then
    wget -qO- "$url" >/dev/null
    return 0
  fi
  if command -v node >/dev/null 2>&1; then
    URL="$url" node -e 'const http=require("http");const url=process.env.URL;const req=http.get(url,res=>{process.exit(res.statusCode>=200&&res.statusCode<300?0:1)});req.on("error",()=>process.exit(1));'
    return 0
  fi
  echo "❌ No curl/wget/node available for health check" >&2
  return 1
}

############################################
# Local sync mode (run on your laptop)
############################################
if [[ -n "$HOST" ]]; then
  SSH_OPTS=("-p" "$PORT" "-o" "StrictHostKeyChecking=accept-new")
  RSYNC_SSH=("ssh" "-p" "$PORT" "-o" "StrictHostKeyChecking=accept-new")

  if [[ -n "$KEY" ]]; then
    SSH_OPTS+=("-i" "$KEY")
    RSYNC_SSH+=("-i" "$KEY")
  fi

  REMOTE="$USER@$HOST"

  command -v rsync >/dev/null 2>&1 || { echo "❌ rsync not found (install it locally)." >&2; exit 1; }
  command -v ssh >/dev/null 2>&1 || { echo "❌ ssh not found." >&2; exit 1; }

  echo "🚀 Syncing code to $REMOTE:$REMOTE_DIR (no GitHub)"

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

  echo "✅ Code synced. Now SSH in once and run:"
  echo "   ssh -p $PORT ${KEY:+-i $KEY }$REMOTE"
  echo "   cd $REMOTE_DIR && bash deploy-ssh-update.sh"
  exit 0
fi

############################################
# Remote mode (run on the server)
############################################
if [[ -d "$APP_DIR" ]]; then
  cd "$APP_DIR"
else
  # If APP_DIR doesn't exist, fall back to the script directory.
  cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi

echo "📦 Installing dependencies"
command -v npm >/dev/null 2>&1 || { echo "❌ npm not found on server" >&2; exit 1; }
npm install

echo "🔨 Building"
npm run build

echo "♻️ Restarting pm2 process ($PM2_NAME)"
command -v pm2 >/dev/null 2>&1 || { echo "❌ pm2 not found on server (install: npm i -g pm2)" >&2; exit 1; }
pm2 restart "$PM2_NAME" || pm2 start npm --name "$PM2_NAME" -- start

echo "🩺 Health check"
sleep 3
health_check "$HEALTH_URL"
echo "✅ Deployment successful"

echo "✅ Done"
