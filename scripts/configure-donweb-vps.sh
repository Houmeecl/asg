#!/usr/bin/env bash
# Configura el Cloud Server de DonWeb para sicr3p.
# Se ejecuta DENTRO del VPS, como root, cuando el SSH ya responde.
#
#   DOMAIN=supabase.sicr3p.cl APP_DOMAIN=sicr3p.cl bash scripts/configure-donweb-vps.sh
#
# Por defecto: Supabase SSL en supabase.sicr3p.cl (cert del panel DonWeb)
# y la app Next en sicr3p.cl. Si APP_DOMAIN=DOMAIN, app + Kong comparten un host.
#
# No abre el puerto 5432. Postgres de Supabase queda en 127.0.0.1.
# No insiste con Let's Encrypt si el DNS todavía no apunta a este servidor.
# No pisa el vhost SSL que DonWeb ya creó para DOMAIN (supabase.*).
set -euo pipefail

DOMAIN=${DOMAIN:-supabase.sicr3p.cl}
APP_DOMAIN=${APP_DOMAIN:-sicr3p.cl}
PUBLIC_IP=${PUBLIC_IP:-149.50.155.61}
APP_DIR=${APP_DIR:-/var/www/sicr3p}
REPO_URL=${REPO_URL:-https://github.com/Houmeecl/asg.git}
BRANCH=${BRANCH:-cursor/supabase-sicr3p-ssl-775f}
APP_PORT=${APP_PORT:-3000}
# Puerto interno de Kong/Studio del stack DonWeb (solo localhost).
KONG_HTTP=${KONG_HTTP:-8000}

if [ "$(id -u)" -ne 0 ]; then
  echo "Ejecuta este script como root en el VPS." >&2
  exit 1
fi

# Resolver DNS con DNS públicos: el resolver local del VPS a veces miente
# (getent vacío/errado) aunque el A público ya apunta al Cloud Server.
resolve_a() {
  local name="$1" ip=""
  if command -v dig >/dev/null 2>&1; then
    ip="$(dig +short A "$name" @8.8.8.8 2>/dev/null | awk 'NR==1 && $1 ~ /^[0-9.]+$/ {print $1; exit}')"
    [ -z "$ip" ] && ip="$(dig +short A "$name" @1.1.1.1 2>/dev/null | awk 'NR==1 && $1 ~ /^[0-9.]+$/ {print $1; exit}')"
  fi
  if [ -z "$ip" ] && command -v host >/dev/null 2>&1; then
    ip="$(host -t A "$name" 8.8.8.8 2>/dev/null | awk '/has address/ {print $4; exit}')"
  fi
  if [ -z "$ip" ]; then
    ip="$(getent ahostsv4 "$name" 2>/dev/null | awk '{print $1; exit}' || true)"
  fi
  printf '%s' "$ip"
}

resolved="$(resolve_a "$DOMAIN")"
echo "==> $DOMAIN resuelve a '${resolved:-<vacío>}' (esperado $PUBLIC_IP)"
dns_ok=0
if [ "$resolved" = "$PUBLIC_IP" ] || [ "${ASSUME_DNS_OK:-0}" = "1" ]; then
  dns_ok=1
  [ "$resolved" != "$PUBLIC_IP" ] && echo "==> ASSUME_DNS_OK=1: fuerzo URL pública aunque dig local no coincida."
else
  echo "El dominio todavía no apunta a este Cloud Server (dig @8.8.8.8). Sigo con la app en local."
fi

app_resolved="$(resolve_a "$APP_DOMAIN")"
echo "==> $APP_DOMAIN resuelve a '${app_resolved:-<vacío>}' (esperado $PUBLIC_IP)"
app_dns_ok=0
if [ "$app_resolved" = "$PUBLIC_IP" ] || [ "${ASSUME_DNS_OK:-0}" = "1" ]; then
  app_dns_ok=1
fi

# Abrir puertos locales (el firewall del panel DonWeb también debe permitir 5757).
if command -v ufw >/dev/null 2>&1; then
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
  ufw allow 5757/tcp || true
  ufw deny 5432/tcp || true
  if ufw status 2>/dev/null | grep -q 'Status: active'; then
    echo "==> ufw: 80, 443 y 5757 abiertos; 5432 cerrado"
  else
    echo "==> ufw: reglas agregadas (ufw no activo aún)"
  fi
fi
if command -v iptables >/dev/null 2>&1; then
  iptables -C INPUT -p tcp --dport 5757 -j ACCEPT 2>/dev/null \
    || iptables -I INPUT -p tcp --dport 5757 -j ACCEPT || true
fi
# sshd en 5757 (DonWeb) + 22
mkdir -p /etc/ssh/sshd_config.d
cat > /etc/ssh/sshd_config.d/99-sicr3p-port.conf <<'EOF'
Port 22
Port 5757
PasswordAuthentication yes
PubkeyAuthentication yes
EOF
systemctl reload sshd 2>/dev/null || systemctl reload ssh 2>/dev/null \
  || systemctl restart sshd 2>/dev/null || systemctl restart ssh 2>/dev/null || true


# Busca el .env del stack Supabase que instaló DonWeb.
supabase_env=""
while IFS= read -r candidate; do
  if [ -f "$candidate" ] && grep -q 'ANON_KEY' "$candidate"; then
    supabase_env="$candidate"
    break
  fi
done < <(find /opt /root /home /srv /var -name '.env' -path '*supabase*' 2>/dev/null | head -20)

if [ -z "$supabase_env" ]; then
  while IFS= read -r candidate; do
    if grep -q 'ANON_KEY' "$candidate" 2>/dev/null && grep -q 'SERVICE_ROLE_KEY\|JWT_SECRET' "$candidate" 2>/dev/null; then
      supabase_env="$candidate"
      break
    fi
  done < <(find /opt /root /home /srv -name '.env' 2>/dev/null | head -40)
fi

if [ "$dns_ok" -eq 1 ]; then
  public_url="https://$DOMAIN"
else
  public_url="https://vps-6495918-x.dattaweb.com"
fi
if [ -n "$supabase_env" ] && [ "$dns_ok" -eq 1 ]; then
  echo "==> Supabase env: $supabase_env"
  cp -a "$supabase_env" "${supabase_env}.bak.$(date +%Y%m%d%H%M%S)"
  set_kv() {
    local key="$1" value="$2" file="$3"
    if grep -q "^${key}=" "$file"; then
      sed -i "s|^${key}=.*|${key}=${value}|" "$file"
    else
      echo "${key}=${value}" >> "$file"
    fi
  }
  set_kv SITE_URL "$public_url" "$supabase_env"
  set_kv API_EXTERNAL_URL "$public_url" "$supabase_env"
  set_kv SUPABASE_PUBLIC_URL "$public_url" "$supabase_env"
  compose_dir="$(dirname "$supabase_env")"
  if [ -f "$compose_dir/docker-compose.yml" ] || [ -f "$compose_dir/docker-compose.yaml" ]; then
    (cd "$compose_dir" && docker compose up -d)
    echo "==> Compose de Supabase reiniciado"
  fi
elif [ -z "$supabase_env" ]; then
  echo "==> No encontré el .env de Supabase. El Studio sigue en la URL temporal."
else
  echo "==> Supabase encontrado en $supabase_env. La URL pública se cambia cuando $DOMAIN apunte a $PUBLIC_IP."
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git build-essential python3 nginx certbot python3-certbot-nginx

# Si DonWeb ya emitió el certificado vía panel (supabase.sicr3p.cl), no pedimos otro.
donweb_ssl=0
if [ "$dns_ok" -eq 1 ]; then
  if echo | openssl s_client -connect "127.0.0.1:443" -servername "$DOMAIN" 2>/dev/null \
    | openssl x509 -noout -subject 2>/dev/null | grep -qi "$DOMAIN"; then
    donweb_ssl=1
    echo "==> Certificado ya presente para $DOMAIN (panel DonWeb o certbot previo)."
  elif [ -d "/etc/letsencrypt/live/$DOMAIN" ] \
    || ls /etc/nginx/sites-enabled/*"$DOMAIN"* >/dev/null 2>&1 \
    || grep -Rql "server_name[[:space:]].*$DOMAIN" /etc/nginx 2>/dev/null; then
    donweb_ssl=1
    echo "==> SSL/vhost de $DOMAIN detectado en disco (panel DonWeb). No corro certbot sobre ese host."
  fi
fi

# Solo certbot sobre DOMAIN si NO hay cert del panel y APP comparte el mismo host.
# Con DOMAIN=supabase.* el panel ya gestiona ese certificado: no reintentar LE.
if [ "$dns_ok" -eq 1 ] && [ "$donweb_ssl" -eq 0 ] && [ "$APP_DOMAIN" = "$DOMAIN" ]; then
  if ! certbot certificates 2>/dev/null | grep -q "$DOMAIN"; then
    # Un solo intento. Let's Encrypt bloquea una semana si se insiste.
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --keep-until-expiring || {
      echo "certbot no emitió el certificado. Revisa que el puerto 80 llegue a este servidor y no reintentes en ráfaga." >&2
    }
  fi
elif [ "$APP_DOMAIN" != "$DOMAIN" ]; then
  echo "==> Supabase queda en https://$DOMAIN (cert panel). App en https://$APP_DOMAIN."
fi

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
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"
mkdir -p data logs

anon_key=""
if [ -n "$supabase_env" ]; then
  anon_key="$(grep -E '^ANON_KEY=' "$supabase_env" | head -1 | cut -d= -f2- | tr -d '"')"
fi

if [ ! -f .env ]; then
  cp .env.example .env
fi
set_app() {
  local key="$1" value="$2"
  if grep -q "^${key}=" .env; then
    sed -i "s|^${key}=.*|${key}=${value}|" .env
  else
    echo "${key}=${value}" >> .env
  fi
}
set_app NODE_ENV production
set_app PORT "$APP_PORT"
set_app HOSTNAME 0.0.0.0
set_app NEXT_PUBLIC_SUPABASE_URL "$public_url"
if [ -n "$anon_key" ]; then
  set_app NEXT_PUBLIC_SUPABASE_ANON_KEY "$anon_key"
fi
if ! grep -q '^SESSION_SECRET=.\+' .env; then
  set_app SESSION_SECRET "$(openssl rand -hex 32)"
fi

npm ci
npm run build
npm install -g pm2

cat > ecosystem.config.cjs <<EOF
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
  pm2 start ecosystem.config.cjs
fi
pm2 save
pm2 startup systemd -u root --hp "$HOME" >/dev/null || true

kong_up=0
if curl -fsS -m 2 "http://127.0.0.1:${KONG_HTTP}/auth/v1/health" >/dev/null 2>&1 \
  || curl -fsS -m 2 "http://127.0.0.1:${KONG_HTTP}/" >/dev/null 2>&1; then
  kong_up=1
fi

write_nginx_app() {
  local server_name="$1"
  local with_kong="$2"
  local kong_block=""
  if [ "$with_kong" = "1" ]; then
    kong_block=$(cat <<KONG
  # Supabase (Kong) — mismos paths públicos del self-host.
  location ~ ^/(rest|auth|storage|realtime|functions|graphql|pg)/ {
    proxy_pass http://127.0.0.1:${KONG_HTTP};
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
  }
  location ^~ /project/ {
    proxy_pass http://127.0.0.1:${KONG_HTTP};
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
  }
KONG
)
  fi
  # Evitar que el default de DonWeb/Kong (401/403) capture el apex.
  rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
  cat > /etc/nginx/sites-available/sicr3p.conf <<EOF
server {
  listen 80;
  listen [::]:80;
  server_name $server_name;
$kong_block
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
}

if [ "$APP_DOMAIN" = "$DOMAIN" ] && [ "$dns_ok" -eq 1 ]; then
  # Un solo hostname: app en / y Supabase vía Kong en sus paths.
  write_nginx_app "$DOMAIN" "$kong_up"
  if [ "$donweb_ssl" -eq 0 ]; then
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --keep-until-expiring || {
      echo "certbot no emitió el certificado de $DOMAIN. No reintentar en ráfaga." >&2
    }
  fi
  echo "==> App + Supabase en https://$DOMAIN (Kong local: $kong_up)"
elif [ "$APP_DOMAIN" != "$DOMAIN" ] && [ "$app_dns_ok" -eq 1 ]; then
  # No tocar el vhost SSL de DOMAIN (supabase.*) que emitió el panel.
  write_nginx_app "$APP_DOMAIN" "0"
  app_ssl=0
  if echo | openssl s_client -connect "127.0.0.1:443" -servername "$APP_DOMAIN" 2>/dev/null \
    | openssl x509 -noout -subject 2>/dev/null | grep -qi "$APP_DOMAIN"; then
    app_ssl=1
    echo "==> Certificado ya presente para $APP_DOMAIN."
  fi
  if [ "$app_ssl" -eq 0 ]; then
    certbot --nginx -d "$APP_DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --keep-until-expiring || {
      echo "certbot no emitió el certificado de $APP_DOMAIN. No reintentar en ráfaga." >&2
    }
  fi
  echo "==> App publicada en https://$APP_DOMAIN (Supabase en https://$DOMAIN; Kong local: $kong_up)"
else
  echo "==> $APP_DOMAIN no apunta a $PUBLIC_IP (dig público). La app queda en 127.0.0.1:$APP_PORT"
  echo "    Reintentá con: ASSUME_DNS_OK=1 DOMAIN=$DOMAIN APP_DOMAIN=$APP_DOMAIN bash scripts/configure-donweb-vps.sh"
fi

# Asegurar NEXT_PUBLIC_SUPABASE_URL aunque el primer pase haya usado dattaweb.
if [ -f "$APP_DIR/.env" ] && [ "$dns_ok" -eq 1 ]; then
  set_app() {
    local key="$1" value="$2"
    if grep -q "^${key}=" "$APP_DIR/.env"; then
      sed -i "s|^${key}=.*|${key}=${value}|" "$APP_DIR/.env"
    else
      echo "${key}=${value}" >> "$APP_DIR/.env"
    fi
  }
  set_app NEXT_PUBLIC_SUPABASE_URL "$public_url"
  export NVM_DIR="$HOME/.nvm"
  # shellcheck disable=SC1091
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  if command -v pm2 >/dev/null 2>&1; then
    pm2 restart sicr3p --update-env || true
  fi
fi

curl -fsS -m 5 "http://127.0.0.1:$APP_PORT/api/health"
echo
echo "==> Listo. Supabase: $public_url  App local: http://127.0.0.1:$APP_PORT/api/health"
echo "==> Verificá /ops/config en https://$APP_DOMAIN cuando el proxy esté arriba."
echo "==> npm vía nvm:  export NVM_DIR=\$HOME/.nvm; . \$NVM_DIR/nvm.sh"
