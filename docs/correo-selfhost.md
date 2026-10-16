# Correo en el VPS (poste.io)

Decisión: **mail en el mismo Cloud Server** que la app.
DNS: A `mail.sicr3p.cl` → `149.50.155.61` (ya correcto si apunta al VPS).

## Stack

| Pieza | Valor |
|-------|--------|
| Software | [poste.io](https://poste.io/) (gratis 1 server; no FOSS) |
| FOSS alt. | Mailu / docker-mailserver — ver abajo |
| Hostname | `mail.sicr3p.cl` |
| Webmail | `https://mail.sicr3p.cl` (nginx → `127.0.0.1:8080`) |
| SMTP/IMAP | `25` / `465` / `587` / `993` en el VPS |

No pisa `80`/`443` de Supabase/nginx: HTTP de poste solo en loopback.

## Instalar (consola root DonWeb)

```bash
curl -fsSL https://raw.githubusercontent.com/Houmeecl/asg/cursor/configurar-vps-plan-775f/scripts/install-posteio.sh | bash
```

Luego en el panel DonWeb abrí TCP `25`, `465`, `587`, `993`.
Pedí PTR `149.50.155.61` → `mail.sicr3p.cl`.

## DNS / SPF

```
A   mail.sicr3p.cl → 149.50.155.61
MX  sicr3p.cl → mail.sicr3p.cl
TXT sicr3p.cl → v=spf1 ip4:149.50.155.61 -all
```

DKIM/DMARC los genera poste.io en la UI.

## Casillas

1. Abrí `https://mail.sicr3p.cl` (o HTTP si el cert aún no salió).
2. Creá admin.
3. Dominio `sicr3p.cl`.
4. Casilla `edward@sicr3p.cl` (y las que necesites).

Ahí ves el correo (webmail del VPS), no en ferozo.email.

## Mailu (código libre)

Si no querés poste.io: https://mailu.io/ — no mezclar ambos en el mismo host.
Monitoreá RAM (`free -h`): Supabase + Next + mail suman bastante.
