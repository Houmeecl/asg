import { NextResponse } from 'next/server';
import { obtenerUsuarioSesion } from '@/lib/auth';
import {
  createClient,
  getDemoClientSecret,
  listAudit,
  listClients,
  listConsents,
  listPayments,
  seedDemoOpenBankingClient,
} from '@/lib/baas/open-banking';

export async function GET() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario || (usuario.rol !== 'ADMIN' && usuario.rol !== 'OPERADOR')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const seeded = seedDemoOpenBankingClient();
  const clients = listClients().map((c) => ({
    ...c,
    demo_secret: c.nombre === 'Demo Open Banking' ? getDemoClientSecret(c.client_id) : undefined,
  }));
  return NextResponse.json({
    usuario,
    seeded,
    clients,
    consents: listConsents(),
    payments: listPayments(),
    audit: listAudit(30),
  });
}

export async function POST(request) {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario || usuario.rol !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo ADMIN puede crear clients' }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const created = createClient({
    nombre: body.nombre || 'Partner OB',
    empresaUsuarioId: body.empresa_usuario_id || null,
    scopes: body.scopes,
  });
  return NextResponse.json(created, { status: 201 });
}
