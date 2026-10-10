#!/usr/bin/env bash
# Setup inicial EN el VPS (una vez). Clona asg, Node 22, PM2, Nginx opcional.
# Uso: ./scripts/setup-vps.sh
set -euo pipefail

APP_DIR=${APP_DIR:-/var/www/sicr3p}
REPO_URL=${REPO_URL:-https://github.com/Houmeecl/asg.git}
BRANCH=${BRANCH:-main}

echo "==> Setup VPS SICR3P → $APP_DIR"

sudo apt-get update -y
sudo apt-get install -y curl git build-essential python3 nginx

if [ ! -d "$HOME/.nvm" ]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi
export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"
nvm install 22
nvm alias default 22

sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER:$USER" "$APP_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
  git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
mkdir -p data logs

if [ ! -f .env ]; then
  cp .env.example .env
  echo "NODE_ENV=production" >> .env
  echo "PORT=3000" >> .env
  echo "HOSTNAME=0.0.0.0" >> .env
  echo "SESSION_SECRET=$(openssl rand -hex 32)" >> .env
  echo "-> Edita $APP_DIR/.env (DLOCAL_*, HUBSPOT_*, teléfono real)"
fi

npm ci
npm run build
npm prune --omit=dev
npm install -g pm2

cat > ecosystem.config.cjs <<EOF
module.exports = {
  apps: [{
    name: 'sicr3p',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -H 0.0.0.0 -p 3000',
    cwd: '$APP_DIR',
    instances: 1,
    exec_mode: 'fork',
    env: { NODE_ENV: 'production' },
    error_file: '$APP_DIR/logs/sicr3p-error.log',
    out_file: '$APP_DIR/logs/sicr3p-out.log',
  }],
};
EOF

pm2 start ecosystem.config.cjs
pm2 save
echo "==> Ejecuta: pm2 startup   (y el comando que imprima)"
echo "==> Health: curl -sS http://127.0.0.1:3000/api/health"
