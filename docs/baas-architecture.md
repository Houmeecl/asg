# Arquitectura SICR3P BaaS — TUU → lote → dLocal Go

Sin Global66 ni AndCo. SICR3P SpA = comercio + software (no emisor, no billetera pública).

## Rail

```
Cliente → paga servicio → TUU (POS InterApp) ──abono──► Cuenta bancaria SICR3P SpA
Cliente → checkout online → dLocal Go pay-in ──────────► Saldo merchant dLocal Go
Treasury SICR3P ──fondeo──► Saldo merchant dLocal Go
Software SICR3P ──POST /v1/payouts──► Beneficiario (cuenta banco CL/LATAM)
```

## Componentes en este repo (`asg`)

| Capa | Ubicación |
|------|-----------|
| Schema SQLite BaaS | `lib/baas/schema.js` |
| dLocal Go client + simulador | `lib/baas/dlocal.js` |
| TUU InterApp adapter + mock | `lib/baas/tuu.js` |
| Wallet virtual / KYC QR | `lib/baas/wallet.js` |
| Operaciones, lotes, liberar | `lib/baas/operations.js` |
| Portal empresa | `app/portal/**` |
| Ops / admin | `app/ops/**` |
| Webhook dLocal | `app/api/baas/webhooks/dlocal` |

## Estados de operación

`BORRADOR` → `PENDIENTE_REGISTRO` | `PENDIENTE_COBRO` → `COBRADA` → `EN_LOTE` → `ENVIADA` → `PAGADA` | `RECHAZADA`

- **ENVIO:** cobro TUU (mock/real) + payout dLocal.
- **TURISTA_QR:** pay-in simulado vía `/pagar/:token`.

## Variables de entorno

Ver plantilla en `.env.example`.

- `DLOCAL_MODE=simulator|sandbox|live`
- `DLOCAL_API_KEY` / `DLOCAL_SECRET_KEY` / `DLOCAL_BASE_URL`
- `SICR3P_RAZON_SOCIAL` / `SICR3P_RUT` / `SICR3P_CONTACT_EMAIL` / `SICR3P_CONTACT_PHONE`
- `SICR3P_FUNDACION_*` (dueña Fundación Entretodos)
- `HUBSPOT_PRIVATE_APP_TOKEN` (opcional; sin token = simulador)
- InterApp TUU en web: mock en `lib/baas/tuu.js` + UI `/ops/pos` hasta partner/APK real

## Pendiente fuera del Cloud Agent

1. Confirmar teléfono real (`SICR3P_CONTACT_PHONE`) y redes si aplican.
2. Token HubSpot Private App para leads live.
3. Credenciales dLocal Go sandbox → live.
4. Registro partner TUU + APK InterApp (ver `docs/tuu-partner-checklist.md`).
5. Cesión societaria formal dueña/operadora si aún no está inscrita.

## Demo users

| Email | Rol | Destino |
|-------|-----|---------|
| empresa@sicr3p.cl | EMPRESA | `/portal` |
| ops@sicr3p.cl | OPERADOR | `/ops` |
| admin@sicr3p.cl | ADMIN | `/ops` (+ panel industrial) |

Clave demo: `sicr3p2026`
