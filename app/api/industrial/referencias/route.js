import { NextResponse } from 'next/server';
import { exigirUsuarioSesion, puedeAccederModulo } from '@/lib/auth';
import { referenciasCbam } from '@/lib/industrialService';

export async function GET(request) {
  const usuario = await exigirUsuarioSesion();
  if (!usuario) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  if (!puedeAccederModulo(usuario, 'INDUSTRIAL')) return NextResponse.json({ error: 'Tu usuario no tiene permiso para Proveedor/CBAM.' }, { status: 403 });
  const { searchParams } = new URL(request.url);
  return NextResponse.json({
    referencias: referenciasCbam({
      pais_origen: searchParams.get('pais') || '',
      codigo_cn: searchParams.get('codigo_cn') || '',
    }),
  });
}
