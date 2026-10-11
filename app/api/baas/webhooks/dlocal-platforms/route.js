import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { aplicarNotificacion, platformsMode } from '@/lib/baas/platforms';
import { resolvePlatformsConfig } from '@/lib/baas/dlocal-env';

function firmaValida(request, raw) {
  const mode = platformsMode();
  const { secret, login } = resolvePlatformsConfig();
  if (mode === 'simulator' && !secret) return true;
  const auth = request.headers.get('authorization') || '';
  const date = request.headers.get('x-date') || '';
  const match = auth.match(/Signature:\s*([a-f0-9]+)/i);
  if (!match || !secret || !login) return mode === 'simulator';
  const expected = crypto.createHmac('sha256', secret).update(login + date + raw).digest('hex');
  const got = match[1].toLowerCase();
  if (got.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(got));
}

export async function POST(request) {
  const raw = await request.text();
  if (!firmaValida(request, raw)) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
  }
  let body = {};
  try {
    body = JSON.parse(raw || '{}');
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }
  try {
    const cuenta = aplicarNotificacion(body);
    return NextResponse.json({
      ok: true,
      environment: platformsMode(),
      account_id: cuenta.account_id,
      status: cuenta.status,
      status_detail: cuenta.status_detail,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
