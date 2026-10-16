#!/usr/bin/env bash
# TODO FUNCIONA: landing + Supabase URL + correo (poste.io) en el VPS.
# Pegá en consola web DonWeb (root) — no necesita SSH desde afuera:
#
#   curl -fsSL https://raw.githubusercontent.com/Houmeecl/asg/cursor/configurar-vps-plan-775f/scripts/TODO-FUNCION-VPS.sh | bash
#
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
export DOMAIN=${DOMAIN:-supabase.sicr3p.cl}
export APP_DOMAIN=${APP_DOMAIN:-sicr3p.cl}
export MAIL_DOMAIN=${MAIL_DOMAIN:-mail.sicr3p.cl}
export PUBLIC_IP=${PUBLIC_IP:-149.50.155.61}
export ASSUME_DNS_OK=${ASSUME_DNS_OK:-1}
export BRANCH=${BRANCH:-main}

if [ "$(id -u)" -ne 0 ]; then echo "Corré como root"; exit 1; fi

echo "==> 1/4 Firewall local (panel DonWeb también debe permitir estos TCP)"
if command -v ufw >/dev/null 2>&1; then
  for p in 80 443 5757 25 465 587 993; do ufw allow "${p}/tcp" || true; done
  ufw deny 5432/tcp || true
fi
for p in 80 443 5757 25 465 587 993; do
  iptables -C INPUT -p tcp --dport "$p" -j ACCEPT 2>/dev/null \
    || iptables -I INPUT -p tcp --dport "$p" -j ACCEPT || true
done
mkdir -p /etc/ssh/sshd_config.d
printf 'Port 22\nPort 5757\nPasswordAuthentication yes\nPubkeyAuthentication yes\n' \
  > /etc/ssh/sshd_config.d/99-sicr3p-port.conf
systemctl reload sshd 2>/dev/null || systemctl restart ssh 2>/dev/null || true

echo "==> 2/4 App Next + nginx (landing en $APP_DOMAIN)"
curl -fsSL "https://raw.githubusercontent.com/Houmeecl/asg/cursor/configurar-vps-plan-775f/scripts/BUILD-PLATAFORMA-LIMPIA-VPS.sh" \
  | env DOMAIN="$DOMAIN" APP_DOMAIN="$APP_DOMAIN" PUBLIC_IP="$PUBLIC_IP" \
      ASSUME_DNS_OK="$ASSUME_DNS_OK" BRANCH="$BRANCH" bash

echo "==> 3/4 Correo poste.io en $MAIL_DOMAIN"
curl -fsSL "https://raw.githubusercontent.com/Houmeecl/asg/cursor/configurar-vps-plan-775f/scripts/install-posteio.sh" \
  | env MAIL_DOMAIN="$MAIL_DOMAIN" PUBLIC_IP="$PUBLIC_IP" bash

echo "==> 4/4 Verificación local"
curl -fsS -m 5 http://127.0.0.1:3000/api/health || true
echo
curl -sS -m 5 -D- -o /dev/null -H "Host: $APP_DOMAIN" http://127.0.0.1/api/health || true
echo
curl -sS -m 5 -D- -o /dev/null -H "Host: $MAIL_DOMAIN" http://127.0.0.1/ || true
echo
ss -ltnp 2>/dev/null | grep -E ':25|:465|:587|:993|:3000|:80|:443' || true
docker ps --filter name=mailserver --format '{{.Names}} {{.Status}}' || true

cat <<EOF

==> LISTO EN EL VPS
  Landing:  https://$APP_DOMAIN
  Supabase: https://$DOMAIN
  Webmail:  https://$MAIL_DOMAIN  (creá admin + edward@sicr3p.cl en la UI)

DNS que debe existir en DonWeb (si falta, el sitio/mail no entran desde Internet):
  A  sicr3p.cl            -> $PUBLIC_IP
  A  supabase.sicr3p.cl   -> $PUBLIC_IP
  A  mail.sicr3p.cl       -> $PUBLIC_IP
  MX sicr3p.cl            -> mail.sicr3p.cl
  TXT sicr3p.cl           -> v=spf1 ip4:$PUBLIC_IP -all

Firewall PANEL (origen cualquier IP / 0.0.0.0/0):
  TCP 80, 443, 5757, 25, 465, 587, 993
  NO 5432
EOF
