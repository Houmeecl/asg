/**
 * Textos legales públicos (web). Solo nombran sicr3p/ / SICR3P SpA.
 * No citar marcas de terceros (adquirentes, procesadores, CRM) en estas páginas.
 * No es asesoría jurídica.
 */
import { BAAS_LEGAL } from './config.js';

export const LEGAL_UPDATED = '10 de octubre de 2026';

export function legalMeta() {
  return {
    razonSocial: BAAS_LEGAL.razonSocial,
    rut: BAAS_LEGAL.rut,
    email: BAAS_LEGAL.email,
    telefono: BAAS_LEGAL.telefono,
    direccion: BAAS_LEGAL.direccion,
    updated: LEGAL_UPDATED,
  };
}

export const TERMINOS_SECTIONS = [
  {
    id: 'naturaleza',
    title: '1. Naturaleza del servicio',
    html: `
      <p><strong>sicr3p/</strong> es la plataforma tecnológica de {{razonSocial}} (RUT {{rut}}, nombre de fantasía sicr3p spa) que permite a empresas clientes:</p>
      <ul>
        <li>crear solicitudes de pago y códigos para cobro presencial;</li>
        <li>registrar beneficiarios y conciliar lotes operativos;</li>
        <li>emitir instrucciones de liquidación hacia cuentas bancarias de terceros, ejecutadas mediante canales de pago habilitados por sicr3p/.</li>
      </ul>
      <p>{{razonSocial}} <strong>no</strong> es banco, no capta depósitos del público, no emite medios de pago con provisión de fondos a su nombre, no opera una billetera exigible frente al público y no liquida cobros de comercios ajenos a escala de sub-adquirencia.</p>
    `,
  },
  {
    id: 'ejecucion',
    title: '2. Ejecución de cobros y liquidaciones',
    html: `
      <p>El cobro presencial y la liquidación / envío de fondos se realizan a través de la infraestructura tecnológica y comercial de <strong>sicr3p/</strong>, incluyendo terminales de punto de venta, links de pago y canales de liquidación que la Sociedad habilite para cada cliente.</p>
      <p>sicr3p/ provee el software, el mandato del cliente y la conciliación operativa. Los fondos del público no se custodian en una “cuenta sicr3p/” ni como saldo exigible emitido por {{razonSocial}}.</p>
    `,
  },
  {
    id: 'flujo',
    title: '3. Flujo operativo',
    html: `
      <ol>
        <li>La empresa crea una solicitud en el portal sicr3p/ y obtiene un código o enlace de pago.</li>
        <li>El cobro se realiza en punto de venta o mediante link / checkout online habilitado por sicr3p/.</li>
        <li>Los abonos se consolidan en la tesorería de {{razonSocial}} en su calidad de comercio / operador del servicio contratado.</li>
        <li>Operaciones cierra lotes y libera instrucciones de liquidación en orden FIFO hacia la cuenta del beneficiario.</li>
        <li>El panel refleja estados: pendiente, cobrada, en lote, enviada, pagada o rechazada.</li>
      </ol>
    `,
  },
  {
    id: 'saldo',
    title: '4. Saldo mostrado en el panel',
    html: `
      <p>Las métricas de “saldo disponible” u otras similares se refieren al <strong>saldo operativo</strong> de la plataforma sicr3p/ (conciliación interna y canales de liquidación habilitados), no a dinero exigible del público ni a una cuenta bancaria de clientes a nombre de {{razonSocial}}.</p>
    `,
  },
  {
    id: 'tarjeta',
    title: '5. Tarjeta / prepago',
    html: `
      <p>Cualquier tarjeta prepago física o emisión de medio de pago solo se ofrecerá con un <strong>emisor regulado</strong> y contrato aparte. La “tarjeta virtual” o wallet del panel es un identificador operativo interno de sicr3p/ y <strong>no</strong> constituye medio de pago con provisión de fondos emitido por {{razonSocial}}.</p>
    `,
  },
  {
    id: 'contratacion',
    title: '6. Contratación y servicio personalizado',
    html: `
      <p>El acceso al portal se otorga a usuarios habilitados por la empresa cliente. Condiciones comerciales (corredores de liquidación, terminales, volumen, SLA) se acuerdan por escrito u orden de servicio con {{razonSocial}}. El servicio es de naturaleza tecnológica / B2B y puede incluir parámetros personalizados de lote y roles.</p>
    `,
  },
  {
    id: 'obligaciones',
    title: '7. Obligaciones del cliente',
    html: `
      <p>El cliente garantiza la veracidad de datos de beneficiarios (documento, banco, cuenta), el origen lícito de los fondos y el cumplimiento de obligaciones tributarias y de prevención de lavado aplicables a su actividad. {{razonSocial}} puede suspender operaciones ante indicios de fraude, datos inconsistentes o incumplimiento contractual.</p>
    `,
  },
  {
    id: 'limitacion',
    title: '8. Limitación de responsabilidad',
    html: `
      <p>{{razonSocial}} no garantiza tiempos de acreditación de terceros (bancos u otros participantes de la cadena de pago). No responde por rechazos del emisor de la tarjeta, datos bancarios incorrectos del beneficiario, cortes de red del terminal ni decisiones de compliance ajenas a sicr3p/.</p>
    `,
  },
  {
    id: 'propiedad',
    title: '9. Propiedad intelectual y uso aceptable',
    html: `
      <p>El software, marcas y documentación de sicr3p/ pertenecen a {{razonSocial}} o sus licenciantes. Queda prohibido el uso del panel para actividades ilícitas, eludir controles de identificación o suplantar identidades.</p>
    `,
  },
  {
    id: 'datos',
    title: '10. Datos personales',
    html: `
      <p>El tratamiento de datos se rige por la <a href="/privacidad">Política de privacidad</a> de sicr3p/. El envío del formulario de contacto implica aceptar dicho tratamiento para responder la consulta.</p>
    `,
  },
  {
    id: 'ley',
    title: '11. Ley aplicable',
    html: `
      <p>Estos términos se rigen por las leyes de la República de Chile. Para controversias entre {{razonSocial}} y el cliente, las partes se someten a los tribunales competentes de Antofagasta, sin perjuicio de normas imperativas de protección al consumidor cuando apliquen.</p>
    `,
  },
  {
    id: 'contacto',
    title: '12. Contacto',
    html: `
      <p>Consultas: <a href="mailto:{{email}}">{{email}}</a> · <a href="tel:{{telefono}}">{{telefono}}</a> · <a href="/contacto">formulario web</a> · {{direccion}}.</p>
    `,
  },
];

export const PRIVACIDAD_SECTIONS = [
  {
    id: 'responsable',
    title: '1. Responsable',
    html: `<p>{{razonSocial}}, RUT {{rut}}, {{direccion}}. Contacto: <a href="mailto:{{email}}">{{email}}</a> · {{telefono}}.</p>`,
  },
  {
    id: 'datos',
    title: '2. Datos que tratamos',
    html: `
      <ul>
        <li>Usuarios del panel sicr3p/: nombre, email, rol, registros de acceso.</li>
        <li>Formulario de contacto: nombre, email, mensaje.</li>
        <li>Beneficiarios e instrucciones de liquidación: documento, banco, cuenta, país.</li>
        <li>Identificadores de operaciones, lotes y (cuando aplique) registros de identidad / wallet virtual operativa.</li>
      </ul>
    `,
  },
  {
    id: 'finalidad',
    title: '3. Finalidad',
    html: `
      <p>Prestar el servicio tecnológico sicr3p/, autenticar accesos, conciliar cobros y liquidaciones, responder contactos comerciales y cumplir obligaciones legales aplicables. No vendemos datos personales.</p>
    `,
  },
  {
    id: 'encargados',
    title: '4. Encargados y proveedores',
    html: `
      <p>Para operar cobros, liquidaciones, hosting o CRM, {{razonSocial}} puede recurrir a proveedores técnicos y de infraestructura bajo contrato. Dichos encargados tratan datos solo conforme a instrucciones de sicr3p/ y a la ley aplicable. El detalle de marcas de terceros no forma parte de estos términos públicos.</p>
    `,
  },
  {
    id: 'conservacion',
    title: '5. Conservación y derechos',
    html: `
      <p>Conservamos los datos el tiempo necesario para la operación, auditorías y exigencias legales. Para ejercer acceso, rectificación, cancelación u oposición (cuando proceda), escribe a <a href="mailto:{{email}}">{{email}}</a>.</p>
    `,
  },
  {
    id: 'seguridad',
    title: '6. Seguridad',
    html: `
      <p>Aplicamos medidas técnicas y organizativas razonables (control de acceso al panel, sesiones firmadas, minimización de datos). Ningún sistema es 100 % invulnerable; notificaremos incidentes relevantes según la ley aplicable.</p>
    `,
  },
  {
    id: 'cookies',
    title: '7. Cookies y sesión',
    html: `
      <p>Usamos cookie de sesión httpOnly para autenticar el panel sicr3p/. No utilizamos redes publicitarias de terceros en este sitio. Puedes cerrar sesión en cualquier momento desde el panel.</p>
    `,
  },
];

export function fillLegal(html, meta = legalMeta()) {
  return html
    .replaceAll('{{razonSocial}}', meta.razonSocial)
    .replaceAll('{{rut}}', meta.rut)
    .replaceAll('{{email}}', meta.email)
    .replaceAll('{{telefono}}', meta.telefono)
    .replaceAll('{{direccion}}', meta.direccion);
}
