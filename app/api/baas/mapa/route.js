import { NextResponse } from 'next/server';
import { exigirOps } from '@/lib/auth';
import { capturarLectura, registrarUnidad, setUnidadEstado, snapshotCapas, tickRedM2M } from '@/lib/baas/m2m';

export async function GET() {
  const usuario = await exigirOps();
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  return NextResponse.json({ usuario, ...snapshotCapas() });
}

export async function POST(request) {
  const usuario = await exigirOps();
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  try {
    if (body.action === 'tick') {
      tickRedM2M();
      return NextResponse.json(snapshotCapas());
    }
    if (body.action === 'registrar') {
      const unidad = registrarUnidad(body);
      return NextResponse.json({ unidad, ...snapshotCapas() }, { status: 201 });
    }
    if (body.action === 'capturar') {
      const unidad = capturarLectura({ id: Number(body.id), metrica: body.metrica, valor: body.valor });
      return NextResponse.json({ unidad, ...snapshotCapas() });
    }
    if (body.action === 'conectar' || body.action === 'desconectar') {
      const estado = body.action === 'conectar' ? 'CONECTADO' : 'DESCONECTADO';
      const unidad = setUnidadEstado(Number(body.id), estado);
      return NextResponse.json({ unidad, ...snapshotCapas() });
    }
    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
