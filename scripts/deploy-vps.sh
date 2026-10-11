#!/usr/bin/env bash
# Despliega asg (SICR3P BaaS) al VPS vía SSH + git + PM2 o Docker Compose.
# Uso:
#   VPS_HOST=x.x.x.x VPS_USER=deploy ./scripts/deploy-vps.sh
set -euo pipefail

VPS_HOST=${VPS_HOST:-149.50.155.61}
VPS_USER=${VPS_USER:-root}
VPS_PORT=${VPS_PORT:-5757}
APP_DIR=${APP_DIR:-/var/www/sicr3p}
BRANCH=${BRANCH:-main}
MODE=${MODE:-pm2} # pm2 | docker

if [ -z "$VPS_HOST" ]; then
  echo "Error: define VPS_HOST (IP o dominio del VPS)" >&2
  exit 1
fi

echo "==> Deploy $BRANCH → $VPS_USER@$VPS_HOST:$APP_DIR (mode=$MODE)"

ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" \
  "APP_DIR='$APP_DIR' BRANCH='$BRANCH' MODE='$MODE' bash -s" <<'EOF'
set -euo pipefail
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

cd "$APP_DIR"
test -f package.json

git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

if [ "$MODE" = "docker" ]; then
  docker compose up -d --build
  for _ in $(seq 1 20); do
    if curl -fsS -m 3 "http://127.0.0.1:${HOST_PORT:-3000}/api/health" >/dev/null; then
      echo "deploy ok (docker): $(git rev-parse --short HEAD)"
      exit 0
    fi
    sleep 3
  done
  echo "health check failed (docker)" >&2
  exit 1
fi

npm ci
npm run build
npm prune --omit=dev

if pm2 describe sicr3p >/dev/null 2>&1; then
  pm2 restart sicr3p --update-env
else
  mkdir -p logs data
  pm2 start npm --name sicr3p -- start
  pm2 save
fi

PORT=$(grep -E '^PORT=' .env 2>/dev/null | cut -d= -f2 || true)
PORT=${PORT:-3000}
for _ in $(seq 1 20); do
  if curl -fsS -m 3 "http://127.0.0.1:$PORT/api/health" >/dev/null; then
    echo "deploy ok (pm2): $(git rev-parse --short HEAD)"
    exit 0
  fi
  sleep 3
done
echo "health check failed (pm2)" >&2
pm2 logs sicr3p --lines 40 --nostream || true
exit 1
EOF

echo "==> Listo en $VPS_HOST"
