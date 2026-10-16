# Estado VPS sicr3p

Último probe agente: `2026-10-16T10:10Z`

| Chequeo | Estado (agente) |
|---------|-----------------|
| A `sicr3p.cl` → VPS | OK |
| A `mail.sicr3p.cl` → VPS | OK |
| A `supabase.sicr3p.cl` | **Falta** (vacío) |
| MX `sicr3p.cl` | **Falta** (vacío) |
| SPF TXT | hostmar (cambiar a `ip4:149.50.155.61`) |
| TCP 80/443 | Abiertos (HTTP 403 — app aún no en nginx) |
| TCP 5757 / 25 / 465 / 587 / 993 | Cerrados desde red del agente |
| TLS / landing / Studio / webmail | Sin handshake usable desde el agente |

## Un pegado: landing + mail

Consola DonWeb root →  
https://micuenta.donweb.com/es-cl/servicios/cloud-iaas/vps/6495918/configurar/consola

```bash
curl -fsSL https://raw.githubusercontent.com/Houmeecl/asg/cursor/configurar-vps-plan-775f/scripts/TODO-FUNCION-VPS.sh | bash
```

- Landing: `https://sicr3p.cl`
- Supabase: `https://supabase.sicr3p.cl`
- Webmail: `https://mail.sicr3p.cl`

## DNS a dejar así

| Tipo | Nombre | Valor |
|------|--------|--------|
| A | `sicr3p.cl` | `149.50.155.61` |
| A | `supabase.sicr3p.cl` | `149.50.155.61` |
| A | `mail.sicr3p.cl` | `149.50.155.61` |
| MX | `sicr3p.cl` | `mail.sicr3p.cl` |
| TXT | `sicr3p.cl` | `v=spf1 ip4:149.50.155.61 -all` |

## Firewall panel (`0.0.0.0/0`)

`80`, `443`, `5757`, `25`, `465`, `587`, `993`. No `5432`.

Cuando 5757 esté abierto al mundo, el agente ejecuta el mismo script solo.
