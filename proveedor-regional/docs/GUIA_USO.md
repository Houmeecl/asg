# Cómo revisar la demostración

## Para explorar sin instalar

Descarga `Portal_Proveedor_Regional_Demo.html` y ábrelo en tu navegador. La vista previa contiene datos ficticios y simula los tres espacios. No necesita una clave de Global66 y no se conecta a ninguna cuenta. La simulación vive en esa pestaña: al cerrar o recargar se reinicia.

El selector de cuentas existe para presentar la demo. En el sistema con servidor cada acceso usa su propia sesión y el servidor controla la separación.

## Qué recorrer

1. **Fundación:** Resumen y Empresas muestran el registro del programa; Finanzas muestra únicamente su operación propia. Ver una empresa en el registro no concede acceso a sus finanzas.
2. **Empresa:** Resumen, Pasaporte y Agenda muestran su propio espacio. Los documentos y perfiles son ejemplos, sin verificación real.
3. **Permisos y actividad:** la empresa puede compartir saldos y movimientos con la fundación durante una o 24 horas. Puede revocar el acceso. El permiso no autoriza transferencias.
4. **Finanzas:** los datos se identifican como simulados. Es posible preparar un borrador que no se envía ni ejecuta.
5. **Notificaciones en Finanzas:** simula una recepción o un cambio de estado de remesa. Cada fila indica su fuente y no cambia el saldo. La bandeja corresponde únicamente al titular.
6. **Agenda:** crear una actividad con fecha y marcarla completada.

## Para probar con servidor

El archivo README explica cómo instalar y ejecutar el sistema. En esta modalidad, la base SQLite guarda tareas, borradores, permisos y actividad y el aislamiento se aplica en el backend. Se incluyen tres accesos ficticios; no publicar esta demo abierta ni usar datos reales con esas contraseñas.

## Conectar Global66 después

Se requiere configurar por separado la fundación y cada empresa, con sus propias autorizaciones y secretos en el servidor. La clave no se introduce en la página ni se manda por chat. La integración creada permite únicamente lectura y todavía no se ha probado con cuentas reales. La demo bloquea expresamente las consultas reales y la ejecución de pagos.

Esta versión sirve para revisar el concepto, la experiencia de acceso y la estructura de integración. No incluye emisión real de Pasaportes, carga de documentos, contratación de factoring o garantías, ni notificaciones externas de agenda.
