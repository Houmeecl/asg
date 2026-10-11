# Estado VPS sicr3p (plan configurar_vps)

| Chequeo | Estado |
|---------|--------|
| A `sicr3p.cl` → `149.50.155.61` | OK (vía resolvers públicos) |
| A `supabase.sicr3p.cl` → `149.50.155.61` | OK |
| TCP 80 / 443 | Abiertos (HTTP a veces `403` desde el agente) |
| TCP 5757 (SSH) desde agente | Cerrado — abrir en Firewall DonWeb a Internet |
| TCP 5432 público | Cerrado (correcto) |
| TLS `https://supabase.sicr3p.cl` | Handshake aún no usable desde la red del agente |
| Studio temporal | `https://vps-6495918-x.dattaweb.com` |

## Plan: un solo hostname

App + Supabase en `https://supabase.sicr3p.cl` (cert del panel DonWeb).
Postgres solo `127.0.0.1:5432`. Sin migrar SQLite en este paso.

## Aplicar dentro del VPS (consola o SSH)

```bash
curl -fsSL https://raw.githubusercontent.com/Houmeecl/asg/cursor/configurar-vps-plan-775f/scripts/BUILD-PLATAFORMA-LIMPIA-VPS.sh | bash
```

Firewall panel: TCP `80`, `443`, `5757`. No `5432`.
