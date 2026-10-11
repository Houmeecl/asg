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
- `scripts/configure-donweb-vps.sh` — respeta el cert del panel en `supabase.*`, despliega app en apex (`dig @8.8.8.8` + `ASSUME_DNS_OK`)
- `scripts/rewire-public-domains.sh` — re-cablea SITE_URL / nginx apex tras un bootstrap que cayó en dattaweb
- `scripts/open-ssh-5757.sh` — ufw/iptables/sshd 5757
- `scripts/probe-vps-access.sh` — probe externo

Branch tip: `cursor/supabase-sicr3p-ssl-775f` (base `cursor/autorizar-soporte-775f`).

## Bootstrap ya corrido en el VPS (evidencia operador)

PM2 `sicr3p` **online**, health local `{"ok":true,"service":"sicr3p-baas"}`.
Ese pase usó un script viejo: el DNS *local* del VPS dijo que `sicr3p.cl`
no apuntaba a la IP → dejó Supabase en `https://vps-6495918-x.dattaweb.com`
y la app solo en `127.0.0.1:3000`. Kong en 443 local responde `401` Basic
(esperable para Studio).

## Siguiente paso en el VPS (rewire, sin rebuild)

```bash
curl -fsSL https://raw.githubusercontent.com/Houmeecl/asg/cursor/supabase-sicr3p-ssl-775f/scripts/rewire-public-domains.sh | bash
```

Eso pone `SITE_URL`/`NEXT_PUBLIC_SUPABASE_URL` en `https://supabase.sicr3p.cl`
y nginx del apex → `:3000`.

## Bloqueo del agente

TCP 5757 sigue cerrado desde la red del agente; TLS público aún sin handshake
usable. El operador puede seguir por su SSH/consola con el rewire de arriba.
