# DNS: VPS (web + correo) en sicr3p.cl

App, Supabase y **correo** van al Cloud Server `149.50.155.61`.
El A de `mail.sicr3p.cl` **debe** apuntar al VPS (no a Ferozo).

## Registros

| Tipo | Nombre | Contenido | Notas |
|------|--------|-----------|--------|
| A | `sicr3p.cl` | `149.50.155.61` | App Next |
| A | `supabase.sicr3p.cl` | `149.50.155.61` | Supabase + SSL panel |
| A | `mail.sicr3p.cl` | `149.50.155.61` | Correo (poste.io) — **al VPS** |
| CNAME | `www.sicr3p.cl` | `sicr3p.cl` | |
| MX | `sicr3p.cl` | `mail.sicr3p.cl` | Prioridad `0` o `10` |
| TXT | `sicr3p.cl` | `v=spf1 ip4:149.50.155.61 -all` | SPF del VPS |
| TXT | `default._domainkey.sicr3p.cl` | (DKIM de poste.io) | Tras instalar |
| TXT | `_dmarc.sicr3p.cl` | `v=DMARC1; p=none; rua=mailto:edward@sicr3p.cl` | |

Pedí **PTR** `149.50.155.61` → `mail.sicr3p.cl` a DonWeb.

## Firewall DonWeb (Cloud Server)

TCP hacia Internet (no solo tu IP):

- `80`, `443` (web / Studio)
- `5757` (SSH)
- `25`, `465`, `587`, `993` (correo)
- **No** abrir `5432`

## Correo en el VPS (poste.io)

Con DNS `mail` → VPS ya puesto, en consola root:

```bash
curl -fsSL https://raw.githubusercontent.com/Houmeecl/asg/cursor/configurar-vps-plan-775f/scripts/install-posteio.sh | bash
```

Después:

- Webmail/admin: `https://mail.sicr3p.cl`
- Creá admin + dominio `sicr3p.cl` + casilla `edward@sicr3p.cl`
- Copiá DKIM al DNS

Detalle: `docs/correo-selfhost.md`.

## App + Supabase

```bash
curl -fsSL https://raw.githubusercontent.com/Houmeecl/asg/cursor/configurar-vps-plan-775f/scripts/BUILD-PLATAFORMA-LIMPIA-VPS.sh | bash
```
