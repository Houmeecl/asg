# Documentación legal sicr3p/ (paquete revisión)

No es asesoría jurídica. Textos alineados a la web pública y al rail TUU + dLocal Go.

## Páginas públicas

| Ruta | Contenido |
|------|-----------|
| `/terminos` | Términos y condiciones del servicio tecnológico |
| `/privacidad` | Política de privacidad |
| `/legal` | Razón social, RUT, email, teléfono |
| `/contacto` | Formulario activo (POST `/api/baas/contacto`) |
| `/docs/legal/dlocal-go-checklist` | Checklist visual pre-revisión |

## Variables a confirmar antes de live

```bash
SICR3P_RAZON_SOCIAL=
SICR3P_RUT=
SICR3P_CONTACT_EMAIL=   # preferir el mismo de la cuenta dLocal Go
SICR3P_CONTACT_PHONE=
SICR3P_ADDRESS=
SICR3P_LINKEDIN=        # solo si es real; vacío = no mostrar
SICR3P_INSTAGRAM=
```

Fuente de copy estructurado: `lib/baas/legal-copy.js`.

## Posicionamiento CMF (resumen)

- Comercio + software; cobro TUU; payouts dLocal Go desde saldo merchant.
- No captación, no emisión propia de prepago, no “cuenta sicr3p/” exigible al público.
- Validar con abogado financiero / UAF antes de go-live.
