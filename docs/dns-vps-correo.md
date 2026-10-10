# DNS: VPS + correo Ferozo en sicr3p.cl

El sitio/API van al Cloud Server; el correo sigue en Ferozo.
**No uses el A del apex para el mail.** Si al apuntar el dominio al VPS
desaparecen los MX, el correo “se pierde” aunque la casilla siga existiendo.

## Registros que deben convivir

| Tipo | Nombre | Contenido | Notas |
|------|--------|-----------|--------|
| A | `sicr3p.cl` | `149.50.155.61` | VPS (web / Supabase / app) |
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

- A `sicr3p.cl` → `149.50.155.61` (verificado públicamente)

En **Software y accesos → Configurar Dominio y SSL** ingresá exactamente `sicr3p.cl`.
No hace falta un CNAME especial a “supabase”: Supabase corre en ese VPS.
Si el panel solo acepta subdominio, creá A `supabase.sicr3p.cl` → `149.50.155.61` y usá ese nombre.

### Cuando ya tenés SSH (desde tu PC)

```bash
curl -fsSL https://raw.githubusercontent.com/Houmeecl/asg/cursor/autorizar-soporte-775f/scripts/RUN-EN-TU-SSH.sh | bash
```

Eso abre ufw 5757, fija `SITE_URL`/`API_EXTERNAL_URL` de Supabase a `https://sicr3p.cl`, emite/usa SSL y levanta la app.

### Consola web (si SSH no responde desde Internet)

```bash
curl -fsSL https://raw.githubusercontent.com/Houmeecl/asg/cursor/autorizar-soporte-775f/scripts/PASTE-EN-CONSOLA-DONWEB.sh | bash
```

Estado verificado desde el Cloud Agent (2026-10-10): DNS OK; TCP 80/443 abiertos; TCP 5757 cerrado desde la red del agente; TLS `sicr3p.cl` aún sin certificado usable desde esa red.
