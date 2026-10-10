# Open Banking API — SICR3P BaaS

Capa partner **AIS / PIS** sobre el rail existente (TUU → lote → dLocal Go).

## Base

`/api/open-banking/v1`

| Método | Ruta | Auth | Scope |
|--------|------|------|-------|
| POST | `/auth/token` | client_id + secret | — |
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
