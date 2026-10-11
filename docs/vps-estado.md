# Estado VPS sicr3p (Cloud Agent)

| Chequeo | Estado |
|---------|--------|
| A `sicr3p.cl` → `149.50.155.61` | OK |
| A `supabase.sicr3p.cl` → `149.50.155.61` | OK |
| TCP 80 / 443 | Abiertos (HTTP responde `403 Forbidden` desde el agente) |
| TCP 5757 (SSH DonWeb) desde agente | Cerrado (allowlist / panel) |
| TLS `https://supabase.sicr3p.cl` desde agente | Handshake cae (sin peer cert visible desde esta red) |
| TLS `https://sicr3p.cl` desde agente | Igual: sin handshake usable |
| Studio temporal `vps-6495918-x.dattaweb.com` | URL conocida; TLS a veces falla desde agente |
| Postgres `5432` público | Cerrado (correcto) |

## Dominios

- **Supabase / SSL panel:** `https://supabase.sicr3p.cl` (certificado emitido en el panel DonWeb)
- **App Next:** `https://sicr3p.cl` (cert propio vía certbot cuando corra configure)

## Scripts listos en el repo

- `scripts/RUN-EN-TU-SSH.sh` — pegar en SSH local del operador (`DOMAIN=supabase.sicr3p.cl`)
- `scripts/PASTE-EN-CONSOLA-DONWEB.sh` — pegar en consola web
- `scripts/configure-donweb-vps.sh` — respeta el cert del panel en `supabase.*`, despliega app en apex
- `scripts/open-ssh-5757.sh` — ufw/iptables/sshd 5757
- `scripts/probe-vps-access.sh` — probe externo

Branch tip: `cursor/supabase-sicr3p-ssl-775f` (base `cursor/autorizar-soporte-775f`).

## Bloqueo actual

Sin TCP 5757 abierto a Internet, el agente no puede entrar al VPS. El panel ya tiene el dominio SSL en `supabase.sicr3p.cl`; falta que configure corra dentro del VPS (SSH/consola) para cablear `SITE_URL` / app y dejar HTTPS respondiendo desde fuera.
