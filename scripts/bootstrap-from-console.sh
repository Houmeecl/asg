#!/usr/bin/env bash
# Pegá este archivo completo en la consola web de DonWeb (root) si el SSH
# entrante (5757) todavía no responde desde Internet.
# Alternativa de una línea (repo público o con token):
#   curl -fsSL https://raw.githubusercontent.com/Houmeecl/asg/cursor/vps-console-bootstrap-775f/scripts/bootstrap-from-console.sh | bash
set -euo pipefail

export DOMAIN=${DOMAIN:-sicr3p.cl}
export APP_DOMAIN=${APP_DOMAIN:-sicr3p.cl}
export PUBLIC_IP=${PUBLIC_IP:-149.50.155.61}
export BRANCH=${BRANCH:-cursor/autorizar-soporte-775f}
export REPO_URL=${REPO_URL:-https://github.com/Houmeecl/asg.git}

if [ "$(id -u)" -ne 0 ]; then
  echo "Correr como root en la consola del Cloud Server." >&2
  exit 1
fi

# Abrir SSH local por si el firewall del panel ya permite 5757 pero ufw lo tapa.
if command -v ufw >/dev/null 2>&1; then
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
  ufw allow 5757/tcp || true
  ufw deny 5432/tcp || true
fi
if command -v iptables >/dev/null 2>&1; then
  iptables -C INPUT -p tcp --dport 5757 -j ACCEPT 2>/dev/null \
    || iptables -I INPUT -p tcp --dport 5757 -j ACCEPT || true
fi

# Asegurar sshd en 5757 (DonWeb) además de 22.
mkdir -p /etc/ssh/sshd_config.d
cat > /etc/ssh/sshd_config.d/99-sicr3p-port.conf <<'EOF'
Port 22
Port 5757
PasswordAuthentication yes
PubkeyAuthentication yes
EOF
systemctl restart sshd 2>/dev/null || systemctl restart ssh 2>/dev/null || true

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git ca-certificates

WORKDIR=/tmp/sicr3p-bootstrap
rm -rf "$WORKDIR"
mkdir -p "$WORKDIR"
if git clone --depth 1 -b "$BRANCH" "$REPO_URL" "$WORKDIR/asg"; then
  cd "$WORKDIR/asg"
else
  echo "No pude clonar $REPO_URL ($BRANCH). Si el repo es privado, exportá REPO_URL con token." >&2
  exit 1
fi

chmod +x scripts/configure-donweb-vps.sh
DOMAIN="$DOMAIN" APP_DOMAIN="$APP_DOMAIN" PUBLIC_IP="$PUBLIC_IP" BRANCH="$BRANCH" \
  bash scripts/configure-donweb-vps.sh

echo "==> Bootstrap terminado. Probá: curl -fsS http://127.0.0.1:3000/api/health && curl -kI https://$DOMAIN/"
