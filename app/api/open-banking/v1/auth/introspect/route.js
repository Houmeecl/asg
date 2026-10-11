import { NextResponse } from 'next/server';
import {
  authenticateBearer,
  introspectAccessToken,
  seedDemoOpenBankingClient,
  verifyClientCredentials,
} from '@/lib/baas/open-banking';
import { obError, readOAuthTokenRequest } from '@/lib/baas/ob-http';

/** RFC 7662. El cliente autentica con Basic, form o su propio bearer. */
export async function POST(request) {
  seedDemoOpenBankingClient();
  const body = await readOAuthTokenRequest(request);
  const bearer = authenticateBearer(request.headers.get('authorization') || '');
  const clientOk =
    Boolean(bearer?.client) ||
    Boolean(body.clientId && body.clientSecret && verifyClientCredentials(body.clientId, body.clientSecret));
  if (!clientOk) return obError('invalid_client', 'Autenticación de cliente requerida', 401);
  if (!body.token) return obError('invalid_request', 'token es requerido', 400);

  const result = introspectAccessToken(body.token);
  const callerId = bearer?.client?.client_id || body.clientId;
  if (result.active && result.client_id !== callerId) {
    return NextResponse.json({ active: false });
  }
  return NextResponse.json(result);
}
