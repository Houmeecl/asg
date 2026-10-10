import { NextResponse } from 'next/server';
import { exigirOps } from '@/lib/auth';
import { registrarTerminal, setTerminalEstado, snapshotPosPortal } from '@/lib/baas/pos-portal';
import { approveKyc, createUsuarioAprobado, rejectKyc, startRegistroOrGetWallet } from '@/lib/baas/wallet';

export async function GET() {
  const usuario = await exigirOps();
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  return NextResponse.json({ usuario, ...snapshotPosPortal() });
}

export async function POST(request) {
  const usuario = await exigirOps();
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  try {
    if (body.action === 'registrar_terminal') {
      const terminal = registrarTerminal(body);
      return NextResponse.json({ terminal, ...snapshotPosPortal() });
    }
    if (body.action === 'conectar' || body.action === 'desconectar' || body.action === 'prueba') {
      const estado = body.action === 'conectar' ? 'CONECTADO' : body.action === 'prueba' ? 'EN_PRUEBA' : 'DESCONECTADO';
      const terminal = setTerminalEstado(Number(body.id), estado);
      return NextResponse.json({ terminal, ...snapshotPosPortal() });
    }
    if (body.action === 'aprobar') {
      const result = approveKyc(Number(body.personaId));
      return NextResponse.json({ ...result, ...snapshotPosPortal() });
    }
    if (body.action === 'rechazar') {
      const persona = rejectKyc(Number(body.personaId));
      return NextResponse.json({ persona, ...snapshotPosPortal() });
    }
    if (body.action === 'iniciar_preregistro') {
      if (!body.rut) throw new Error('RUT requerido');
      const registro = startRegistroOrGetWallet(body.rut, { nombreHint: body.nombre });
      return NextResponse.json({ registro, ...snapshotPosPortal() });
    }
    if (body.action === 'crear_usuario') {
      const result = createUsuarioAprobado(body);
      return NextResponse.json({ ...result, ...snapshotPosPortal() }, { status: result.existed ? 200 : 201 });
    }
    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
