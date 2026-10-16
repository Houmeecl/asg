# dLocal — entorno prueba (sandbox) y producción

SICR3P no opera solo “en live”. Hay tres modos y **dos slots de credenciales**.

| Modo | Alias | Qué es |
|------|-------|--------|
| `simulator` | `local`, `demo` | Demo offline en SQLite. No llama a dLocal. |
| `sandbox` | `prueba`, `test`, `sbx` | **Entorno de prueba** real (API sandbox). |
| `live` | `produccion`, `prod` | Producción. |

## Activar prueba

```bash
DLOCAL_MODE=sandbox          # o prueba / test
DLOCAL_PLATFORMS_MODE=sandbox

DLOCAL_SANDBOX_API_KEY=...
DLOCAL_SANDBOX_SECRET_KEY=...

DLOCAL_PLATFORMS_SANDBOX_LOGIN=...
DLOCAL_PLATFORMS_SANDBOX_TRANS_KEY=...
DLOCAL_PLATFORMS_SANDBOX_SECRET=...
```

Bases por defecto:

- Go: `https://api-sbx.dlocalgo.com`
- Platforms: `https://marketplace-api.dlocal-sbox.com`

## Activar producción (después de sandbox)

```bash
DLOCAL_MODE=live
DLOCAL_PLATFORMS_MODE=live
DLOCAL_LIVE_API_KEY=...
DLOCAL_LIVE_SECRET_KEY=...
DLOCAL_PLATFORMS_LIVE_LOGIN=...
DLOCAL_PLATFORMS_LIVE_TRANS_KEY=...
DLOCAL_PLATFORMS_LIVE_SECRET=...
```

Podés dejar **ambos slots cargados** y cambiar solo `DLOCAL_MODE` / `DLOCAL_PLATFORMS_MODE`.

## Autorización con términos

`/autorizar` registra aceptación de la integración **SICR3P completa** (no solo dLocal),
con radio **Prueba (sandbox)** o **Producción**. El campo `entorno` queda en
`baas_autorizaciones`.

## Estado

- Ops UI: `/ops/config` (slots prueba + producción)
- API: `GET /api/baas/dlocal/entorno` (detalle con sesión)
- Agente: `/soporte` → preguntá “entorno de prueba” o “sandbox”

## Infraestructura

- Mapa completo: `docs/dlocal-infra.md`
- Discovery: `GET /api/baas/dlocal/infra`
- Ops: `/ops/dlocal`
- Docs web: `/docs/dlocal`
