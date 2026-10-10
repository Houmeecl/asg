/** Textos legales reutilizables (web + docs). No es asesoría jurídica. */
import { BAAS_LEGAL } from './config.js';

export const LEGAL_UPDATED = '28 de marzo de 2026';

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
      <p><strong>sicr3p/</strong> es una plataforma tecnológica operada por {{razonSocial}} (RUT {{rut}}) que permite a empresas clientes:</p>
      <ul>
        <li>crear solicitudes de pago y códigos para cobro presencial;</li>
        <li>registrar beneficiarios y conciliar lotes operativos;</li>
        <li>emitir instrucciones de liquidación / payout hacia cuentas bancarias de terceros, ejecutadas por proveedores autorizados.</li>
      </ul>
      <p>SICR3P <strong>no</strong> es banco, no capta depósitos del público, no emite medios de pago con provisión de fondos a su nombre, no opera una billetera exigible frente al público y no liquida cobros de comercios ajenos a escala de sub-adquirencia.</p>
    `,
  },
  {
    id: 'proveedores',
    title: '2. Proveedores de cobro y payout',
    html: `
      <p>El cobro presencial lo ejecuta el adquirente <strong>TUU</strong> (InterApp en terminales autorizados SUNMI/KOZEN). El pay-in online (cuando aplique) y los payouts hacia cuentas bancarias los ejecuta <strong>dLocal Go</strong> desde el saldo merchant del comercio SICR3P.</p>
      <p>SICR3P provee software, mandato del cliente y conciliación. Los fondos del público no se custodian en una “cuenta sicr3p/” ni como saldo exigible emitido por SICR3P.</p>
    `,
  },
  {
    id: 'flujo',
    title: '3. Flujo operativo descrito',
    html: `
      <ol>
        <li>La empresa crea una solicitud en el portal y obtiene un código.</li>
        <li>El cobro se realiza en POS TUU o, en flujos online/turista, vía checkout / link de dLocal Go.</li>
        <li>Los abonos llegan a la cuenta bancaria (treasury) de {{razonSocial}} en su calidad de comercio.</li>
        <li>Operaciones cierra lote y fondea el saldo merchant dLocal Go.</li>
        <li>El software libera FIFO mediante <code>POST /v1/payouts</code> (u equivalente) hacia la cuenta del beneficiario.</li>
        <li>El panel refleja estados: pendiente, cobrada, en lote, enviada, pagada o rechazada.</li>
      </ol>
    `,
  },
  {
    id: 'saldo',
    title: '4. Saldo mostrado en el panel',
    html: `
      <p>Las métricas de “saldo disponible”, “saldo merchant” u otras similares se refieren al <strong>saldo merchant / operativo</strong> (p. ej. dLocal Go o conciliación interna), no a dinero exigible del público ni a una cuenta bancaria de clientes a nombre de SICR3P.</p>
    `,
  },
  {
    id: 'tarjeta',
    title: '5. Tarjeta / prepago',
    html: `
      <p>Cualquier tarjeta prepago física o emisión de medio de pago solo se ofrecerá con un <strong>emisor regulado</strong> y contrato aparte. La “tarjeta virtual” o wallet del panel es un identificador operativo interno y <strong>no</strong> constituye medio de pago con provisión de fondos emitido por SICR3P.</p>
    `,
  },
  {
    id: 'contratacion',
    title: '6. Contratación y servicio personalizado',
    html: `
      <p>El acceso al portal se otorga a usuarios habilitados por la empresa cliente. Condiciones comerciales (corredores de payout, terminales POS, volumen, SLA) se acuerdan por escrito u orden de servicio. El servicio es de naturaleza tecnológica / B2B y puede incluir parámetros personalizados de lote y roles.</p>
    `,
  },
  {
    id: 'obligaciones',
    title: '7. Obligaciones del cliente',
    html: `
      <p>El cliente garantiza la veracidad de datos de beneficiarios (documento, banco, cuenta), el origen lícito de los fondos y el cumplimiento de obligaciones tributarias y de prevención de lavado aplicables a su actividad. SICR3P puede suspender operaciones ante indicios de fraude, datos inconsistentes o incumplimiento contractual.</p>
    `,
  },
  {
    id: 'limitacion',
    title: '8. Limitación de responsabilidad',
    html: `
      <p>SICR3P no garantiza tiempos de acreditación de terceros (bancos, TUU, dLocal Go). No responde por rechazos del emisor de la tarjeta, datos bancarios incorrectos del beneficiario, cortes de red del terminal ni decisiones de compliance de los proveedores de pago.</p>
    `,
  },
  {
    id: 'propiedad',
    title: '9. Propiedad intelectual y uso aceptable',
    html: `
      <p>El software, marcas y documentación de sicr3p/ pertenecen a {{razonSocial}} o sus licenciantes. Queda prohibido el uso del panel para actividades ilícitas, eludir controles KYC/AML de terceros o suplantar identidades.</p>
    `,
  },
  {
    id: 'datos',
    title: '10. Datos personales',
    html: `
      <p>El tratamiento de datos se rige por la <a href="/privacidad">Política de privacidad</a>. El envío del formulario de contacto implica aceptar dicho tratamiento para responder la consulta.</p>
    `,
  },
  {
    id: 'ley',
    title: '11. Ley aplicable',
    html: `
      <p>Estos términos se rigen por las leyes de la República de Chile. Para controversias, las partes se someten a los tribunales competentes de {{direccion}}, sin perjuicio de normas imperativas de protección al consumidor cuando apliquen.</p>
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
        <li>Usuarios del panel: nombre, email, rol, registros de acceso.</li>
        <li>Formulario de contacto: nombre, email, mensaje.</li>
        <li>Beneficiarios e instrucciones de payout: documento, banco, cuenta, país.</li>
        <li>Identificadores de operaciones, lotes y (cuando aplique) tokens de registro KYC / wallet virtual operativa.</li>
      </ul>
    `,
  },
  {
    id: 'finalidad',
    title: '3. Finalidad',
    html: `
      <p>Prestar el servicio tecnológico, autenticar accesos, conciliar cobros TUU y payouts dLocal Go, responder contactos comerciales y cumplir obligaciones legales aplicables. No vendemos datos personales.</p>
    `,
  },
  {
    id: 'encargados',
    title: '4. Encargados y proveedores',
    html: `
      <p>Datos necesarios para cobro y liquidación pueden tratarse por <strong>TUU</strong> y <strong>dLocal Go</strong> conforme a sus políticas y al contrato merchant. Los leads del formulario de contacto pueden sincronizarse con <strong>HubSpot</strong> (CRM) cuando esté configurado. También pueden intervenir proveedores de hosting e infraestructura técnica.</p>
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
      <p>Aplicamos medidas técnicas y organizativas razonables (control de acceso al panel, sesiones firmadas, minimización de datos en demos). Ningún sistema es 100 % invulnerable; notificaremos incidentes relevantes según la ley aplicable.</p>
    `,
  },
  {
    id: 'cookies',
    title: '7. Cookies y sesión',
    html: `
      <p>Usamos cookie de sesión httpOnly para autenticar el panel. No utilizamos redes publicitarias de terceros en este sitio. Puedes cerrar sesión en cualquier momento desde el panel.</p>
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
