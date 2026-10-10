import { NextResponse } from 'next/server';
import { getAccounts, seedDemoOpenBankingClient } from '@/lib/baas/open-banking';
import { obError, withObAuth } from '@/lib/baas/ob-http';

export async function GET(request) {
  seedDemoOpenBankingClient();
  const { auth, error } = withObAuth(request, { requireConsent: true });
  if (error) return error;
  try {
    return NextResponse.json(getAccounts(auth));
  } catch (err) {
    return obError(err.message, err.message, err.status || 400);
  }
}
