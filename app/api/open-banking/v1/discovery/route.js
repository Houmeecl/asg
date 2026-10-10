import { NextResponse } from 'next/server';
import { openBankingDiscovery } from '@/lib/baas/ob-openapi';

export async function GET(request) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  const origin = host ? `${proto}://${host}` : new URL(request.url).origin;
  return NextResponse.json(openBankingDiscovery(origin));
}
