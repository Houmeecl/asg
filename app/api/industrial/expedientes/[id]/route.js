import { NextResponse } from 'next/server';
import { exigirUsuarioSesion, puedeUsarFlujo } from '@/lib/auth';
import { resumenExpediente } from '@/lib/industrialService';

export async function GET(_request, { params }) {
  const usuario = await exigirUsuarioSesion();
  if (!usuario) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  const { id } = await params;
  const expediente = resumenExpediente(id);
  if (!expediente) return NextResponse.json({ error: 'Expediente inexistente.' }, { status: 404 });
  if (!puedeUsarFlujo(usuario, expediente.flujo)) return NextResponse.json({ error: 'Tu usuario no tiene permiso para este expediente.' }, { status: 403 });
  return NextResponse.json({ expediente });
}
