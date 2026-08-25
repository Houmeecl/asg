import { NextResponse } from 'next/server';
import { verificarCredenciales, crearSesion } from '@/lib/auth';

export async function POST(request) {
    const { email, password } = await request.json();
    if (!email || !password) {
        return NextResponse.json({ error: 'Debes ingresar email y contraseña.' }, { status: 400 });
    }

    const usuario = verificarCredenciales(email, password);
    if (!usuario) {
        return NextResponse.json({ error: 'Credenciales inválidas.' }, { status: 401 });
    }

    await crearSesion(usuario);
    return NextResponse.json({ mensaje: 'Sesión iniciada', usuario });
}
