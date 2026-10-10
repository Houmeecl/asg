import { NextResponse } from 'next/server';
import { openBankingOpenApi } from '@/lib/baas/ob-openapi';

export async function GET() {
  return NextResponse.json(openBankingOpenApi());
}
