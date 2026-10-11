#!/usr/bin/env bash
# Chequea DNS, firewall y TLS del Cloud Server desde fuera.
# No requiere SSH. Exit 0 solo si 80/443/5757 responden y el A apunta a la IP.
set -euo pipefail

DOMAIN=${DOMAIN:-sicr3p.cl}
SUPABASE_DOMAIN=${SUPABASE_DOMAIN:-supabase.sicr3p.cl}
PUBLIC_IP=${PUBLIC_IP:-149.50.155.61}
SSH_PORT=${SSH_PORT:-5757}

ok=1

resolved="$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk '{print $1; exit}' || true)"
echo "dns: $DOMAIN → ${resolved:-<vacío>} (esperado $PUBLIC_IP)"
if [ "$resolved" != "$PUBLIC_IP" ]; then
  ok=0
fi

sb_resolved="$(getent ahostsv4 "$SUPABASE_DOMAIN" 2>/dev/null | awk '{print $1; exit}' || true)"
echo "dns: $SUPABASE_DOMAIN → ${sb_resolved:-<vacío>} (esperado $PUBLIC_IP)"
if [ "$sb_resolved" != "$PUBLIC_IP" ]; then
  ok=0
fi

probe_tcp() {
  local port="$1"
  if timeout 3 bash -c "echo >/dev/tcp/${PUBLIC_IP}/${port}" 2>/dev/null; then
    echo "tcp:${port} OPEN"
    return 0
  fi
  echo "tcp:${port} CLOSED"
  return 1
}

probe_tcp 80 || ok=0
probe_tcp 443 || ok=0
probe_tcp "$SSH_PORT" || ok=0
probe_tcp 5432 && { echo "WARN: 5432 no debería estar abierto"; ok=0; } || echo "tcp:5432 CLOSED (ok)"

tls_ok=0
subj="$(echo | timeout 8 openssl s_client -connect "${PUBLIC_IP}:443" -servername "$SUPABASE_DOMAIN" 2>/dev/null \
  | openssl x509 -noout -subject 2>/dev/null || true)"
if [ -n "$subj" ] && echo "$subj" | grep -qi "$SUPABASE_DOMAIN"; then
  tls_ok=1
  echo "tls: $subj"
else
  echo "tls: sin certificado usable para $SUPABASE_DOMAIN desde esta red"
fi

app_subj="$(echo | timeout 8 openssl s_client -connect "${PUBLIC_IP}:443" -servername "$DOMAIN" 2>/dev/null \
  | openssl x509 -noout -subject 2>/dev/null || true)"
if [ -n "$app_subj" ]; then
  echo "tls-app: $app_subj"
else
  echo "tls-app: sin certificado usable para $DOMAIN desde esta red"
fi

if [ "$ok" -eq 1 ]; then
  echo "READY: firewall+dns ok. Corré en el VPS: DOMAIN=$SUPABASE_DOMAIN APP_DOMAIN=$DOMAIN bash scripts/configure-donweb-vps.sh"
  [ "$tls_ok" -eq 1 ] || echo "NOTE: SSL de $SUPABASE_DOMAIN todavía no responde desde fuera (panel o nginx)."
  exit 0
fi

echo "BLOCKED: abrí TCP 80, 443 y $SSH_PORT en Firewall del Cloud Server $PUBLIC_IP"
echo "Panel: https://micuenta.donweb.com/es-cl/servicios/cloud-iaas/vps/6495918/configurar/informacion"
exit 1
