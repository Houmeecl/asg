#!/usr/bin/env bash
# Instala poste.io (edición gratis) en el VPS sin pelearse por 80/443
# con nginx/Supabase: HTTP interno en 127.0.0.1:8080 + vhost mail.*.
#
#   curl -fsSL https://raw.githubusercontent.com/Houmeecl/asg/cursor/supabase-sicr3p-ssl-775f/scripts/install-posteio.sh | bash
#
# Requisitos: Docker, DNS A mail.sicr3p.cl → este server (para cert/webmail),
# firewall panel con 25/465/587/993. No es software libre (FOSS → Mailu).
set -euo pipefail

MAIL_DOMAIN=${MAIL_DOMAIN:-mail.sicr3p.cl}
PUBLIC_IP=${PUBLIC_IP:-149.50.155.61}
POSTE_DIR=${POSTE_DIR:-/opt/poste.io}
POSTE_HTTP=${POSTE_HTTP:-8080}
DISABLE_CLAMAV=${DISABLE_CLAMAV:-TRUE}

if [ "$(id -u)" -ne 0 ]; then
  echo "Corré como root" >&2
  exit 1
fi

echo "==> Memoria libre (Supabase+Next ya corren; poste.io suma ~1–2GB):"
free -h || true
df -h / | tail -1 || true

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl ca-certificates dnsutils nginx

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

mkdir -p "$POSTE_DIR/data"

# Firewall local
if command -v ufw >/dev/null 2>&1; then
  for p in 25 465 587 993; do ufw allow "${p}/tcp" || true; done
fi
if command -v iptables >/dev/null 2>&1; then
  for p in 25 465 587 993; do
    iptables -C INPUT -p tcp --dport "$p" -j ACCEPT 2>/dev/null \
      || iptables -I INPUT -p tcp --dport "$p" -j ACCEPT || true
  done
fi

resolved="$(dig +short A "$MAIL_DOMAIN" @8.8.8.8 2>/dev/null | awk 'NR==1 && $1 ~ /^[0-9.]+$/ {print $1; exit}')"
echo "==> $MAIL_DOMAIN → ${resolved:-?} (esperado $PUBLIC_IP para webmail/LE)"

# Bridge + HTTP solo en loopback: no pisa 80/443 de nginx/Supabase.
docker rm -f mailserver 2>/dev/null || true
docker run -d \
  --name mailserver \
  --restart always \
  -p 25:25 \
  -p 110:110 \
  -p 143:143 \
  -p 465:465 \
  -p 587:587 \
  -p 993:993 \
  -p 995:995 \
  -p "127.0.0.1:${POSTE_HTTP}:80" \
  -e "HTTPS=OFF" \
  -e "DISABLE_CLAMAV=${DISABLE_CLAMAV}" \
  -v "${POSTE_DIR}/data:/data" \
  analogic/poste.io

# Nginx: webmail/admin en mail.sicr3p.cl (HTTP; certbot si DNS ok)
cat > /etc/nginx/sites-available/mail-poste.conf <<EOF
server {
  listen 80;
  listen [::]:80;
  server_name ${MAIL_DOMAIN};

  client_max_body_size 50m;

  location / {
    proxy_pass http://127.0.0.1:${POSTE_HTTP};
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
EOF
ln -sfn /etc/nginx/sites-available/mail-poste.conf /etc/nginx/sites-enabled/mail-poste.conf
nginx -t && systemctl reload nginx

if [ "$resolved" = "$PUBLIC_IP" ]; then
  if command -v certbot >/dev/null 2>&1; then
    certbot --nginx -d "$MAIL_DOMAIN" --non-interactive --agree-tos \
      --register-unsafely-without-email --keep-until-expiring || {
      echo "==> certbot mail: falló (no reintentar en ráfaga). Webmail queda en HTTP hasta arreglar DNS/80."
    }
  fi
else
  echo "==> Apuntá A $MAIL_DOMAIN → $PUBLIC_IP y después: certbot --nginx -d $MAIL_DOMAIN"
fi

echo
echo "==> poste.io arriba (contenedor mailserver)."
echo "    Admin/webmail: http://${MAIL_DOMAIN}/  (o https si certbot OK)"
echo "    Datos: ${POSTE_DIR}/data"
echo "    SMTP 25/465/587 · IMAPS 993"
echo
echo "Siguiente:"
echo "  1) Abrí 25/465/587/993 en Firewall del Cloud Server DonWeb"
echo "  2) Cambiá A mail.sicr3p.cl → ${PUBLIC_IP} y MX/SPF/DKIM (docs/correo-selfhost.md)"
echo "  3) Pedí PTR ${PUBLIC_IP} → ${MAIL_DOMAIN} a DonWeb"
echo "  4) Creá admin + dominio sicr3p.cl en la UI"
echo
echo "FOSS alternativo: Mailu — ver docs/correo-selfhost.md"
docker ps --filter name=mailserver --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
