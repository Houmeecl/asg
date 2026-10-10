import { NextResponse } from 'next/server';
import { authoriseConsent, getConsent, seedDemoOpenBankingClient } from '@/lib/baas/open-banking';
import { obError, withObAuth } from '@/lib/baas/ob-http';
import { obtenerUsuarioSesion } from '@/lib/auth';

/**
 * Autoriza un consentimiento.
 * - Con sesión EMPRESA/ADMIN/OPERADOR, o
 * - Con bearer del mismo client (demo / sandbox).
 */
export async function POST(request, { params }) {
  seedDemoOpenBankingClient();
  const { id } = await params;
  const c = getConsent(id);
  if (!c) return obError('not_found', 'Consentimiento no encontrado', 404);

  const usuario = await obtenerUsuarioSesion();
  const bearer = withObAuth(request);

  const allowedBySession =
    usuario &&
    (usuario.rol === 'ADMIN' ||
      usuario.rol === 'OPERADOR' ||
      (usuario.rol === 'EMPRESA' && usuario.id === c.empresa_usuario_id));
  const allowedByClient = !bearer.error && bearer.auth?.client?.client_id === c.client_id;

  if (!allowedBySession && !allowedByClient) {
    return obError('forbidden', 'Debes autorizar con la empresa titular o el client demo', 403);
  }

  try {
    const authz = authoriseConsent(id);
    return NextResponse.json({
      Data: {
        ConsentId: authz.consent_id,
        Status: authz.status,
        Permissions: authz.scopes.split(/\s+/),
        AuthorisedDateTime: authz.autorizado_en,
      },
    });
  } catch (err) {
    return obError(err.message, err.message, 400);
  }
}
