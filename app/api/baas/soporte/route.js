import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { AGENT_NAME, AGENT_VERSION, responderSoporte, sugerencias } from '@/lib/baas/support-agent';

function ensureSession(sessionId) {
  return sessionId && String(sessionId).length >= 8
    ? String(sessionId)
    : `sup-${crypto.randomBytes(8).toString('hex')}`;
}

export async function GET() {
  return NextResponse.json({
    agent: AGENT_NAME,
    version: AGENT_VERSION,
    sugerencias: sugerencias(),
  });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const sessionId = ensureSession(body.sessionId);
  const mensaje = String(body.mensaje || '').slice(0, 2000);

  if (mensaje) {
    db.prepare(
      `INSERT INTO baas_soporte_mensajes (session_id, rol, contenido) VALUES (?, 'user', ?)`,
    ).run(sessionId, mensaje);
  }

  const history = db
    .prepare(
      `SELECT rol, contenido FROM baas_soporte_mensajes WHERE session_id = ? ORDER BY id DESC LIMIT 12`,
    )
    .all(sessionId)
    .reverse();

  const result = responderSoporte(mensaje, { history });
  db.prepare(
    `INSERT INTO baas_soporte_mensajes (session_id, rol, contenido) VALUES (?, 'assistant', ?)`,
  ).run(sessionId, result.reply);

  return NextResponse.json({
    ok: true,
    sessionId,
    agent: result.agent,
    reply: result.reply,
    matched: result.matched,
    sugerencias: sugerencias(),
  });
}
