# Open Banking — infraestructura abierta

AIS / PIS sobre estándares publicados, no un protocolo cerrado:

- OAuth 2.0 client credentials (RFC 6749), `client_secret_post` y `client_secret_basic`
- Introspección de token (RFC 7662)
- OpenAPI 3.0 en `/api/open-banking/v1/openapi.json`
- Descubrimiento en `/api/open-banking/v1/discovery`
- Sobre de recursos `Data` (estilo UK Open Banking) para consentimientos, cuentas y pagos
- `Idempotency-Key` en `POST /payments`

El rail de liquidación sigue siendo TUU → lote → dLocal Go.

## Base

`/api/open-banking/v1`

| Método | Ruta | Auth | Scope |
|--------|------|------|-------|
| GET | `/discovery` | — | — |
| GET | `/openapi.json` | — | — |
| POST | `/auth/token` | client_id + secret o Basic | — |
| POST | `/auth/introspect` | client + `token` | — |
| POST | `/consents` | client o bearer | — |
| POST | `/consents/:id/authorise` | sesión empresa/ops o client | — |
| GET | `/consents` | bearer | — |
| GET | `/accounts` | bearer + consent | `accounts:read` |
| GET | `/accounts/:id/transactions` | bearer + consent | `transactions:read` |
| POST | `/payments` | bearer + consent | `payments:write` |
| GET | `/payments/:id` | bearer + consent | `payments:write` |

## UI

- Docs: `/docs/open-banking`
- Ops: `/ops/open-banking`
- Admin API clients: `GET/POST /api/baas/open-banking/clients`

## Demo

```bash
node scripts/open-banking-e2e.mjs
```

El seed crea el client **Demo Open Banking** (secreto visible una vez en ops / audit).

## Nota regulatoria

API de **software / mandato** para empresas. No implica licencia bancaria ni custodia de fondos del público.
