#!/usr/bin/env bash
# Re-cablea SITE_URL / nginx / .env tras un bootstrap que cayó en la URL
# temporal dattaweb porque el DNS local del VPS falló.
# Pegá en SSH/consola root (rápido, sin rebuild completo):
#   curl -fsSL https://raw.githubusercontent.com/Houmeecl/asg/cursor/configurar-vps-plan-775f/scripts/rewire-public-domains.sh | bash
set -euo pipefail

DOMAIN=${DOMAIN:-supabase.sicr3p.cl}
APP_DOMAIN=${APP_DOMAIN:-$DOMAIN}
PUBLIC_IP=${PUBLIC_IP:-149.50.155.61}
APP_DIR=${APP_DIR:-/var/www/sicr3p}
APP_PORT=${APP_PORT:-3000}
KONG_HTTP=${KONG_HTTP:-8000}
ASSUME_DNS_OK=${ASSUME_DNS_OK:-1}

if [ "$(id -u)" -ne 0 ]; then
  echo "Corré como root" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get install -y dnsutils curl nginx 2>/dev/null || true

resolve_a() {
  local name="$1" ip=""
  if command -v dig >/dev/null 2>&1; then
    ip="$(dig +short A "$name" @8.8.8.8 2>/dev/null | awk 'NR==1 && $1 ~ /^[0-9.]+$/ {print $1; exit}')"
  fi
  if [ -z "$ip" ]; then
    ip="$(getent ahostsv4 "$name" 2>/dev/null | awk '{print $1; exit}' || true)"
  fi
  printf '%s' "$ip"
}

sb_ip="$(resolve_a "$DOMAIN")"
app_ip="$(resolve_a "$APP_DOMAIN")"
echo "==> $DOMAIN → ${sb_ip:-?} | $APP_DOMAIN → ${app_ip:-?} (esperado $PUBLIC_IP)"

if [ "$ASSUME_DNS_OK" != "1" ] && [ "$sb_ip" != "$PUBLIC_IP" ]; then
  echo "DNS de $DOMAIN no apunta a $PUBLIC_IP. Aborto (o ASSUME_DNS_OK=1)." >&2
  exit 1
fi

public_url="https://$DOMAIN"

supabase_env=""
while IFS= read -r candidate; do
  if [ -f "$candidate" ] && grep -q 'ANON_KEY' "$candidate"; then
    supabase_env="$candidate"
    break
  fi
done < <(find /opt /root /home /srv /var -name '.env' -path '*supabase*' 2>/dev/null | head -20)

set_kv() {
  local key="$1" value="$2" file="$3"
  if grep -q "^${key}=" "$file"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    echo "${key}=${value}" >> "$file"
  fi
}

if [ -n "$supabase_env" ]; then
  echo "==> Supabase env: $supabase_env → $public_url"
  cp -a "$supabase_env" "${supabase_env}.bak.rewire.$(date +%Y%m%d%H%M%S)"
  set_kv SITE_URL "$public_url" "$supabase_env"
  set_kv API_EXTERNAL_URL "$public_url" "$supabase_env"
  set_kv SUPABASE_PUBLIC_URL "$public_url" "$supabase_env"
  compose_dir="$(dirname "$supabase_env")"
  if [ -f "$compose_dir/docker-compose.yml" ] || [ -f "$compose_dir/docker-compose.yaml" ]; then
    (cd "$compose_dir" && docker compose up -d) || true
  fi
else
  echo "==> No encontré .env de Supabase"
fi

if [ -f "$APP_DIR/.env" ]; then
  set_kv NEXT_PUBLIC_SUPABASE_URL "$public_url" "$APP_DIR/.env"
  echo "==> App .env NEXT_PUBLIC_SUPABASE_URL=$public_url"
fi

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

export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart sicr3p --update-env || true
fi

echo "==> Health local:"
curl -fsS -m 5 "http://127.0.0.1:$APP_PORT/api/health" || true
echo
echo "==> Proxy apex (Host $APP_DOMAIN):"
curl -sS -m 5 -D- -o /dev/null -H "Host: $APP_DOMAIN" "http://127.0.0.1/api/health" || true
echo
echo "==> TLS local supabase:"
echo | openssl s_client -connect 127.0.0.1:443 -servername "$DOMAIN" 2>/dev/null \
  | openssl x509 -noout -subject -dates 2>/dev/null || echo "(sin cert local para $DOMAIN)"
echo "==> Listo. Supabase=$public_url App=https://$APP_DOMAIN"
echo "==> Si afuera sigue 403/TLS muerto, abrí 5757 y revisá el firewall del panel (80/443 ya abiertos)."
