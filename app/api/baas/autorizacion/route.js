import { NextResponse } from 'next/server';
import { crearAutorizacion, getAutorizacionByCodigo, listAutorizaciones, TERMINOS_VERSION } from '@/lib/baas/autorizacion';
import { exigirOps } from '@/lib/auth';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const codigo = searchParams.get('codigo');
  if (codigo) {
    const row = getAutorizacionByCodigo(codigo);
    if (!row) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
    return NextResponse.json({
      ok: true,
      autorizacion: {
        codigo: row.codigo,
        nombre: row.nombre,
        email: row.email,
        empresa: row.empresa,
        terminos_version: row.terminos_version,
        entorno: row.entorno || 'prueba',
        creado_en: row.creado_en,
      },
      version: TERMINOS_VERSION,
    });
  }

  const ops = await exigirOps();
  if (!ops) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  return NextResponse.json({ autorizaciones: listAutorizaciones(), version: TERMINOS_VERSION });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
  const userAgent = request.headers.get('user-agent') || '';
  try {
    const row = crearAutorizacion({
      nombre: body.nombre,
      email: body.email,
      rut: body.rut,
      empresa: body.empresa,
      aceptaTerminos: Boolean(body.aceptaTerminos),
      aceptaPrivacidad: Boolean(body.aceptaPrivacidad),
      aceptaIntegracion: Boolean(body.aceptaIntegracion),
      entorno: body.entorno || 'prueba',
      ip,
      userAgent,
    });
    return NextResponse.json({
      ok: true,
      codigo: row.codigo,
      terminos_version: row.terminos_version,
      entorno: row.entorno,
      creado_en: row.creado_en,
      mensaje:
        row.entorno === 'produccion'
          ? 'Autorización de producción registrada. Guardá el código como constancia.'
          : 'Autorización de entorno de prueba registrada. Guardá el código como constancia.',
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
