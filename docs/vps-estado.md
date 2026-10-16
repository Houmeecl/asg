# Estado VPS sicr3p (plan configurar_vps)

| Chequeo | Estado |
|---------|--------|
| A `sicr3p.cl` → `149.50.155.61` | OK |
| A `supabase.sicr3p.cl` → `149.50.155.61` | OK |
| A `mail.sicr3p.cl` → `149.50.155.61` | OK (correo en el VPS) |
| MX → `mail.sicr3p.cl` | OK |
| TCP 80 / 443 | Abiertos (HTTP a veces `403` desde el agente) |
| TCP 25 / 465 / 587 / 993 | Cerrados — abrir en firewall + instalar poste.io |
| TCP 5757 (SSH) desde agente | Cerrado |
| TCP 5432 público | Cerrado (correcto) |
| TLS público | Handshake aún no usable desde la red del agente |

## App + Supabase

```bash
curl -fsSL https://raw.githubusercontent.com/Houmeecl/asg/cursor/configurar-vps-plan-775f/scripts/BUILD-PLATAFORMA-LIMPIA-VPS.sh | bash
```

Hostname: `https://supabase.sicr3p.cl`. Postgres solo localhost. Sin migrar SQLite.

## Correo en el VPS

```bash
curl -fsSL https://raw.githubusercontent.com/Houmeecl/asg/cursor/configurar-vps-plan-775f/scripts/install-posteio.sh | bash
```

Webmail: `https://mail.sicr3p.cl`. SPF: `v=spf1 ip4:149.50.155.61 -all`. PTR a DonWeb.

## Firewall panel

TCP `80`, `443`, `5757`, `25`, `465`, `587`, `993`. No `5432`.
