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

export function logAndJson(auth, action, path, data, status = 200) {
  audit(auth?.client?.client_id, action, path, typeof data === 'object' ? { ok: true } : null);
  return NextResponse.json(data, { status });
}
