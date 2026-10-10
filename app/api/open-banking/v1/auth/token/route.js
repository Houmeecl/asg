import { NextResponse } from 'next/server';
import { issueToken, seedDemoOpenBankingClient } from '@/lib/baas/open-banking';
import { obError, readJson } from '@/lib/baas/ob-http';

export async function POST(request) {
  seedDemoOpenBankingClient();
  const body = (await readJson(request)) || {};
  const clientId = body.client_id || body.clientId;
  const clientSecret = body.client_secret || body.clientSecret;
  const consentId = body.consent_id || body.consentId;
  const scopes = body.scope;

  if (!clientId || !clientSecret) {
    return obError('invalid_request', 'client_id y client_secret son requeridos', 400);
  }

  try {
    const token = issueToken({
      clientId,
      clientSecret,
      consentId,
      scopes: scopes ? String(scopes).split(/\s+/) : undefined,
    });
    return NextResponse.json(token);
  } catch (err) {
    const map = {
      invalid_client: [401, 'Cliente o secreto inválido'],
      invalid_consent: [400, 'Consentimiento inválido'],
      consent_not_authorised: [403, 'Consentimiento no autorizado'],
      consent_expired: [403, 'Consentimiento expirado'],
    };
    const [status, msg] = map[err.message] || [400, err.message];
    return obError(err.message, msg, status);
  }
}
