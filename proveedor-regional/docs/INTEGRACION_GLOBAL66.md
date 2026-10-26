# Integración Global66 de solo lectura

Estado: adaptador implementado y probado con transporte HTTP simulado. **No se han validado credenciales, permisos ni respuestas contra una cuenta real.** No se han creado endpoints o credenciales en Global66 y no se han ejecutado operaciones monetarias.

La fundación y cada empresa participante tienen una configuración independiente. El programa no centraliza sus fondos. El adaptador no autoriza usuarios: el backend del portal debe verificar titularidad y permisos sobre la organización antes de invocarlo, y debe comprobar de nuevo que cualquier autorización delegada siga vigente antes de devolver datos de otra empresa. Una credencial de la fundación nunca sirve como sustituto de la de una empresa.

## Funciones de Python

```python
from app.global66 import config_status, read_snapshot, IntegrationUnavailable

status = config_status("FUNDACION")
snapshot = await read_snapshot("FUNDACION")
```

`config_status` entrega únicamente banderas de configuración. `mode="ready"` significa que existe configuración y se activaron lecturas; **no** significa conexión real validada. No devuelve el identificador del cliente, el secreto o tokens.

`read_snapshot` produce:

```json
{
  "source": "global66",
  "tenant_code": "FUNDACION",
  "as_of": "fecha ISO-8601 UTC",
  "accounts": [
    {"id": "123", "currency": "CLP", "balance": "0", "alias": null, "is_principal": true}
  ],
  "movements": [
    {
      "id": "42", "account_id": "123", "date": null,
      "amount": null, "currency": "CLP", "direction": "unknown",
      "status": null, "description": "Movimiento Global66"
    }
  ],
  "partial": false
}
```

Las cifras monetarias son strings decimales para conservar precisión. Un dato opcional ausente queda `null`; no se convierte a cero. La dirección es `in`, `out` o `unknown`. Los identificadores deben manejarse junto al de organización y cuenta, no como prueba independiente de propiedad. No se suman saldos de distintas monedas como un único total.

Ante una falla se lanza `IntegrationUnavailable` con `code` y `message` seguros para el backend. No se devuelven el cuerpo de error del proveedor ni excepciones HTTP que puedan contener información sensible. Un fallo real no se oculta sustituyéndolo automáticamente por datos ficticios.

## Configuración por organización

Los códigos son canónicos: mayúsculas, dígitos y guion bajo, comenzando por una letra, hasta 32 caracteres. Deben provenir de la organización autenticada en base de datos, no de un campo arbitrario que el navegador pueda elegir.

Variables de servidor, con valores inyectados mediante el mecanismo seguro de secretos del alojamiento:

```text
GLOBAL66_LIVE_READS=false
GLOBAL66_FUNDACION_CLIENT_ID=<configurar fuera del código>
GLOBAL66_FUNDACION_CLIENT_SECRET=<configurar fuera del código>
GLOBAL66_EMPRESA1_CLIENT_ID=<configurar fuera del código>
GLOBAL66_EMPRESA1_CLIENT_SECRET=<configurar fuera del código>
GLOBAL66_MAX_ACCOUNTS=3
GLOBAL66_MAX_MOVEMENT_PAGES=2
```

No pegar los secretos en chats, repositorios, JavaScript, formularios públicos o logs. El archivo de ejemplo no debe contener claves reales. La integración no lee credenciales desde solicitudes HTTP del portal.

Mantener `GLOBAL66_LIVE_READS=false` en la demostración. Activar `true` requiere un servidor controlado, credenciales y habilitación de la empresa correspondiente, su autorización y validación de la IP de salida. La documentación de Global66 exige registrar las IPv4 de egreso permitidas por credencial; esto se configura en su plataforma. No se ha realizado esa acción.

El host es fijo: `https://api.global66.com/business-api`. No se admite un host enviado por el navegador ni un ajuste de URL que pueda enviar credenciales a un tercero. Se rechazan redirecciones.

## Contratos verificados en la documentación primaria

- Autenticación: `POST /b2b/auth` con `clientId` y `clientSecret`, respuesta con campo `token`. La cabecera de las consultas lleva el token directo, sin prefijo Bearer. En este MVP se obtiene un token nuevo por consulta del snapshot y no se persisten ni token ni refresh token. No hay caché entre empresas. [Autenticación](https://documents-b2b.global66.com/transactional-api/autenticacion/).
- Cuentas: `GET /b2b/accounts`, con lista `accounts`. Se usan `walletId`, `currency`, `balance`, `isPrincipal` y `alias` opcional. Cada `walletId` del resultado es el `accountId` de las consultas de movimientos; no se acepta otro identificador externo. [Cuentas](https://documents-b2b.global66.com/available-apis/accounts/).
- Movimientos: `GET /b2b/movements/{accountId}`, con paginación `page` desde 1 y bloques de 50. Se leen `movements` y `totalPages`. Solo se conservan los campos necesarios para la vista, no los datos bancarios de contrapartes. [Movimientos](https://documents-b2b.global66.com/available-apis/movements/).

Consulta documental: 26 de octubre de 2026. Los ejemplos de pruebas son sintéticos, construidos con esos campos, no capturas de cuentas reales.

## Límites de esta primera versión

- Por defecto se consultan hasta tres cuentas y dos páginas por cuenta. `partial=true` señala cuentas o páginas omitidas o paginación incompleta. El portal debe indicarlo; no es una conciliación histórica completa.
- Los límites se pueden modificar solo en el servidor: máximo veinte cuentas y diez páginas por cuenta. La consulta completa tiene un límite de 35 segundos y cada solicitud usa un timeout de diez segundos. Ampliar el número de consultas puede requerir otra estrategia de sincronización.
- No hay ejecución de pagos, cambios de moneda, creación de beneficiarios ni operaciones RaaS. No se habilita una API de pagos añadiendo credenciales a este módulo.
- La restricción a lectura se aplica en este código, no demuestra que la credencial del proveedor tenga un alcance de solo lectura. Deben revisarse los permisos de esa credencial y protegerla como un secreto de alta sensibilidad.
- No se renueva el token en segundo plano ni se reintenta automáticamente una denegación. Un 401/403 entrega un estado seguro para revisar credenciales, permisos e IP. Ante caída, límite de consumo o formato inesperado se informa la falla sin alterar fondos.
- El historial se recupera de forma acotada y bajo demanda; falta un proceso de sincronización incremental, reconciliación, observabilidad, política de retención y validación con cuentas reales antes de producción.
- Una conexión bancaria no demuestra identidad territorial, cumplimiento, solvencia, perfil de Pasaporte ni impacto económico.

## Pruebas locales

```bash
python -m unittest discover -s tests -p test_connector.py -v
```

Se usa `httpx.MockTransport` y datos ficticios. Las pruebas cubren desactivación por defecto, aislamiento de configuración, cabecera y rutas oficiales, precisión de cifras, campos ausentes, paginación y límites, errores sin secretos, esquema de autenticación, rechazo de redirecciones y códigos de organización no válidos. No requieren acceso a la red.

## Receptor de notificaciones

El contrato aportado después del conector se documenta en `CONTRATO_WEBHOOKS.md`. Su autenticación `x-api-key` es distinta de los tokens usados para consultas salientes. No contiene rutas de pagos. Los avisos se normalizan y guardan con datos mínimos; no se actualizan saldos ni se considera completo un historial por recibir un solo evento.
