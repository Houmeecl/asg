# dLocal — infraestructura

Mapa operativo del rail **TUU → lote → dLocal Go / Platforms** en SICR3P.

## Superficie

| Qué | Dónde |
|-----|--------|
| Discovery | `GET /api/baas/dlocal/infra` |
| Entornos (slots) | `GET /api/baas/dlocal/entorno` · `docs/dlocal-entornos.md` |
| Ops | `/ops/dlocal` |
| Onboarding Platforms | `/ops/onboarding` |
| Docs web | `/docs/dlocal` |
| Autorización | `/autorizar` (prueba \| producción) |
| Webhook Go | `POST /api/baas/webhooks/dlocal` |
| Webhook Platforms | `POST /api/baas/webhooks/dlocal-platforms` |

## Productos

1. **dLocal Go** — pay-in (`POST /v1/payments`) y payouts (`POST /v1/payouts`). Auth `Bearer API_KEY:SECRET_KEY`.
2. **dLocal for Platforms** — cuentas de vendedor (`POST /v2/accounts` + KYC). La cuenta Platform la abre dLocal con la entidad.

## Modos

`simulator` (demo local) → `sandbox` / prueba → `live`.

Credenciales por slot: `DLOCAL_SANDBOX_*` / `DLOCAL_LIVE_*` y `DLOCAL_PLATFORMS_SANDBOX_*` / `DLOCAL_PLATFORMS_LIVE_*`. Ver `docs/dlocal-entornos.md`.

## Bases

| | Go | Platforms |
|--|----|-----------|
| Sandbox | `https://api-sbx.dlocalgo.com` | `https://marketplace-api.dlocal-sbox.com` |
| Live | `https://api.dlocalgo.com` | `https://marketplace-api.dlocal.com` |

## Chile (payout)

- `country=CL`, `currency=CLP`, `payment_method_id=BANK_TRANSFER`
- Documento RUT; códigos de banco en `lib/baas/config.js` (`CHILE_BANK_CODES`)
- Webhooks solo HTTPS puerto 443 / TLS 1.2+

## Smoke

```bash
curl -sS http://127.0.0.1:3001/api/baas/dlocal/infra | head
node scripts/dlocal-infra-smoke.mjs
```

## Nota

SICR3P SpA = comercio + software. No emisor ni billetera pública. Liquidación partner Open Banking sigue este mismo rail.
