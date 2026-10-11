import { NextResponse } from 'next/server';
import { exigirOps } from '@/lib/auth';
import {
  actualizarSettings,
  cambiarEstadoPlatform,
  crearUserAccount,
  guardarPlatform,
  simularRevision,
  snapshotOnboarding,
  subirKyc,
} from '@/lib/baas/platforms';

export async function GET() {
  const usuario = await exigirOps();
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  return NextResponse.json({ usuario, ...snapshotOnboarding() });
}

export async function POST(request) {
  const usuario = await exigirOps();
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  try {
    if (body.action === 'guardar_platform') {
      const platform = guardarPlatform(body);
      return NextResponse.json({ platform, ...snapshotOnboarding() });
    }
    if (body.action === 'crear') {
      const cuenta = await crearUserAccount(body);
      return NextResponse.json({ cuenta, ...snapshotOnboarding() });
    }
    if (body.action === 'subir_kyc') {
      const cuenta = subirKyc(body);
      return NextResponse.json({ cuenta, ...snapshotOnboarding() });
    }
    if (body.action === 'settings') {
      const cuenta = actualizarSettings(body);
      return NextResponse.json({ cuenta, ...snapshotOnboarding() });
    }
    if (body.action === 'revisar') {
      const cuenta = simularRevision(body);
      return NextResponse.json({ cuenta, ...snapshotOnboarding() });
    }
    if (body.action === 'bloquear' || body.action === 'cancelar') {
      const cuenta = cambiarEstadoPlatform({ id: body.id, accion: body.action });
      return NextResponse.json({ cuenta, ...snapshotOnboarding() });
    }
    return NextResponse.json({ error: 'Acción desconocida' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
