import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { upsertContactLead, getHubspotStatus } from '@/lib/baas/hubspot';

export async function GET() {
  return NextResponse.json({ hubspot: getHubspotStatus() });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const nombre = String(body.nombre || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const empresa = String(body.empresa || '').trim();
  const mensajeRaw = String(body.mensaje || '').trim();
  const mensaje = empresa && !mensajeRaw.includes(`[Empresa: ${empresa}]`)
    ? `[Empresa: ${empresa}] ${mensajeRaw}`.trim()
    : mensajeRaw;
  const telefono = String(body.telefono || '').trim() || undefined;

  if (!nombre || nombre.length < 2) {
    return NextResponse.json({ error: 'Indica tu nombre.' }, { status: 400 });
  }
  if (!email.includes('@')) {
    return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
  }
  if (!mensaje || mensaje.length < 5) {
    return NextResponse.json({ error: 'Escribe un mensaje.' }, { status: 400 });
  }

  let hubspot = null;
  let hubspotError = null;
  try {
    hubspot = await upsertContactLead({ nombre, email, mensaje, telefono });
  } catch (err) {
    hubspotError = err.message;
    console.warn('[contacto] HubSpot:', err.message);
  }

  const info = db.prepare(
    `INSERT INTO baas_contactos (nombre, email, mensaje, hubspot_contact_id, hubspot_mode)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    nombre,
    email,
    mensaje,
    hubspot?.contactId || null,
    hubspot?.mode || (hubspotError ? 'error' : null),
  );

  return NextResponse.json({
    ok: true,
    id: info.lastInsertRowid,
    mensaje: 'Recibido',
    hubspot: hubspot
      ? { mode: hubspot.mode, contactId: hubspot.contactId, created: hubspot.created }
      : { mode: 'error', error: hubspotError },
  });
}
