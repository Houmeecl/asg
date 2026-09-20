import { NextResponse } from 'next/server';
import { obtenerUsuarioSeguros, esAdmin } from '@/lib/segurosAuth';
import { nicoConfigurado, nicoBase, nicoProbarConexion, NicoError } from '@/lib/nicoApi';

export async function GET() {
    const usuario = await obtenerUsuarioSeguros();
    if (!usuario) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
    if (!esAdmin(usuario)) return NextResponse.json({ error: 'Solo administradores.' }, { status: 403 });

    const base = nicoBase();
    if (!nicoConfigurado()) return NextResponse.json({ configurado: false, ok: false, base });
    try {
        await nicoProbarConexion();
        return NextResponse.json({ configurado: true, ok: true, base });
    } catch (e) {
        const mensaje = e instanceof NicoError ? e.message : 'Error inesperado.';
        return NextResponse.json({ configurado: true, ok: false, base, error: mensaje });
    }
}
