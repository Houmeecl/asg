# Programa Proveedor Regional — portal de prueba

Versión 0.2.0, con el contrato de notificaciones aportado por el usuario. Versión funcional para probar **dos modalidades con aislamiento**: operación propia de la fundación y espacio independiente para cada empresa participante. Interfaz en español y datos ficticios, preparada para mostrar el concepto a Global66 y a los participantes.

## Qué funciona en esta versión

- Inicio y cierre de sesión con credenciales de demostración; la organización se obtiene de la sesión del servidor, no de un selector enviado por el navegador.
- Panel, registro de empresas del programa, Pasaporte de muestra y requisitos. Los perfiles y documentos son ejemplos y **no constituyen verificaciones reales ni certificación ISO**.
- Agenda propia: crear y completar actividades.
- Saldos y movimientos ficticios, separados por organización.
- Borradores de pagos con validación de moneda y monto. **No se envían ni ejecutan pagos**, incluso si se configuran credenciales Global66.
- Empresa → fundación: permiso explícito para consultar saldos y movimientos por una o 24 horas; revocación y registro de actividades. Ninguna empresa accede a la cuenta de otra.
- Conector Global66 separado, exclusivamente de lectura, desactivado por defecto.
- Receptor autenticado adaptado a los dos formatos de `api-1 (3).json`: cambios de remesa y recepción de dinero. Persistencia mínima antes de HTTP 200, duplicados por organización y avisos incompletos para revisión.
- Bandeja propia de notificaciones y simulaciones explícitas en demo. Estos avisos no modifican saldos, no ejecutan pagos y no se comparten mediante los permisos anteriores.

El programa articula desarrollo de proveedores. Las empresas son titulares de sus cuentas; este portal no recibe ni custodia sus fondos. Las conversaciones con Global66 se tratan como una propuesta en desarrollo, sin usar logotipos que aparenten una alianza formalizada.

## Ejecutar localmente

Requiere Python 3.11 o posterior. Desde esta carpeta:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.lock.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8765
```

Abrir `http://127.0.0.1:8765`. La base demo se crea en `data/demo.sqlite3` al iniciar.

| Perfil demo | Correo | Contraseña local de ejemplo |
| --- | --- | --- |
| Fundación | fundacion@demo.local | DemoRegional2026! |
| Empresa 1 | empresa1@demo.local | DemoRegional2026! |
| Empresa 2 | empresa2@demo.local | DemoRegional2026! |

**Usar estos accesos solo en demostración local.** No publicar la demo con credenciales conocidas ni colocar datos reales en ella. La apertura directa del archivo HTML ofrece una vista previa simulada en el navegador; el aislamiento real se aplica al usar el servidor y sus sesiones. El modo de archivo no sustituye autenticación.

## Recorrido para comprobar accesos

1. Ingresar como fundación y abrir Finanzas. Sus cuentas son únicamente las propias. Intentar consultar una empresa muestra falta de permiso.
2. Ingresar como empresa 1. Comprobar su Pasaporte, movimientos y agenda. Crear una actividad y un borrador.
3. En Permisos, autorizar a la fundación por una hora. El permiso es solo para consultar; no permite pagos.
4. Volver a la fundación y consultar las finanzas autorizadas. Los borradores de pago de esa empresa no se comparten.
5. Volver a empresa 1 y revocar. Una nueva consulta desde la fundación vuelve a rechazarse. Una copia descargada durante el permiso no puede retirarse retroactivamente.
6. Empresa 2 conserva su espacio independiente durante todo el recorrido.

## Pruebas

```bash
python -m unittest discover -s tests -v
```

Las pruebas utilizan bases temporales y transporte simulado; no necesitan claves ni hacen operaciones reales en Global66.

## Integración real: siguiente etapa

Ver `docs/INTEGRACION_GLOBAL66.md` para el conector de lectura y `docs/CONTRATO_WEBHOOKS.md` para el archivo recibido y el receptor de avisos. No compartir secretos en el chat ni introducirlos en HTML o en el repositorio. Cada organización recibe un código interno inmutable y sus propias credenciales en variables de entorno del servidor. El archivo `.env.example` contiene solo nombres y valores vacíos; **la app no carga archivos .env automáticamente**.

La demo nunca consulta cuentas reales. Para evaluar el conector se requiere una instancia piloto separada, con `PR_MODE=pilot`, base propia, HTTPS y usuarios aprovisionados. Ejemplo para crear un operador sin poner su contraseña en la línea de comandos:

```bash
PR_MODE=pilot python -m app.manage create-organization --kind foundation --code FUNDACION --name 'Operación del programa' --email 'administracion@dominio.cl' --person 'Responsable autorizado'
```

La contraseña se solicita por entrada oculta. Para cada empresa se crea otra organización con `--kind company` y un código diferente. En piloto no se insertan usuarios ni datos demo. Las cookies de piloto requieren HTTPS. El conector hace lecturas solo cuando la organización titular lo solicita y el servidor las ha habilitado expresamente. El resultado se devuelve como instantánea separada: no se mezcla con saldos de demostración ni se presenta como una sincronización automática implantada.

## Límites antes de usar con clientes reales

Este es un MVP, no una plataforma financiera lista para producción. Antes de operar deben completarse: revisión de seguridad y permisos con datos reales autorizados, HTTPS y proxy de confianza, gestión de usuarios y recuperación de acceso, respaldos y restauración, política de datos y conservación, monitoreo y errores, pruebas contractuales con Global66 y habilitaciones por empresa. La edición de empresas, carga y verificación de documentos y la emisión real de Pasaportes todavía no están implementadas: el registro y la credencial sirven para visualizar el proceso.

No se ha desplegado, registrado un webhook en Global66 ni ejecutado un pago. El receptor rechaza callbacks reales en modo demo y permite únicamente las simulaciones del portal; los callbacks requieren una instancia piloto separada. La API de ejecución está bloqueada en el servidor. Las solicitudes de factoring y garantías no están integradas; requieren flujos y prestadores específicos. La agenda no envía recordatorios externos.

## Diseño de autorización

Sesiones opacas del servidor, cookies HttpOnly/SameSite, protección CSRF para escrituras, hash de contraseñas PBKDF2, consultas SQLite parametrizadas, permisos de lectura con vencimiento y recibos en el registro de actividad. La autorización temporal no amplía las facultades del titular ni autoriza acciones financieras. Una solicitud de pago futuro debe mostrar beneficiario, importe, moneda y costos reales antes de una aprobación específica; tal ejecución no está habilitada aquí.
