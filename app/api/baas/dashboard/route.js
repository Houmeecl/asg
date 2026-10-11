import { NextResponse } from 'next/server';
import { exigirUsuarioSesion } from '@/lib/auth';
import { buildDashboardPayload } from '@/lib/baas/dashboard-data';

export async function GET() {
  const usuario = await exigirUsuarioSesion();
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  return NextResponse.json(buildDashboardPayload(usuario));
}
