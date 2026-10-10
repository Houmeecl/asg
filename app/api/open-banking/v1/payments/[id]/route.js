import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getPayment, seedDemoOpenBankingClient } from '@/lib/baas/open-banking';
import { obError, withObAuth } from '@/lib/baas/ob-http';

export async function GET(request, { params }) {
  seedDemoOpenBankingClient();
  const { auth, error } = withObAuth(request, { requireConsent: true });
  if (error) return error;
  const { id } = await params;
  const row = db.prepare(`SELECT client_id FROM ob_payments WHERE payment_id = ?`).get(id);
  if (!row || row.client_id !== auth.client.client_id) {
    return obError('not_found', 'Pago no encontrado', 404);
  }
  return NextResponse.json(getPayment(id));
}
