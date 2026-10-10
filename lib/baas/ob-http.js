import { NextResponse } from 'next/server';
import { authenticateBearer, audit } from './open-banking.js';

export function obError(code, message, status = 400) {
  return NextResponse.json(
    { error: code, error_description: message },
    { status },
  );
}

export function withObAuth(request, { requireConsent = false } = {}) {
  const auth = authenticateBearer(request.headers.get('authorization') || '');
  if (!auth) return { error: obError('invalid_token', 'Bearer token inválido o expirado', 401) };
  if (requireConsent && !auth.consent) {
    return { error: obError('consent_required', 'Este endpoint requiere consent AUTHORISED', 403) };
  }
  return { auth };
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** OAuth 2.0 token request: JSON, form-urlencoded o HTTP Basic (RFC 6749). */
export async function readOAuthTokenRequest(request) {
  const header = request.headers.get('authorization') || '';
  let basicId;
  let basicSecret;
  if (header.startsWith('Basic ')) {
    const decoded = Buffer.from(header.slice(6).trim(), 'base64').toString('utf8');
    const idx = decoded.indexOf(':');
    if (idx > 0) {
      basicId = decodeURIComponent(decoded.slice(0, idx));
      basicSecret = decodeURIComponent(decoded.slice(idx + 1));
    }
  }

  const ctype = request.headers.get('content-type') || '';
  let body = {};
  if (ctype.includes('application/x-www-form-urlencoded')) {
    body = Object.fromEntries(new URLSearchParams(await request.text()));
  } else {
    body = (await readJson(request)) || {};
  }

  return {
    grantType: body.grant_type || 'client_credentials',
    clientId: basicId || body.client_id || body.clientId,
    clientSecret: basicSecret || body.client_secret || body.clientSecret,
    consentId: body.consent_id || body.consentId,
    scope: body.scope,
    token: body.token,
  };
}

export function logAndJson(auth, action, path, data, status = 200) {
  audit(auth?.client?.client_id, action, path, typeof data === 'object' ? { ok: true } : null);
  return NextResponse.json(data, { status });
}
