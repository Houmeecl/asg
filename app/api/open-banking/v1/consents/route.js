import { NextResponse } from 'next/server';
import {
  authenticateBearer,
  createConsent,
  listConsents,
  seedDemoOpenBankingClient,
  verifyClientCredentials,
} from '@/lib/baas/open-banking';
import { obError, readJson, withObAuth } from '@/lib/baas/ob-http';
import db from '@/lib/db';

export async function GET(request) {
  seedDemoOpenBankingClient();
  const { auth, error } = withObAuth(request);
  if (error) return error;
  const rows = listConsents({ clientId: auth.client.client_id });
  return NextResponse.json({
    Data: {
      Consent: rows.map((c) => ({
        ConsentId: c.consent_id,
        Status: c.status,
        Permissions: c.scopes.split(/\s+/),
        ExpirationDateTime: c.expires_at,
        CreationDateTime: c.creado_en,
      })),
    },
  });
}

export async function POST(request) {
  seedDemoOpenBankingClient();
  const body = (await readJson(request)) || {};

  let clientId = body.client_id;
  if (!clientId) {
    const auth = authenticateBearer(request.headers.get('authorization') || '');
    if (!auth) return obError('invalid_token', 'Autenticación requerida', 401);
    clientId = auth.client.client_id;
  } else {
    const secret = body.client_secret;
    if (!secret) return obError('invalid_request', 'client_secret requerido con client_id', 400);
    if (!verifyClientCredentials(clientId, secret)) {
      return obError('invalid_client', 'Cliente o secreto inválido', 401);
    }
  }

  let empresaUsuarioId = body.empresa_usuario_id;
  if (!empresaUsuarioId && body.empresa_email) {
    const u = db.prepare(`SELECT id FROM usuarios WHERE email = ?`).get(body.empresa_email);
    empresaUsuarioId = u?.id;
  }
  if (!empresaUsuarioId) {
    const empresa = db.prepare(`SELECT id FROM usuarios WHERE email = ?`).get('empresa@sicr3p.cl');
    empresaUsuarioId = empresa?.id;
  }
  if (!empresaUsuarioId) return obError('invalid_request', 'empresa_usuario_id requerido', 400);

  const scopes = body.Permissions || body.scopes || body.permissions;
  try {
    const consent = createConsent({
      clientId,
      empresaUsuarioId,
      scopes: Array.isArray(scopes) ? scopes : undefined,
      ttlHours: body.ttlHours || 24,
    });
    return NextResponse.json(
      {
        Data: {
          ConsentId: consent.consent_id,
          Status: consent.status,
          Permissions: consent.scopes.split(/\s+/),
          ExpirationDateTime: consent.expires_at,
          CreationDateTime: consent.creado_en,
          Links: {
            Authorise: `/api/open-banking/v1/consents/${consent.consent_id}/authorise`,
          },
        },
      },
      { status: 201 },
    );
  } catch (err) {
    return obError(err.message, err.message, 400);
  }
}
