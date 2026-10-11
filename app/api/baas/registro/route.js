import { NextResponse } from 'next/server';
import { getRegistroByToken, submitPreregistro } from '@/lib/baas/wallet';

export async function GET(request) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
  const persona = getRegistroByToken(token);
  if (!persona) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json({
    persona: {
      rut: persona.rut,
      nombre: persona.nombre,
      kyc_estado: persona.kyc_estado,
      expira: persona.registro_expira,
    },
  });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  try {
    const persona = submitPreregistro(body.token, {
      nombre: body.nombre,
      email: body.email,
      telefono: body.telefono,
      pais: body.pais || 'CL',
    });
    return NextResponse.json({
      persona,
      estado: 'EN_REVISION',
      mensaje: 'Preregistro enviado. Un operador debe aprobar el KYC antes de habilitar la wallet.',
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
