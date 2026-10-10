import { OB_SCOPES } from './open-banking.js';

const BASE = '/api/open-banking/v1';

/** OpenAPI 3.0 de la infraestructura AIS/PIS. Estándares abiertos, sin protocolo propietario. */
export function openBankingOpenApi() {
  return {
    openapi: '3.0.3',
    info: {
      title: 'sicr3p/ Open Banking',
      version: '1.0.0',
      description:
        'Infraestructura AIS/PIS sobre estándares abiertos: OAuth 2.0 (RFC 6749), introspección (RFC 7662), sobre OpenAPI y recursos tipo UK Open Banking (Data/Consent/Payment). Software y mandato para empresas. No es banco ni custodia fondos del público.',
      license: { name: 'Implementación propia sobre especificaciones abiertas' },
    },
    servers: [{ url: BASE }],
    tags: [
      { name: 'oauth', description: 'OAuth 2.0 client credentials' },
      { name: 'ais', description: 'Account Information' },
      { name: 'pis', description: 'Payment Initiation' },
    ],
    components: {
      securitySchemes: {
        bearer: { type: 'http', scheme: 'bearer' },
        basic: { type: 'http', scheme: 'basic' },
      },
      schemas: {
        TokenRequest: {
          type: 'object',
          required: ['client_id', 'client_secret'],
          properties: {
            grant_type: { type: 'string', enum: ['client_credentials'], default: 'client_credentials' },
            client_id: { type: 'string' },
            client_secret: { type: 'string' },
            scope: { type: 'string' },
            consent_id: { type: 'string' },
          },
        },
      },
    },
    paths: {
      '/auth/token': {
        post: {
          tags: ['oauth'],
          summary: 'Emitir access token (client_credentials)',
          requestBody: {
            required: true,
            content: {
              'application/x-www-form-urlencoded': {
                schema: { $ref: '#/components/schemas/TokenRequest' },
              },
              'application/json': {
                schema: { $ref: '#/components/schemas/TokenRequest' },
              },
            },
          },
          responses: { 200: { description: 'Token RFC 6749' } },
        },
      },
      '/auth/introspect': {
        post: {
          tags: ['oauth'],
          summary: 'Introspección de token (RFC 7662)',
          security: [{ basic: [] }, { bearer: [] }],
          responses: { 200: { description: '{ active: boolean }' } },
        },
      },
      '/discovery': {
        get: {
          tags: ['oauth'],
          summary: 'Documento de descubrimiento',
          responses: { 200: { description: 'Endpoints y scopes' } },
        },
      },
      '/consents': {
        get: { tags: ['ais'], security: [{ bearer: [] }], summary: 'Listar consentimientos' },
        post: { tags: ['ais'], security: [{ bearer: [] }], summary: 'Crear consentimiento' },
      },
      '/accounts': {
        get: {
          tags: ['ais'],
          security: [{ bearer: [] }],
          summary: 'Cuentas del consentimiento',
        },
      },
      '/payments': {
        get: { tags: ['pis'], security: [{ bearer: [] }], summary: 'Listar pagos' },
        post: {
          tags: ['pis'],
          security: [{ bearer: [] }],
          summary: 'Iniciar pago. Header Idempotency-Key opcional.',
        },
      },
    },
    'x-scopes': OB_SCOPES,
    'x-standards': [
      'OAuth 2.0 RFC 6749',
      'Token Introspection RFC 7662',
      'OpenAPI 3.0',
      'UK Open Banking resource envelope (Data)',
    ],
  };
}

export function openBankingDiscovery(origin = '') {
  const root = `${origin}${BASE}`;
  return {
    issuer: 'sicr3p-open-banking',
    version: '1.0.0',
    standards: [
      'OAuth 2.0 RFC 6749',
      'RFC 7662 Token Introspection',
      'OpenAPI 3.0.3',
    ],
    grant_types_supported: ['client_credentials'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post'],
    scopes_supported: OB_SCOPES,
    token_endpoint: `${root}/auth/token`,
    introspection_endpoint: `${root}/auth/introspect`,
    consents_endpoint: `${root}/consents`,
    accounts_endpoint: `${root}/accounts`,
    payments_endpoint: `${root}/payments`,
    openapi: `${root}/openapi.json`,
    regulatory_note:
      'API de software y mandato para empresas. No es licencia bancaria ni custodia de fondos del público.',
  };
}
