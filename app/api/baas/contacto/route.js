import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const nombre = String(body.nombre || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const mensaje = String(body.mensaje || '').trim();

  if (!nombre || nombre.length < 2) {
    return NextResponse.json({ error: 'Indica tu nombre.' }, { status: 400 });
  }
  if (!email.includes('@')) {
    return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
  }
  if (!mensaje || mensaje.length < 5) {
    return NextResponse.json({ error: 'Escribe un mensaje.' }, { status: 400 });
  }

  const info = db.prepare(
    `INSERT INTO baas_contactos (nombre, email, mensaje) VALUES (?, ?, ?)`
  ).run(nombre, email, mensaje);

  return NextResponse.json({
    ok: true,
    id: info.lastInsertRowid,
    mensaje: 'Recibido',
  });
}
