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

Firewall del Cloud Server: TCP `80`, `443`, `5757`. No abrir `5432`.

Consola web (si SSH no responde):

```bash
git clone --depth 1 -b cursor/vps-console-bootstrap-775f https://github.com/Houmeecl/asg.git /tmp/sicr3p-asg
cd /tmp/sicr3p-asg && bash scripts/bootstrap-from-console.sh
```
