#!/usr/bin/env bash
# Pegá esto en TU sesión SSH (root@149.50.155.61) y dejalo correr.
# Cert SSL del panel: supabase.sicr3p.cl · app Next: sicr3p.cl
set -euo pipefail
export DOMAIN=supabase.sicr3p.cl APP_DOMAIN=sicr3p.cl PUBLIC_IP=149.50.155.61
export BRANCH=${BRANCH:-cursor/supabase-sicr3p-ssl-775f}
# El resolver local del VPS a veces no ve el A público; dig @8.8.8.8 + este flag.
export ASSUME_DNS_OK=${ASSUME_DNS_OK:-1}
export DEBIAN_FRONTEND=noninteractive

# Abrir SSH 5757 también hacia Internet (ufw) por si el panel ya lo permite
ufw allow 80/tcp || true
ufw allow 443/tcp || true
ufw allow 5757/tcp || true
ufw deny 5432/tcp || true
iptables -I INPUT -p tcp --dport 5757 -j ACCEPT 2>/dev/null || true
mkdir -p /etc/ssh/sshd_config.d
printf 'Port 22\nPort 5757\nPasswordAuthentication yes\nPubkeyAuthentication yes\n' > /etc/ssh/sshd_config.d/99-sicr3p-port.conf
systemctl restart sshd 2>/dev/null || systemctl restart ssh 2>/dev/null || true

apt-get update -y
apt-get install -y curl git ca-certificates
WORKDIR=/tmp/sicr3p-bootstrap
rm -rf "$WORKDIR" && mkdir -p "$WORKDIR"
git clone --depth 1 -b "$BRANCH" https://github.com/Houmeecl/asg.git "$WORKDIR/asg"
cd "$WORKDIR/asg"
chmod +x scripts/configure-donweb-vps.sh
DOMAIN="$DOMAIN" APP_DOMAIN="$APP_DOMAIN" PUBLIC_IP="$PUBLIC_IP" BRANCH="$BRANCH" \
  bash scripts/configure-donweb-vps.sh

echo "==> Verificación local"
curl -fsS -m 5 http://127.0.0.1:3000/api/health || true
echo
curl -kI -m 8 https://127.0.0.1/ -H "Host: supabase.sicr3p.cl" 2>/dev/null | head -15 || true
curl -kI -m 8 https://127.0.0.1/ -H "Host: sicr3p.cl" 2>/dev/null | head -15 || true
echo "==> Listo. Supabase: https://supabase.sicr3p.cl  App: https://sicr3p.cl"
echo "==> Avisá al agente o abrí 5757 en el firewall del panel para todo el Internet."
