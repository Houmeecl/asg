import { NextResponse } from 'next/server';
import { issueToken, seedDemoOpenBankingClient } from '@/lib/baas/open-banking';
import { obError, readOAuthTokenRequest } from '@/lib/baas/ob-http';

const ERRORS = {
  invalid_client: [401, 'Cliente o secreto inválido'],
  invalid_consent: [400, 'Consentimiento inválido'],
  consent_not_authorised: [403, 'Consentimiento no autorizado'],
  consent_expired: [403, 'Consentimiento expirado'],
  unsupported_grant_type: [400, 'grant_type no soportado. Usa client_credentials'],
};

export async function POST(request) {
  seedDemoOpenBankingClient();
  const body = await readOAuthTokenRequest(request);

  if (body.grantType !== 'client_credentials') {
    return obError('unsupported_grant_type', ERRORS.unsupported_grant_type[1], 400);
  }
  if (!body.clientId || !body.clientSecret) {
    return obError('invalid_request', 'client_id y client_secret son requeridos', 400);
  }

  try {
    const token = issueToken({
      clientId: body.clientId,
      clientSecret: body.clientSecret,
      consentId: body.consentId,
      scopes: body.scope ? String(body.scope).split(/\s+/) : undefined,
    });
    return NextResponse.json(token);
  } catch (err) {
    const [status, msg] = ERRORS[err.message] || [400, err.message];
    return obError(err.message, msg, status);
  }
}
