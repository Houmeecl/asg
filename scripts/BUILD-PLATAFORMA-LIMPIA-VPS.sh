#!/usr/bin/env bash
# Plataforma limpia DIRECTO en el VPS — sin ciclo push/PR del agente.
# Pegá TODO este archivo en la consola web DonWeb (root) o en tu SSH.
#
# Qué hace:
#   1) Checkout limpio de main en /var/www/sicr3p
#   2) SITE_URL / NEXT_PUBLIC → https://supabase.sicr3p.cl
#   3) nginx apex → app :3000 (no pisa el SSL panel de supabase.*)
#   4) npm ci + build + pm2
#
# No abre 5432. No requiere que el agente tenga SSH.
set -euo pipefail

APP_DIR=${APP_DIR:-/var/www/sicr3p}
REPO_URL=${REPO_URL:-https://github.com/Houmeecl/asg.git}
# Plataforma limpia = main (no feature branches del agente)
BRANCH=${BRANCH:-main}
DOMAIN=${DOMAIN:-supabase.sicr3p.cl}
APP_DOMAIN=${APP_DOMAIN:-sicr3p.cl}
PUBLIC_IP=${PUBLIC_IP:-149.50.155.61}
APP_PORT=${APP_PORT:-3000}
ASSUME_DNS_OK=${ASSUME_DNS_OK:-1}

if [ "$(id -u)" -ne 0 ]; then
  echo "Corré como root en el VPS." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git ca-certificates build-essential python3 nginx dnsutils openssl

# ufw básico
if command -v ufw >/dev/null 2>&1; then
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
  ufw allow 5757/tcp || true
  ufw deny 5432/tcp || true
fi
mkdir -p /etc/ssh/sshd_config.d
printf 'Port 22\nPort 5757\nPasswordAuthentication yes\nPubkeyAuthentication yes\n' \
  > /etc/ssh/sshd_config.d/99-sicr3p-port.conf
systemctl reload sshd 2>/dev/null || systemctl restart ssh 2>/dev/null || true

resolve_a() {
  local name="$1" ip=""
  if command -v dig >/dev/null 2>&1; then
    ip="$(dig +short A "$name" @8.8.8.8 2>/dev/null | awk 'NR==1 && $1 ~ /^[0-9.]+$/ {print $1; exit}')"
  fi
  [ -z "$ip" ] && ip="$(getent ahostsv4 "$name" 2>/dev/null | awk '{print $1; exit}' || true)"
  printf '%s' "$ip"
}

sb_ip="$(resolve_a "$DOMAIN")"
app_ip="$(resolve_a "$APP_DOMAIN")"
echo "==> DNS público: $DOMAIN→${sb_ip:-?} $APP_DOMAIN→${app_ip:-?} (esperado $PUBLIC_IP)"
if [ "$ASSUME_DNS_OK" != "1" ] && [ "$sb_ip" != "$PUBLIC_IP" ]; then
  echo "DNS de $DOMAIN no apunta al VPS. Aborto." >&2
  exit 1
fi
public_url="https://$DOMAIN"

# nvm + Node 22
if [ ! -d "$HOME/.nvm" ]; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
fi
export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"
nvm install 22
nvm alias default 22

mkdir -p "$APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"
git remote set-url origin "$REPO_URL" || true
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"
mkdir -p data logs

# .env app
if [ ! -f .env ]; then
  cp .env.example .env
fi
set_kv() {
  local key="$1" value="$2" file="$3"
  if grep -q "^${key}=" "$file"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    echo "${key}=${value}" >> "$file"
  fi
}
set_kv NODE_ENV production .env
set_kv PORT "$APP_PORT" .env
set_kv HOSTNAME 0.0.0.0 .env
set_kv NEXT_PUBLIC_SUPABASE_URL "$public_url" .env
if ! grep -q '^SESSION_SECRET=.\+' .env; then
  set_kv SESSION_SECRET "$(openssl rand -hex 32)" .env
fi

# Supabase stack DonWeb
supabase_env=""
while IFS= read -r candidate; do
  if [ -f "$candidate" ] && grep -q 'ANON_KEY' "$candidate"; then
    supabase_env="$candidate"
    break
  fi
done < <(find /opt /root /home /srv /var -name '.env' -path '*supabase*' 2>/dev/null | head -20)

if [ -n "$supabase_env" ]; then
  echo "==> Supabase env: $supabase_env → $public_url"
  cp -a "$supabase_env" "${supabase_env}.bak.limpia.$(date +%Y%m%d%H%M%S)"
  set_kv SITE_URL "$public_url" "$supabase_env"
  set_kv API_EXTERNAL_URL "$public_url" "$supabase_env"
  set_kv SUPABASE_PUBLIC_URL "$public_url" "$supabase_env"
  anon_key="$(grep -E '^ANON_KEY=' "$supabase_env" | head -1 | cut -d= -f2- | tr -d '"')"
  if [ -n "$anon_key" ]; then
    set_kv NEXT_PUBLIC_SUPABASE_ANON_KEY "$anon_key" "$APP_DIR/.env"
  fi
  compose_dir="$(dirname "$supabase_env")"
  if [ -f "$compose_dir/docker-compose.yml" ] || [ -f "$compose_dir/docker-compose.yaml" ]; then
    (cd "$compose_dir" && docker compose up -d) || true
  fi
else
  echo "==> No encontré .env Supabase; Studio sigue en URL temporal del panel."
fi

echo "==> npm ci + build (main limpio)"
npm ci
npm run build
npm install -g pm2

cat > "$APP_DIR/ecosystem.config.cjs" <<EOF
module.exports = {
  apps: [{
    name: 'sicr3p',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -H 127.0.0.1 -p $APP_PORT',
    cwd: '$APP_DIR',
    instances: 1,
    exec_mode: 'fork',
    env: { NODE_ENV: 'production', PORT: '$APP_PORT', HOSTNAME: '127.0.0.1' },
    error_file: '$APP_DIR/logs/sicr3p-error.log',
    out_file: '$APP_DIR/logs/sicr3p-out.log',
  }],
};
EOF

if pm2 describe sicr3p >/dev/null 2>&1; then
  pm2 restart sicr3p --update-env
else
  pm2 start "$APP_DIR/ecosystem.config.cjs"
fi
pm2 save
pm2 startup systemd -u root --hp "$HOME" >/dev/null || true

# nginx: solo apex → app. No tocar vhost SSL de supabase.* del panel.
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
cat > /etc/nginx/sites-available/sicr3p.conf <<EOF
server {
  listen 80;
  listen [::]:80;
  server_name $APP_DOMAIN;
  location / {
    proxy_pass http://127.0.0.1:$APP_PORT;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
EOF
ln -sfn /etc/nginx/sites-available/sicr3p.conf /etc/nginx/sites-enabled/sicr3p.conf
nginx -t && systemctl reload nginx

if [ "$app_ip" = "$PUBLIC_IP" ] || [ "$ASSUME_DNS_OK" = "1" ]; then
  if ! echo | openssl s_client -connect 127.0.0.1:443 -servername "$APP_DOMAIN" 2>/dev/null \
    | openssl x509 -noout -subject 2>/dev/null | grep -qi "$APP_DOMAIN"; then
    apt-get install -y certbot python3-certbot-nginx || true
    certbot --nginx -d "$APP_DOMAIN" --non-interactive --agree-tos \
      --register-unsafely-without-email --keep-until-expiring || \
      echo "==> certbot $APP_DOMAIN pendiente (no reintentar en ráfaga)"
  fi
fi

echo
echo "==> Health:"
curl -fsS -m 5 "http://127.0.0.1:$APP_PORT/api/health" || true
echo
curl -sS -m 5 -D- -o /dev/null -H "Host: $APP_DOMAIN" "http://127.0.0.1/api/health" || true
echo
echo "==> PLATAFORMA LIMPIA lista"
echo "    Código: $APP_DIR @ origin/$BRANCH"
echo "    Supabase: $public_url"
echo "    App: https://$APP_DOMAIN"
echo "    Editar en el VPS: cd $APP_DIR && export NVM_DIR=\$HOME/.nvm && . \$NVM_DIR/nvm.sh"
echo "    Luego: npm run build && pm2 restart sicr3p"
echo "    (sin push al repo: trabajás y buildeás acá)"
