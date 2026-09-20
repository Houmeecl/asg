import { NextResponse } from 'next/server';
import { crearUsuario, crearSesion, normalizarEmail } from '@/lib/segurosAuth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
    const body = await request.json().catch(() => null);
    const nombre = String(body?.nombre ?? '').trim();
    const email = normalizarEmail(body?.email);
    const password = String(body?.password ?? '');

    if (nombre.length < 2 || nombre.length > 100) {
        return NextResponse.json({ error: 'Ingresa tu nombre.' }, { status: 400 });
    }
    if (!EMAIL_RE.test(email) || email.length > 200) {
        return NextResponse.json({ error: 'Correo no válido.' }, { status: 400 });
    }
    // bcrypt ignora todo lo que pase de 72 bytes: se limita para no aceptar claves truncadas en silencio.
    if (password.length < 8 || Buffer.byteLength(password) > 72) {
        return NextResponse.json({ error: 'La contraseña debe tener entre 8 y 72 caracteres.' }, { status: 400 });
    }

    const usuario = crearUsuario({ nombre, email, password });
    if (!usuario) {
        return NextResponse.json({ error: 'Ya existe una cuenta con ese correo.' }, { status: 409 });
    }
    await crearSesion(usuario);
    return NextResponse.json({ usuario });
}
