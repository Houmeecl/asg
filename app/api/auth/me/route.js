import { NextResponse } from 'next/server';
import { obtenerUsuarioSesion } from '@/lib/auth';

export async function GET() {
    const usuario = await obtenerUsuarioSesion();
    return NextResponse.json({ usuario });
}
