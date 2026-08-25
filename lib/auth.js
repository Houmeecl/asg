// lib/auth.js
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import db from '@/lib/db';

const SESSION_COOKIE = 'sicr3p_session';
const SESSION_DIAS = 7;

// En un despliegue real esto DEBE venir de una variable de entorno (SESSION_SECRET).
// Nota: no se puede generar aleatoriamente como fallback en memoria — Next.js
// instancia este módulo por separado para Route Handlers y Server Components
// (capas de compilación distintas), así que cada capa tendría un secreto
// distinto y ninguna firma coincidiría nunca entre login y verificación.
const SESSION_SECRET = process.env.SESSION_SECRET || 'sicr3p-dev-secret-cambiar-en-produccion';

const CREDENCIALES_DEMO = { email: 'admin@sicr3p.cl', password: 'sicr3p2026' };

function seedUsuarioDemo() {
    // INSERT OR IGNORE: varios módulos de ruta importan este archivo en paralelo
    // (Next.js recolecta rutas en workers concurrentes durante el build), así que
    // un check-then-insert simple puede chocar con la constraint UNIQUE del email.
    const hash = bcrypt.hashSync(CREDENCIALES_DEMO.password, 10);
    const result = db.prepare(
        `INSERT OR IGNORE INTO usuarios (email, password_hash, nombre, rol) VALUES (?, ?, ?, 'ADMIN')`
    ).run(CREDENCIALES_DEMO.email, hash, 'Auditor Demo');
    if (result.changes > 0) {
        console.log(`[auth] Usuario demo creado — ${CREDENCIALES_DEMO.email} / ${CREDENCIALES_DEMO.password}`);
    }
}
seedUsuarioDemo();

function firmar(payload) {
    return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
}

export function verificarCredenciales(email, password) {
    const usuario = db.prepare(`SELECT * FROM usuarios WHERE email = ?`).get(email);
    if (!usuario) return null;
    const valido = bcrypt.compareSync(password, usuario.password_hash);
    return valido ? { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol } : null;
}

export async function crearSesion(usuario) {
    const expira = Date.now() + SESSION_DIAS * 24 * 60 * 60 * 1000;
    const payload = `${usuario.id}.${expira}`;
    const firma = firmar(payload);
    const token = `${payload}.${firma}`;

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_DIAS * 24 * 60 * 60,
    });
}

export async function cerrarSesion() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
}

export async function obtenerUsuarioSesion() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const [id, expira, firma] = token.split('.');
    if (!id || !expira || !firma) return null;
    if (firmar(`${id}.${expira}`) !== firma) return null;
    if (Date.now() > Number(expira)) return null;

    const usuario = db.prepare(`SELECT id, email, nombre, rol FROM usuarios WHERE id = ?`).get(id);
    return usuario || null;
}
