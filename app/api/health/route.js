import { NextResponse } from 'next/server';

/** Healthcheck para VPS / load balancer (sin auth). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'sicr3p-baas',
    ts: new Date().toISOString(),
  });
}
