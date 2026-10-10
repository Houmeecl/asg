# HubSpot — leads sicr3p/

El formulario `/contacto` persiste en SQLite y, si hay token, hace upsert del contacto en HubSpot + nota con el mensaje.

## Variable

```bash
HUBSPOT_PRIVATE_APP_TOKEN=pat-...   # Private App
# alias aceptado:
HUBSPOT_ACCESS_TOKEN=
HUBSPOT_LEAD_STATUS=NEW             # opcional
```

## Permisos Private App

- `crm.objects.contacts.read`
- `crm.objects.contacts.write`
- `crm.objects.notes.write` (y read si aplica)

## Comportamiento

| Token | Modo | Efecto |
|-------|------|--------|
| Ausente | `simulator` | Lead solo local + cola simulada en memoria |
| Presente | `live` | Search por email → create/PATCH + note asociada |

API: `lib/baas/hubspot.js` · ruta `POST /api/baas/contacto` · status `GET /api/baas/contacto`.

## Privacidad

Mencionado en `/privacidad` como encargado/CRM cuando está activo. No enviar el formulario a HubSpot hasta tener base legal / aviso visible.
