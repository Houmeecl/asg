/**
 * Textos legales públicos (web). Solo nombran sicr3p/ / SICR3P SpA / Fundación Entretodos / Proveedor Regional.
 * No citar marcas de terceros (adquirentes, procesadores, CRM) en estas páginas.
 * No es asesoría jurídica.
 */
import { BAAS_LEGAL } from './config.js';

export const LEGAL_UPDATED = '9 de octubre de 2026';

export function legalMeta() {
  return {
    razonSocial: BAAS_LEGAL.razonSocial,
    rut: BAAS_LEGAL.rut,
    email: BAAS_LEGAL.email,
    telefono: BAAS_LEGAL.telefono,
    direccion: BAAS_LEGAL.direccion,
    fundacionRazon: BAAS_LEGAL.fundacion.razonSocial,
    fundacionRut: BAAS_LEGAL.fundacion.rut,
    fundacionDireccion: BAAS_LEGAL.fundacion.direccion,
    updated: LEGAL_UPDATED,
  };
}

/**
 * Términos: SICR3P = integración y desarrollo empresarial.
 * No portal de crédito, banco ni prestamista. Separación CMF / Fintec explícita.
 */
export const TERMINOS_SECTIONS = [
  {
    id: 'identificacion',
    title: '1. Identificación',
    html: `
      <p>Los presentes Términos y Condiciones regulan el acceso, navegación, contratación y utilización de los servicios ofrecidos bajo la marca <strong>SICR3P</strong> (sicr3p/), una iniciativa vinculada al ecosistema de <strong>Proveedor Regional</strong>.</p>
      <p><strong>Prestador del servicio (operadora):</strong> {{razonSocial}}<br />
      <strong>RUT:</strong> {{rut}}<br />
      <strong>Domicilio:</strong> {{direccion}}<br />
      <strong>Correo electrónico:</strong> <a href="mailto:{{email}}">{{email}}</a><br />
      <strong>Teléfono:</strong> <a href="tel:{{telefono}}">{{telefono}}</a><br />
      <strong>Ciudad:</strong> Antofagasta, Chile.</p>
      <p><strong>Dueña de la marca / iniciativa:</strong> {{fundacionRazon}} (RUT {{fundacionRut}}). {{razonSocial}} actúa como operadora y administradora de los servicios sicr3p/. Son personas jurídicas distintas.</p>
      <p>En adelante, “SICR3P” o “sicr3p/” designa los servicios y soluciones ofrecidos bajo dicha marca, y “Usuario” o “Cliente” a la persona natural o jurídica que acceda, solicite o contrate dichos servicios.</p>
    `,
  },
  {
    id: 'que-es',
    title: '2. ¿Qué es SICR3P?',
    html: `
      <p><strong>SICR3P es una solución de integración y acercamiento empresarial orientada al fortalecimiento de empresas y PYMEs.</strong></p>
      <p>Su propósito es integrar capacidades, herramientas, oportunidades y soluciones que contribuyan al desarrollo empresarial y permitan acercar a las empresas a alternativas disponibles dentro de un ecosistema de proveedores y entidades especializadas.</p>
      <p>SICR3P puede contemplar ámbitos como:</p>
      <ul>
        <li>desarrollo empresarial;</li>
        <li>fortalecimiento de capacidades;</li>
        <li>digitalización;</li>
        <li>sostenibilidad;</li>
        <li>soluciones operativas;</li>
        <li>medios y herramientas de pago (como software / mandato, no como banco);</li>
        <li>oportunidades comerciales;</li>
        <li>preparación financiera;</li>
        <li>acceso a información sobre alternativas financieras;</li>
        <li>vinculación con proveedores especializados;</li>
        <li>finanzas sostenibles;</li>
        <li>programas y servicios empresariales.</li>
      </ul>
      <p>La disponibilidad de cada solución puede variar según sus características, proveedor, territorio, programa, criterios de elegibilidad y condiciones particulares.</p>
    `,
  },
  {
    id: 'proveedor-regional',
    title: '3. Relación entre Proveedor Regional y SICR3P',
    html: `
      <p><strong>Proveedor Regional</strong> actúa como articulador principal del ecosistema empresarial, promoviendo la vinculación entre empresas, instituciones, programas, oportunidades y proveedores de soluciones.</p>
      <p><strong>SICR3P</strong> cumple una función de integración y acercamiento de soluciones, permitiendo estructurar necesidades, facilitar procesos de desarrollo empresarial y conectar a las empresas con herramientas y servicios pertinentes.</p>
      <blockquote><p><strong>Proveedor Regional articula el ecosistema. SICR3P integra y acerca soluciones.</strong></p></blockquote>
    `,
  },
  {
    id: 'naturaleza',
    title: '4. Naturaleza del servicio',
    html: `
      <p>SICR3P <strong>no constituye por sí mismo una institución bancaria, compañía de seguros, entidad de leasing, administradora de fondos ni entidad otorgante de créditos</strong>, salvo que en el futuro una actividad determinada sea realizada directamente por una entidad debidamente habilitada para ello y sea informada expresamente al Cliente.</p>
      <p>SICR3P <strong>no es un portal de crédito ni un prestamista</strong>. No capta depósitos del público, no emite medios de pago con provisión de fondos a su nombre y no opera una billetera exigible frente al público.</p>
      <p>Cuando SICR3P presente, facilite o acerque soluciones proporcionadas por terceros especializados, la relación contractual correspondiente al producto será celebrada directamente entre el Cliente y el proveedor respectivo, cuando así corresponda.</p>
      <p>La CMF incluye dentro del perímetro de la Ley Fintec, entre otras actividades, las plataformas de financiamiento colectivo y la asesoría crediticia (evaluaciones o recomendaciones sobre capacidad o probabilidad de pago para obtener, modificar o renegociar financiamiento). Por esa razón, el alcance concreto de cualquier futura funcionalidad financiera deberá respetar la legislación y regulación que resulte aplicable, y no se ofrecerá como asesoría crediticia regulada salvo habilitación expresa e información al Cliente.</p>
    `,
  },
  {
    id: 'finanzas-sostenibles',
    title: '5. Finanzas sostenibles integradas',
    html: `
      <p>SICR3P promueve un enfoque que integra <strong>desarrollo empresarial y acceso a soluciones financieras sostenibles</strong>.</p>
      <p>Dependiendo de las soluciones disponibles, esto podrá comprender el <em>acercamiento informativo</em> a alternativas relacionadas con microfinanciamiento, capital de trabajo, factoring, financiamiento productivo, eficiencia y sostenibilidad, leasing, seguros, medios de pago u otras soluciones empresariales.</p>
      <p>La inclusión de una categoría en el sitio web <strong>no significa que SICR3P otorgue directamente dicho producto ni garantiza su disponibilidad</strong>.</p>
      <p>Cuando una solución sea proporcionada por un tercero, dicho tercero será responsable de determinar sus condiciones, requisitos, evaluación, aprobación y contratación.</p>
    `,
  },
  {
    id: 'contratacion',
    title: '6. Solicitud y contratación de servicios',
    html: `
      <p>Los servicios directamente prestados por SICR3P (integración, desarrollo empresarial, software y mandato operativo) podrán solicitarse mediante los canales habilitados en el sitio web, formularios de contacto, canales comerciales o mecanismos indicados para cada servicio.</p>
      <p>Cuando corresponda realizar un pago, antes de contratar se informará al Cliente, según aplique: descripción del servicio, alcance, precio, impuestos aplicables, modalidad de prestación, condiciones particulares, vigencia y forma de pago.</p>
      <p>La aceptación de una solicitud podrá estar sujeta a disponibilidad y a las condiciones particulares informadas para el servicio correspondiente.</p>
    `,
  },
  {
    id: 'personalizados',
    title: '7. Servicios personalizados',
    html: `
      <p>Determinados servicios de desarrollo empresarial podrán ser personalizados de acuerdo con las características y necesidades de cada empresa.</p>
      <p>El alcance, actividades, condiciones y precio se comunicarán antes de su contratación. Cuando exista una propuesta, orden de servicio, convenio o contrato específico, sus condiciones particulares complementarán los presentes Términos y Condiciones.</p>
    `,
  },
  {
    id: 'terceros',
    title: '8. Soluciones proporcionadas por terceros',
    html: `
      <p>SICR3P podrá acercar o facilitar el acceso a soluciones proporcionadas por entidades externas.</p>
      <blockquote><p><strong>La evaluación, elegibilidad, aprobación, contratación, precio, tasas, comisiones, coberturas, plazos y demás condiciones del producto serán determinadas por el proveedor responsable de la solución.</strong></p></blockquote>
      <p>SICR3P no garantiza la aprobación de financiamiento, seguros, leasing, medios de pago u otros productos sujetos a evaluación de terceros.</p>
      <p>La información presentada sobre estas soluciones tendrá carácter informativo hasta que las condiciones definitivas sean comunicadas por el proveedor correspondiente.</p>
    `,
  },
  {
    id: 'pagos',
    title: '9. Pagos',
    html: `
      <p>Cuando un servicio de SICR3P requiera pago, el Cliente podrá utilizar los medios de pago habilitados e informados durante el proceso de contratación.</p>
      <p>El precio total y las condiciones de pago serán informados antes de completar la transacción, conforme a la información comercial que SERNAC exige a las empresas en comercio electrónico.</p>
    `,
  },
  {
    id: 'retracto',
    title: '10. Derecho a retracto y cancelaciones',
    html: `
      <p>Los derechos que correspondan al Cliente se ejercerán conforme a la legislación chilena aplicable y a la naturaleza particular del servicio contratado.</p>
      <p>En contratos a distancia, la normativa de protección al consumidor contempla derecho a retracto dentro de los <strong>10 días</strong> posteriores a la contratación de un servicio, sujeto a las disposiciones legales aplicables y a las exclusiones que, de existir, serán expresamente informadas.</p>
      <p>Cada servicio podrá establecer condiciones particulares de cancelación, reprogramación o modificación, informadas antes de su contratación.</p>
    `,
  },
  {
    id: 'informacion-cliente',
    title: '11. Información proporcionada por el Cliente',
    html: `
      <p>El Cliente se compromete a proporcionar información verdadera, completa, actualizada y pertinente para la prestación del servicio.</p>
      <p>En determinados procesos podrá solicitarse documentación para identificar a la empresa, comprender sus necesidades o gestionar una derivación autorizada.</p>
      <p>El envío de antecedentes falsos, alterados o pertenecientes a terceros sin autorización podrá justificar la suspensión del proceso correspondiente.</p>
    `,
  },
  {
    id: 'datos',
    title: '12. Datos personales',
    html: `
      <p>Los datos personales entregados a través del sitio web serán tratados para finalidades relacionadas con la atención de solicitudes, prestación de servicios, gestión de contactos, operación de programas y demás finalidades informadas al titular, conforme a la legislación chilena sobre protección de datos personales.</p>
      <p>El detalle sobre recopilación, utilización, almacenamiento, comunicación y derechos asociados se desarrolla en la <a href="/privacidad">Política de Privacidad de SICR3P</a>.</p>
    `,
  },
  {
    id: 'derivaciones',
    title: '13. Comunicaciones y derivaciones',
    html: `
      <p>Cuando una empresa solicite conocer o acceder a una solución proporcionada por un tercero, SICR3P podrá requerir las autorizaciones necesarias antes de comunicar antecedentes a dicho proveedor.</p>
      <p>La entrega de información a un tercero no implica aprobación automática del servicio solicitado.</p>
    `,
  },
  {
    id: 'propiedad',
    title: '14. Propiedad intelectual',
    html: `
      <p>La marca SICR3P, identidad gráfica, contenidos propios, documentos, metodologías, diseños, textos y demás elementos protegibles son propiedad de sus respectivos titulares (incluida {{fundacionRazon}} como dueña de la iniciativa y {{razonSocial}} como operadora, según corresponda).</p>
      <p>El acceso al sitio web no concede al Usuario derechos de propiedad sobre dichos elementos. No podrán reproducirse, distribuirse o utilizarse comercialmente sin autorización cuando ésta sea jurídicamente necesaria.</p>
    `,
  },
  {
    id: 'uso',
    title: '15. Uso adecuado del sitio',
    html: `
      <p>El Usuario se compromete a utilizar el sitio y sus canales de manera lícita. No está permitido:</p>
      <ul>
        <li>ingresar información falsa deliberadamente;</li>
        <li>intentar vulnerar la seguridad del sitio;</li>
        <li>utilizar formularios para actividades fraudulentas;</li>
        <li>hacerse pasar por otra persona o empresa;</li>
        <li>interferir deliberadamente con el funcionamiento de los servicios.</li>
      </ul>
    `,
  },
  {
    id: 'disponibilidad',
    title: '16. Disponibilidad',
    html: `
      <p>SICR3P podrá realizar mejoras, mantenimiento o modificaciones en sus canales y servicios.</p>
      <p>La descripción y disponibilidad de soluciones podrá actualizarse cuando cambien las condiciones operativas o la oferta disponible. Una solución mostrada en el sitio no implica necesariamente disponibilidad permanente.</p>
    `,
  },
  {
    id: 'responsabilidad-terceros',
    title: '17. Responsabilidad respecto de terceros',
    html: `
      <p>Los productos y servicios entregados directamente por terceros se regirán además por sus propios contratos, términos y políticas.</p>
      <p>{{razonSocial}} será responsable de sus propias obligaciones y actividades conforme a la legislación aplicable, pero no asumirá aquellas que legal o contractualmente correspondan exclusivamente a un proveedor independiente.</p>
    `,
  },
  {
    id: 'modificaciones',
    title: '18. Modificaciones',
    html: `
      <p>Estos Términos y Condiciones podrán actualizarse cuando cambien los servicios, procesos o requisitos legales aplicables.</p>
      <p>La versión vigente estará disponible públicamente en el sitio web, indicando su fecha de actualización. Las modificaciones no afectarán retroactivamente derechos adquiridos bajo contratos previamente celebrados cuando ello no corresponda legalmente.</p>
    `,
  },
  {
    id: 'ley',
    title: '19. Legislación aplicable',
    html: `
      <p>Los presentes Términos y Condiciones se interpretarán conforme a la legislación de la República de Chile.</p>
      <p>Los derechos irrenunciables que la legislación reconozca a consumidores y usuarios no se entenderán limitados por estos términos.</p>
      <p>Las empresas deben cumplir las condiciones ofrecidas y proporcionar información comercial oportuna y verdadera, conforme a las directrices de SERNAC y a la normativa aplicable.</p>
    `,
  },
  {
    id: 'contacto',
    title: '20. Contacto',
    html: `
      <p>Para consultas relacionadas con estos Términos y Condiciones, servicios contratados o atención general:</p>
      <p><strong>{{razonSocial}}</strong><br />
      RUT: {{rut}}<br />
      SICR3P | Una iniciativa de Proveedor Regional<br />
      Dirección: {{direccion}}<br />
      Antofagasta, Chile<br />
      Correo: <a href="mailto:{{email}}">{{email}}</a><br />
      Teléfono: <a href="tel:{{telefono}}">{{telefono}}</a><br />
      Sitio web: <a href="/">sicr3p/</a> · <a href="/contacto">Contacto</a> · <a href="/legal">Datos de la sociedad</a></p>
    `,
  },
];

export const PRIVACIDAD_SECTIONS = [
  {
    id: 'responsable',
    title: '1. Responsable',
    html: `<p>{{razonSocial}}, RUT {{rut}}, {{direccion}}. Contacto: <a href="mailto:{{email}}">{{email}}</a> · {{telefono}}. Dueña de la iniciativa: {{fundacionRazon}} (RUT {{fundacionRut}}).</p>`,
  },
  {
    id: 'datos',
    title: '2. Datos que tratamos',
    html: `
      <ul>
        <li>Usuarios del panel sicr3p/: nombre, email, rol, registros de acceso.</li>
        <li>Formulario de contacto: nombre, email, mensaje.</li>
        <li>Cuando el Cliente use servicios operativos: beneficiarios e instrucciones de liquidación (documento, banco, cuenta, país) y registros necesarios para conciliación.</li>
        <li>Identificadores de operaciones, lotes y (cuando aplique) registros de identidad / wallet virtual operativa interna.</li>
      </ul>
    `,
  },
  {
    id: 'finalidad',
    title: '3. Finalidad',
    html: `
      <p>Prestar servicios de integración y desarrollo empresarial de sicr3p/, autenticar accesos, gestionar contactos comerciales, operar programas y, cuando el Cliente lo contrate, conciliar cobros e instrucciones de liquidación bajo mandato. Cumplir obligaciones legales aplicables. No vendemos datos personales.</p>
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

/** Texto corto para footer / landing. */
export const FOOTER_DISCLAIMER = `SICR3P integra desarrollo empresarial y acerca soluciones para el crecimiento sostenible de las empresas. Las soluciones financieras ofrecidas por terceros están sujetas a sus condiciones, evaluación y criterios de elegibilidad. SICR3P no garantiza su aprobación.`;

export function fillLegal(html, meta = legalMeta()) {
  return html
    .replaceAll('{{razonSocial}}', meta.razonSocial)
    .replaceAll('{{rut}}', meta.rut)
    .replaceAll('{{email}}', meta.email)
    .replaceAll('{{telefono}}', meta.telefono)
    .replaceAll('{{direccion}}', meta.direccion)
    .replaceAll('{{fundacionRazon}}', meta.fundacionRazon)
    .replaceAll('{{fundacionRut}}', meta.fundacionRut)
    .replaceAll('{{fundacionDireccion}}', meta.fundacionDireccion);
}
