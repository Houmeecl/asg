import { NextResponse } from 'next/server';
import { getTransactions, seedDemoOpenBankingClient } from '@/lib/baas/open-banking';
import { obError, withObAuth } from '@/lib/baas/ob-http';

export async function GET(request, { params }) {
  seedDemoOpenBankingClient();
  const { auth, error } = withObAuth(request, { requireConsent: true });
  if (error) return error;
  const { id } = await params;
  try {
    return NextResponse.json(getTransactions(auth, id));
  } catch (err) {
    return obError(err.message, err.message, err.status || 400);
  }
}
