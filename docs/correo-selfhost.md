# Correo self-host: poste.io vs código libre

Hoy el inbox de `sicr3p.cl` está en **Ferozo** (MX → `mail.sicr3p.cl` → IP Ferozo).
El VPS (`149.50.155.61`) ya corre **Supabase + nginx + Next**. Si querés
correo propio, elegí con cuidado: mail y web en la misma caja pelean por
RAM, `80/443` y reputación IP.

## Opciones

| Stack | Licencia | Encaja en este VPS | Notas |
|-------|----------|--------------------|--------|
| **Ferozo (actual)** | SaaS hosting | Sí (MX afuera) | Mejor deliverability sin ops |
| **[poste.io](https://poste.io/)** | Gratis 1 server; **no es FOSS** | Medio | Muy fácil; por defecto quiere `80/443` → hay que proxy |
| **[Mailu](https://mailu.io/)** | MIT (código libre) | Medio–alto | Compose completo; más RAM |
| **[docker-mailserver](https://docker-mailserver.github.io/docker-mailserver/)** | MIT | Medio | Solo SMTP/IMAP; webmail aparte |
| **[Mailcow](https://mailcow.github.io/mailcow-dockerized-docs/)** | GPL | Pesado | Ideal en VPS dedicado ≥8 GB |

**Recomendación SICR3P:** si el objetivo es “casillas propias con UI”,
usá **poste.io** (script abajo) o **Mailu** si exigís código libre.
Si solo necesitás enviar mails de la app (OTP, notificaciones), es mejor un
relay transaccional y dejar el inbox en Ferozo.

## Requisitos en DonWeb (firewall)

Abrí hacia Internet (no solo tu IP):

- TCP `25`, `465`, `587` (SMTP)
- TCP `993` (IMAPS) — opcional `995`/`143`
- `80`/`443` ya abiertos (webmail vía nginx → contenedor)

**No abras `5432`.** Confirmá que DonWeb no filtre **salida** en `25`
(muchos VPS lo bloquean; sin eso no recibís/enviás bien).

## DNS al cortar a self-host

Cuando el mail viva en el VPS (dejás Ferozo):

| Tipo | Nombre | Contenido |
|------|--------|-----------|
| A | `mail.sicr3p.cl` | `149.50.155.61` |
| MX | `sicr3p.cl` | `mail.sicr3p.cl` (prio 10) |
| TXT | `sicr3p.cl` | `v=spf1 ip4:149.50.155.61 -all` (o `~all` al migrar) |
| TXT | `default._domainkey.sicr3p.cl` | DKIM que emita el stack |
| TXT | `_dmarc.sicr3p.cl` | `v=DMARC1; p=none; rua=mailto:edward@sicr3p.cl` |

Pedí **PTR/rDNS** de `149.50.155.61` → `mail.sicr3p.cl` en soporte DonWeb.
Sin PTR, Gmail/Outlook marcan spam.

Migración sugerida: creá las casillas en el stack nuevo, bajá mail viejo por
IMAP, cambiá MX, esperá TTL, recién ahí apagá Ferozo.

## Instalar poste.io (gratis, proxy nginx)

En el VPS (SSH/consola root), **después** del rewire de app/Supabase:

```bash
curl -fsSL https://raw.githubusercontent.com/Houmeecl/asg/cursor/supabase-sicr3p-ssl-775f/scripts/install-posteio.sh | bash
```

Eso:

1. Levanta poste.io con `HTTPS=OFF` en `127.0.0.1:8080` (no pisa el 443 de Supabase).
2. Agrega vhost nginx `mail.sicr3p.cl` → ese puerto.
3. Abre ufw `25/465/587/993`.
4. Deja el admin en `https://mail.sicr3p.cl` cuando el A de `mail` apunte al VPS.

Primera visita: crear admin en la UI de poste.io, dominio `sicr3p.cl`, casillas
`edward@` / `contacto@`, copiar DKIM al DNS.

## Mailu (código libre)

Si preferís FOSS en lugar de poste.io:

```bash
# Documentación oficial: https://mailu.io/master/compose/setup.html
# Usá MAILU_HOSTNAME=mail.sicr3p.cl y TLS vía el nginx del VPS (TLS_FLAVOR=mail)
# No lo mezcles con poste.io en el mismo host.
```

Mailu pide más disco/RAM; en un Cloud Server chico con Supabase puede
quedar justo. Monitoreá `free -h` antes.

## Convivencia con la app

- Apex `sicr3p.cl` → Next (PM2).
- `supabase.sicr3p.cl` → cert/panel Supabase.
- `mail.sicr3p.cl` → webmail/admin del stack de correo.
- SMTP de la app (si más adelante envía mail): apuntá a `mail.sicr3p.cl:587`
  con usuario de casilla, o a un relay externo.
