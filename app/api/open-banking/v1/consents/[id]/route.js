import { NextResponse } from 'next/server';
import { getConsent, revokeConsent, seedDemoOpenBankingClient } from '@/lib/baas/open-banking';
import { obError, withObAuth } from '@/lib/baas/ob-http';

export async function GET(request, { params }) {
  seedDemoOpenBankingClient();
  const { auth, error } = withObAuth(request);
  if (error) return error;
  const { id } = await params;
  const c = getConsent(id);
  if (!c || c.client_id !== auth.client.client_id) {
    return obError('not_found', 'Consentimiento no encontrado', 404);
  }
  return NextResponse.json({
    Data: {
      ConsentId: c.consent_id,
      Status: c.status,
      Permissions: c.scopes.split(/\s+/),
      ExpirationDateTime: c.expires_at,
      CreationDateTime: c.creado_en,
    },
  });
}

export async function DELETE(request, { params }) {
  seedDemoOpenBankingClient();
  const { auth, error } = withObAuth(request);
  if (error) return error;
  const { id } = await params;
  const c = getConsent(id);
  if (!c || c.client_id !== auth.client.client_id) {
    return obError('not_found', 'Consentimiento no encontrado', 404);
  }
  const revoked = revokeConsent(id);
  return NextResponse.json({
    Data: { ConsentId: revoked.consent_id, Status: revoked.status },
  });
}
