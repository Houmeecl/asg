#!/usr/bin/env bash
# Pegá en la consola web DonWeb (root) para abrir SSH 5757 desde DENTRO del VPS.
# El firewall del PANEL DonWeb también debe permitir TCP 5757.
set -euo pipefail
if [ "$(id -u)" -ne 0 ]; then echo "Corré como root"; exit 1; fi
if command -v ufw >/dev/null 2>&1; then
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
  ufw allow 5757/tcp || true
  ufw deny 5432/tcp || true
  ufw status || true
fi
if command -v iptables >/dev/null 2>&1; then
  iptables -C INPUT -p tcp --dport 5757 -j ACCEPT 2>/dev/null \
    || iptables -I INPUT -p tcp --dport 5757 -j ACCEPT || true
fi
mkdir -p /etc/ssh/sshd_config.d
cat > /etc/ssh/sshd_config.d/99-sicr3p-port.conf <<'CFG'
Port 22
Port 5757
PasswordAuthentication yes
PubkeyAuthentication yes
CFG
systemctl restart sshd 2>/dev/null || systemctl restart ssh 2>/dev/null || true
ss -ltnp | grep -E ':22|:5757' || netstat -ltnp 2>/dev/null | grep -E ':22|:5757' || true
echo "==> Dentro del VPS: SSH debería escuchar en 22 y 5757."
echo "==> Si desde Internet sigue cerrado, abrí TCP 5757 en Firewall del Cloud Server DonWeb."
