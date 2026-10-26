# Notificaciones según el archivo aportado

Versión del portal: 0.2.0. Fuente: `api-1 (3).json`, recibido del usuario; OpenAPI 3.1.0, «Webhook de Notificaciones B2B Global66», versión 1.0.0. Se conserva una copia documental en `references/global66-webhooks.openapi.json`. Es una especificación, no una credencial ni un acceso operativo.

## Alcance confirmado por este archivo

El documento define dos webhooks POST:

| Nombre documental | Bloque de datos | Uso |
| --- | --- | --- |
| `remittanceUpdate` | `payload` | Cambio de estado de remesa |
| `paymentReceived` | `data` | Recepción de dinero |

No contiene `paths`, `servers` ni rutas de autenticación o ejecución de pagos. Los esquemas sueltos de cotización, transferencia y `AuthResponse` no habilitan esas operaciones. El conector saliente de lectura existente tiene sus fuentes propias en `INTEGRACION_GLOBAL66.md`; no se modifica usando supuestos derivados de esos esquemas.

La descripción operativa exige `x-api-key`, respuesta rápida HTTP 200 y señala que **no hay reintentos** ante errores o timeout. El esquema `bearerAuth` está declarado pero no está aplicado mediante `security` a estos eventos. El receptor verifica `x-api-key`; un encabezado Bearer por sí solo no lo autoriza.

## Receptor creado

```text
POST /api/webhooks/global66/<CODIGO_INTERNO_DE_ORGANIZACION>
```

Ejemplos de rutas locales de la demo: códigos `FUNDACION`, `EMPRESA1`, `EMPRESA2`. Son identificadores internos, no IDs del cliente en Global66. El servidor resuelve el código en su base y consulta su propia variable `GLOBAL66_<CODIGO>_WEBHOOK_KEY`. Nunca enruta usando el `customerId` recibido ni acepta una clave de la fundación como sustituto de la de una empresa.

Si se configura `GLOBAL66_<CODIGO>_CUSTOMER_ID`, el cliente informado también se contrasta con ese valor. Una discrepancia queda pendiente de revisión y no redirige datos hacia otra organización; además, se omiten identificador, estado, monto, moneda y fecha para no mostrar información financiera de un cliente que no coincide.

El endpoint solo recibe avisos externos en una instancia `PR_MODE=pilot`. La demostración rechaza callbacks con clave válida mediante HTTP 409 y ofrece simulaciones autenticadas desde su portal. Una clave ausente o incorrecta recibe 401 y no guarda el aviso.

## Persistencia y significado de los eventos

1. Validar clave, entorno, tamaño máximo de 64 KiB y JSON.
2. Distinguir `payload` y `data` y normalizar lo disponible.
3. Guardar el registro mínimo en la bandeja y en la tabla de eventos en **una sola transacción SQLite**.
4. Confirmar HTTP 200 solo después de que el guardado haya terminado.

Se conserva el identificador de transacción como texto, monto decimal, moneda, estado literal, fecha de transacción cuando existe, fecha de recepción, tipo, origen y observaciones. No se guardan ni devuelven nombres de contrapartes, DNI, números de cuenta, bancos ni claves. La bandeja conserva datos normalizados mínimos, **no una copia íntegra del payload bancario**.

El hash del documento completo distingue duplicados por organización y origen. Una repetición idéntica se confirma sin duplicar. Un cambio de estado o contenido de la misma transacción se guarda como otro aviso. Esto no supone un identificador único de evento que el documento no proporciona. No se infiere un orden de estados a partir de `createdAt`, que describe creación de la transacción.

Si el evento autenticado es incompleto o desconocido, se guarda como pendiente y se responde 200. JSON inválido devuelve 400, tamaño excesivo 413 y falla de almacenamiento 503; en ese último caso no se simula un recibo exitoso. Dado que el archivo descarta reintentos, antes de publicar deben establecerse monitoreo y un mecanismo de recuperación/conciliación acordado con Global66. No existe una cola externa ni procesamiento en segundo plano: la normalización y el guardado local son acotados y no realizan llamadas remotas.

**Ningún aviso acredita saldo disponible ni modifica cuentas, movimientos o borradores.** El estado visible es el informado por el proveedor; su recepción no ejecuta un pago.

## Datos opcionales y discrepancias documentales

- Ningún esquema declara `required`: los faltantes quedan como desconocidos; un monto ausente no se convierte a cero.
- `originAmountUSD"` incluye una comilla literal; no se usa para calcular saldos ni convertir monedas.
- `originCountryCode` tiene longitud declarada de tres y un ejemplo de país de dos; el receptor no utiliza ese campo para enrutar ni impone una validación que descarte ese ejemplo.
- `REJETED` figura junto a `REJECTED`: se conserva literalmente y se señala para revisión, sin corregirlo automáticamente.
- `customerId` difiere de tipo entre eventos; la comparación opcional admite la representación textual equivalente, sin elegir otra cuenta.
- Debe confirmarse con Global66 un ejemplo real de ambos avisos, el contrato de cabeceras y cualquier corrección de estos campos antes de producción.

## Interfaz y permisos

La cuenta titular puede ver su bandeja en Finanzas. En demo puede generar avisos de ejemplo mediante botones explícitos: `POST /api/demo/financial-events`, con `event_type` de uno de los dos formatos; requiere sesión y CSRF, solo existe funcionalmente en modo demo y marca cada fila como **Simulación**.

`GET /api/financial-events` solo devuelve eventos propios. La consulta financiera delegada de la primera versión conserva su alcance anterior de saldos y movimientos: `notifications` es `null` cuando la fundación consulta una empresa. No amplía silenciosamente el permiso existente a una bandeja nueva.

Los avisos se separan de movimientos y de sus saldos; la interfaz no muestra un saldo simulado como actualizado por Global66.

## Qué falta para recibir eventos reales

Servidor HTTPS, cuentas y usuarios piloto separados, clave de webhook registrada por cada organización, permisos correspondientes, pruebas de entrega autorizadas, confirmación de los puntos documentales, monitoreo, respaldos y política de conservación. No se han registrado endpoints en Global66 ni realizado pruebas con cuentas reales.
