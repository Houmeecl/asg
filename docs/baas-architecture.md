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
| dLocal Platforms onboarding | `lib/baas/platforms.js` + `/ops/onboarding` |
| TUU InterApp adapter + mock | `lib/baas/tuu.js` |
| Wallet virtual / KYC QR | `lib/baas/wallet.js` |
| Operaciones, lotes, liberar | `lib/baas/operations.js` |
| Open Banking AIS/PIS (partner) | `lib/baas/open-banking.js` + `/api/open-banking/v1` |
| Portal empresa | `app/portal/**` |
| Ops / admin | `app/ops/**` (+ `/ops/dlocal`, `/ops/open-banking`) |
| Infra dLocal (discovery) | `lib/baas/dlocal-infra.js` + `GET /api/baas/dlocal/infra` |
| Webhook dLocal Go | `app/api/baas/webhooks/dlocal` (HMAC si hay secret) |
| Webhook Platforms | `app/api/baas/webhooks/dlocal-platforms` |
| DNS VPS + correo Ferozo | `docs/dns-vps-correo.md` |

Ver también `docs/dlocal-infra.md`, `docs/dlocal-entornos.md`, `docs/open-banking.md` y `docs/dns-vps-correo.md`.

## Infraestructura dLocal

| Superficie | Ruta |
|------------|------|
| Discovery | `GET /api/baas/dlocal/infra` |
| Entornos | `GET /api/baas/dlocal/entorno` |
| Ops | `/ops/dlocal` |
| Docs | `/docs/dlocal` |
| Webhook Go | `POST /api/baas/webhooks/dlocal` |
| Webhook Platforms | `POST /api/baas/webhooks/dlocal-platforms` |

## Estados de operación

`BORRADOR` → `PENDIENTE_REGISTRO` | `PENDIENTE_COBRO` → `COBRADA` → `EN_LOTE` → `ENVIADA` → `PAGADA` | `RECHAZADA`

- **ENVIO:** cobro TUU (mock/real) + payout dLocal.
- **TURISTA_QR:** pay-in simulado vía `/pagar/:token`.

## Variables de entorno

Ver plantilla en `.env.example`.

- `DLOCAL_MODE=simulator|sandbox|prueba|live` — ver `docs/dlocal-entornos.md`
- Slots: `DLOCAL_SANDBOX_*` + `DLOCAL_LIVE_*` (legacy `DLOCAL_API_KEY` / `SECRET` sigue válido)
- `DLOCAL_PLATFORMS_MODE` + `DLOCAL_PLATFORMS_SANDBOX_*` / `DLOCAL_PLATFORMS_LIVE_*`
- `DLOCAL_PLATFORMS_NOTIFICATION_URL` (default `https://sicr3p.cl/api/baas/webhooks/dlocal-platforms`)
- Estado: `GET /api/baas/dlocal/infra` · `GET /api/baas/dlocal/entorno` · UI `/ops/dlocal` / `/ops/config`
- `SICR3P_RAZON_SOCIAL` / `SICR3P_RUT` / `SICR3P_CONTACT_EMAIL` / `SICR3P_CONTACT_PHONE`
- `SICR3P_FUNDACION_*` (dueña Fundación Entretodos)
- `HUBSPOT_PRIVATE_APP_TOKEN` (opcional; sin token = simulador)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (VPS self-host)
- InterApp TUU en web: mock en `lib/baas/tuu.js` + UI `/ops/pos` hasta partner/APK real

Pay-in ops: `POST /api/baas/operaciones` con `{ action: "payin_dlocal", operacionId }`.

## Pendiente fuera del Cloud Agent

1. Restaurar MX Ferozo en Zona DNS (sin borrar A del VPS) — ver `docs/dns-vps-correo.md`.
2. Confirmar teléfono real (`SICR3P_CONTACT_PHONE`) y casilla `contacto@` o usar `edward@sicr3p.cl`.
3. Token HubSpot Private App para leads live.
4. Credenciales dLocal Go + Platforms en slots sandbox (`DLOCAL_SANDBOX_*`) y luego live.
5. Firewall TCP 5757 + SSL `supabase.sicr3p.cl` (panel) y app en `sicr3p.cl` / consola bootstrap.
6. Registro partner TUU + APK InterApp (ver `docs/tuu-partner-checklist.md`).
7. Cesión societaria formal dueña/operadora si aún no está inscrita.

## Demo users

| Email | Rol | Destino |
|-------|-----|---------|
| empresa@sicr3p.cl | EMPRESA | `/portal` |
| ops@sicr3p.cl | OPERADOR | `/ops` |
| admin@sicr3p.cl | ADMIN | `/ops` (+ panel industrial) |

Clave demo: `sicr3p2026`
