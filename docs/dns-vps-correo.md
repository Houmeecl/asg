# DNS: VPS + correo Ferozo en sicr3p.cl

El sitio/API van al Cloud Server; el correo sigue en Ferozo.
**No uses el A del apex para el mail.** Si al apuntar el dominio al VPS
desaparecen los MX, el correo “se pierde” aunque la casilla siga existiendo.

## Registros que deben convivir

| Tipo | Nombre | Contenido | Notas |
|------|--------|-----------|--------|
| A | `sicr3p.cl` | `149.50.155.61` | VPS (app Next) |
| A | `supabase.sicr3p.cl` | `149.50.155.61` | VPS (Supabase + SSL del panel) |
| AAAA | `sicr3p.cl` | IPv6 del VPS (opcional) | Como en el panel |
| CNAME | `www.sicr3p.cl` | `sicr3p.cl` | |
| A | `mail.sicr3p.cl` | `200.58.111.129` | IP Ferozo (`a0170393.ferozo.com`) |
| MX | `sicr3p.cl` | `mail.sicr3p.cl` | Prioridad `0` (o restaurar MX por defecto) |
| TXT | `sicr3p.cl` | `v=spf1 include:spf.ferozo.com ~all` | SPF |

En **Zona DNS** → **Configuración de correo** → **Restaurar MX por defecto**
si no querés cargarlos a mano. **No borres** el A `149.50.155.61`.

## Casilla

- Webmail: https://ferozo.email  
- Cuenta: `edward@sicr3p.cl`  
- IMAP/SMTP: `a0170393.ferozo.com` (993 / 465, SSL)

## VPS (app + Supabase)

Firewall del Cloud Server: TCP `80`, `443`, `5757` (hacia Internet, no solo tu IP). No abrir `5432`.

### Configurar Dominio y SSL (panel DonWeb / Supabase)

El DNS **ya debe** resolver a la IP del Cloud Server antes del botón:

- A `sicr3p.cl` → `149.50.155.61`
- A `supabase.sicr3p.cl` → `149.50.155.61`

En **Software y accesos → Configurar Dominio y SSL** ingresá exactamente `supabase.sicr3p.cl`
(certificado emitido ahí). La app Next usa el apex `sicr3p.cl`.

### Cuando ya tenés SSH (desde tu PC)

```bash
curl -fsSL https://raw.githubusercontent.com/Houmeecl/asg/cursor/supabase-sicr3p-ssl-775f/scripts/RUN-EN-TU-SSH.sh | bash
```

Eso abre ufw 5757, fija `SITE_URL`/`API_EXTERNAL_URL` de Supabase a
`https://supabase.sicr3p.cl`, no pisa el cert del panel, y levanta la app en `sicr3p.cl`.

### Consola web (si SSH no responde desde Internet)

```bash
curl -fsSL https://raw.githubusercontent.com/Houmeecl/asg/cursor/supabase-sicr3p-ssl-775f/scripts/PASTE-EN-CONSOLA-DONWEB.sh | bash
```

Estado verificado desde el Cloud Agent (2026-10-11): DNS OK para apex y
`supabase.sicr3p.cl`; TCP 80/443 abiertos (HTTP `403`); TCP 5757 cerrado desde
la red del agente; TLS público aún sin handshake usable desde esa red.
