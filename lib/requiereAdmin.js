// lib/requiereAdmin.js — guarda común para rutas de administración.
import { NextResponse } from 'next/server';
import { obtenerUsuarioSeguros, esAdmin } from '@/lib/segurosAuth';

// Devuelve { usuario } o { error: Response } listo para retornar.
export async function requiereAdmin() {
    const usuario = await obtenerUsuarioSeguros();
    if (!usuario) return { error: NextResponse.json({ error: 'No autenticado.' }, { status: 401 }) };
    if (!esAdmin(usuario)) return { error: NextResponse.json({ error: 'Solo administradores.' }, { status: 403 }) };
    return { usuario };
}
