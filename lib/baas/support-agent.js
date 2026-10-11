/**
 * Agente de apoyo SICR3P (Grok-style FAQ + reglas).
 * Sin API externa: responde con conocimiento local de términos, rail y contacto.
 * Si hay XAI_API_KEY en el futuro, se puede enchufar aquí.
 */
import { BAAS_LEGAL } from './config.js';
import { LEGAL_UPDATED } from './legal-copy.js';

export const AGENT_NAME = 'SICR3P Apoyo';
export const AGENT_VERSION = '1.0';

const FAQS = [
  {
    keys: ['termino', 'término', 'condiciones', 'contrato', 'legal', 'banco', 'crédito', 'credito', 'prestamista'],
    answer:
      `SICR3P presta integración y desarrollo empresarial bajo la marca sicr3p/, operada por ${BAAS_LEGAL.razonSocial} (RUT ${BAAS_LEGAL.rut}). No es banco, portal de crédito ni prestamista. Los términos públicos están en /terminos (actualización ${LEGAL_UPDATED}). Para autorizar el uso: /autorizar.`,
  },
  {
    keys: ['privacidad', 'datos', 'gdpr', 'protección'],
    answer:
      'La política de privacidad está en /privacidad. Al autorizar en /autorizar aceptás el tratamiento de datos necesarios para integrar y operar los servicios sicr3p/.',
  },
  {
    keys: ['dlocal', 'payout', 'pago', 'plataform'],
    answer:
      'El rail de pagos usa dLocal Go (pay-in/payout) y, para onboarding de vendedores, dLocal for Platforms. Hay dos entornos: prueba (sandbox, DLOCAL_MODE=sandbox / DLOCAL_SANDBOX_*) y producción (live). Validá siempre en sandbox antes de live. Ops: /ops/config y /ops/onboarding. La autorización en /autorizar cubre la integración SICR3P completa, no solo dLocal.',
  },
  {
    keys: ['sandbox', 'prueba', 'test', 'entorno', 'sbx'],
    answer:
      'Entorno de prueba = sandbox dLocal. Variables: DLOCAL_MODE=sandbox (o prueba), DLOCAL_SANDBOX_API_KEY / SECRET, y DLOCAL_PLATFORMS_MODE=sandbox con DLOCAL_PLATFORMS_SANDBOX_*. Base Go: api-sbx.dlocalgo.com. En /autorizar podés registrar aceptación para “Prueba (sandbox)”. Estado: /ops/config o GET /api/baas/dlocal/entorno.',
  },
  {
    keys: ['correo', 'email', 'mail', 'ferozo', 'casilla'],
    answer:
      `Casilla operativa: ${BAAS_LEGAL.email}. Webmail DonWeb/Ferozo: https://ferozo.email (edward@sicr3p.cl). Si al apuntar el dominio al VPS se perdieron los MX, restaurá la plantilla de correo en Zona DNS sin borrar el A del VPS. Guía: docs/dns-vps-correo.md.`,
  },
  {
    keys: ['supabase', 'vps', 'servidor', 'studio'],
    answer:
      'Supabase self-hosted corre en el Cloud Server DonWeb. URL pública prevista: https://sicr3p.cl. Postgres solo en 127.0.0.1:5432 dentro del VPS. Estado en /ops/config.',
  },
  {
    keys: ['autoriz', 'acepta', 'firmar', 'consent'],
    answer:
      'Para dejar constancia de aceptación de términos e integración: abrí /autorizar, completá tus datos, marcá las casillas y enviá. Recibís un código AUT-….',
  },
  {
    keys: ['contacto', 'hablar', 'humano', 'soporte'],
    answer:
      `Podés escribir a ${BAAS_LEGAL.email} o usar /contacto. Yo soy el agente de apoyo sicr3p/: resuelvo dudas de términos, autorización y configuración básica.`,
  },
  {
    keys: ['fundacion', 'dueña', 'entretodos', 'spa'],
    answer:
      `Dueña de la iniciativa: ${BAAS_LEGAL.fundacion.razonSocial} (RUT ${BAAS_LEGAL.fundacion.rut}). Operadora: ${BAAS_LEGAL.razonSocial}. Detalle: /legal.`,
  },
];

export function responderSoporte(mensaje, { history = [] } = {}) {
  const text = String(mensaje || '').trim();
  if (!text) {
    return {
      agent: AGENT_NAME,
      reply: 'Escribí tu consulta sobre términos, autorización, correo o el rail sicr3p/.',
      matched: null,
    };
  }

  const lower = text.toLowerCase();
  const hit = FAQS.find((f) => f.keys.some((k) => lower.includes(k)));
  if (hit) {
    return { agent: AGENT_NAME, reply: hit.answer, matched: hit.keys[0] };
  }

  if (/hola|buenas|hey|saludos/.test(lower)) {
    return {
      agent: AGENT_NAME,
      reply:
        `Hola. Soy ${AGENT_NAME}. Puedo ayudarte con términos (/terminos), autorización (/autorizar), correo Ferozo y configuración del rail. ¿Qué necesitás?`,
      matched: 'greeting',
    };
  }

  const recent = history.filter((m) => m.rol === 'user').slice(-2).map((m) => m.contenido).join(' ');
  const combined = `${recent} ${lower}`;
  const hit2 = FAQS.find((f) => f.keys.some((k) => combined.includes(k)));
  if (hit2) {
    return { agent: AGENT_NAME, reply: hit2.answer, matched: hit2.keys[0] };
  }

  return {
    agent: AGENT_NAME,
    reply:
      `No tengo una respuesta cerrada para eso. Probá /autorizar (aceptar términos), /terminos, /ops/config o escribí a ${BAAS_LEGAL.email}. También podés preguntarme por: términos, privacidad, dLocal, correo, VPS, autorización.`,
    matched: null,
  };
}

export function sugerencias() {
  return [
    '¿Qué cubren los términos?',
    'Cómo autorizo la integración',
    'Entorno de prueba / sandbox dLocal',
    '¿SICR3P es un banco?',
  ];
}
