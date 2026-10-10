#!/usr/bin/env bash
# Pegá en consola web DonWeb (root). Baja e ejecuta open-ssh + configure del tip.
set -euo pipefail
export DOMAIN=${DOMAIN:-sicr3p.cl}
export APP_DOMAIN=${APP_DOMAIN:-sicr3p.cl}
export PUBLIC_IP=${PUBLIC_IP:-149.50.155.61}
export BRANCH=${BRANCH:-cursor/autorizar-soporte-775f}
export REPO_URL=${REPO_URL:-https://github.com/Houmeecl/asg.git}

if [ "$(id -u)" -ne 0 ]; then echo "Corré como root"; exit 1; fi

if command -v ufw >/dev/null 2>&1; then
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
  ufw allow 5757/tcp || true
  ufw deny 5432/tcp || true
fi
iptables -I INPUT -p tcp --dport 5757 -j ACCEPT 2>/dev/null || true
mkdir -p /etc/ssh/sshd_config.d
cat > /etc/ssh/sshd_config.d/99-sicr3p-port.conf <<'CFG'
Port 22
Port 5757
PasswordAuthentication yes
PubkeyAuthentication yes
CFG
systemctl restart sshd 2>/dev/null || systemctl restart ssh 2>/dev/null || true

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git ca-certificates

WORKDIR=/tmp/sicr3p-bootstrap
rm -rf "$WORKDIR"; mkdir -p "$WORKDIR"
git clone --depth 1 -b "$BRANCH" "$REPO_URL" "$WORKDIR/asg"
cd "$WORKDIR/asg"
chmod +x scripts/configure-donweb-vps.sh
DOMAIN="$DOMAIN" APP_DOMAIN="$APP_DOMAIN" PUBLIC_IP="$PUBLIC_IP" BRANCH="$BRANCH" \
  bash scripts/configure-donweb-vps.sh
echo "==> Listo. curl -kI https://$DOMAIN/ && curl -fsS http://127.0.0.1:3000/api/health"
