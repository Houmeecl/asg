import { NextResponse } from 'next/server';
import { verificarCredenciales, crearSesion, normalizarEmail } from '@/lib/segurosAuth';

export async function POST(request) {
    const body = await request.json().catch(() => null);
    const email = normalizarEmail(body?.email);
    const password = String(body?.password ?? '');
    if (!email || !password) {
        return NextResponse.json({ error: 'Debes ingresar correo y contraseña.' }, { status: 400 });
    }

    const r = verificarCredenciales(email, password);
    if (r.error === 'BLOQUEADO') {
        return NextResponse.json({ error: 'Demasiados intentos. Vuelve a probar en 15 minutos.' }, { status: 429 });
    }
    if (r.error) {
        return NextResponse.json({ error: 'Credenciales inválidas.' }, { status: 401 });
    }
    await crearSesion(r.usuario);
    return NextResponse.json({ usuario: r.usuario });
}
