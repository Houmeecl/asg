# Estado VPS sicr3p (Cloud Agent)

| Chequeo | Estado |
|---------|--------|
| A `sicr3p.cl` → `149.50.155.61` | OK |
| TCP 80 / 443 | OK |
| TCP 5757 (SSH DonWeb) desde agente | Cerrado (allowlist / panel) |
| TLS `https://sicr3p.cl` desde agente | Sin certificado usable |
| Studio temporal `vps-6495918-x.dattaweb.com` | URL conocida; TLS a veces falla desde agente |
| Postgres `5432` público | Cerrado (correcto) |

## Scripts listos en el repo

- `scripts/RUN-EN-TU-SSH.sh` — pegar en SSH local del operador
- `scripts/PASTE-EN-CONSOLA-DONWEB.sh` — pegar en consola web
- `scripts/configure-donweb-vps.sh` — SSL + Supabase URL + app Next
- `scripts/open-ssh-5757.sh` — ufw/iptables/sshd 5757
- `scripts/probe-vps-access.sh` — probe externo

Branch tip recomendado: `cursor/autorizar-soporte-775f`.

## Bloqueo actual

Sin TCP 5757 abierto a Internet ni sesión DonWeb en el agente, SSL/Supabase/app en el VPS solo se completan desde la SSH/consola del operador con los scripts de arriba.

El operador omitió la acción externa de abrir 5757 / pegar configure desde su dispositivo. El Cloud Agent deja scripts y docs listos; no reintenta el acceso remoto hasta nueva instrucción.
