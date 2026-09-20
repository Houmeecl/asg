// lib/segurosAuth.js
// Cuentas y pólizas del sitio SICR3P Seguros. Independiente del auth del panel ASG:
// tablas seg_*, cookie propia y firma con un espacio de nombres distinto.
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import db from '@/lib/db';

const COOKIE = 'sicr3p_seg_session';
const SESSION_DIAS = 7;
// En producción DEBE venir de SESSION_SECRET (ver nota equivalente en lib/auth.js).
const SECRET = process.env.SESSION_SECRET || 'sicr3p-dev-secret-cambiar-en-produccion';

const MAX_INTENTOS = 5;
const BLOQUEO_MS = 15 * 60 * 1000;
// Hash de relleno: se compara igual cuando el correo no existe, para no filtrar su existencia por tiempo.
const HASH_RELLENO = bcrypt.hashSync('relleno-sin-usuario', 10);

db.exec(`
    CREATE TABLE IF NOT EXISTS seg_usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        nombre TEXT NOT NULL,
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS seg_polizas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        empresa TEXT NOT NULL,
        sector TEXT NOT NULL,
        zona TEXT NOT NULL,
        localidad TEXT NOT NULL,
        riesgo TEXT NOT NULL,
        monto INTEGER NOT NULL,
        meses INTEGER NOT NULL,
        sensibilidad INTEGER NOT NULL,
        prima REAL NOT NULL,
        umbral REAL NOT NULL,
        estado TEXT NOT NULL DEFAULT 'DEMO',
        creada DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES seg_usuarios(id) ON DELETE CASCADE
    );
`);

// Migraciones aditivas (la base puede existir de versiones anteriores).
function agregarColumna(tabla, columna, definicion) {
    const existe = db.prepare(`PRAGMA table_info(${tabla})`).all().some((c) => c.name === columna);
    if (!existe) {
        try { db.exec(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`); } catch (e) {
            // Otro worker del build pudo crearla en paralelo.
            if (!/duplicate column/i.test(String(e.message))) throw e;
        }
    }
}
agregarColumna('seg_usuarios', 'rol', `TEXT NOT NULL DEFAULT 'CLIENTE'`);
agregarColumna('seg_polizas', 'nico_lead_id', 'TEXT');
agregarColumna('seg_polizas', 'nico_enviada', 'DATETIME');

const globalForSeg = globalThis;
const intentos = (globalForSeg.__segIntentos ??= new Map());

function firmar(payload) {
    return crypto.createHmac('sha256', SECRET).update(`seguros.${payload}`).digest('hex');
}

function igual(a, b) {
    const A = Buffer.from(a), B = Buffer.from(b);
    return A.length === B.length && crypto.timingSafeEqual(A, B);
}

export const normalizarEmail = (e) => String(e ?? '').trim().toLowerCase();

export function crearUsuario({ nombre, email, password }) {
    const hash = bcrypt.hashSync(password, 10);
    try {
        const r = db.prepare(`INSERT INTO seg_usuarios (email, password_hash, nombre) VALUES (?, ?, ?)`).run(email, hash, nombre);
        return { id: Number(r.lastInsertRowid), email, nombre };
    } catch (e) {
        if (String(e.code).startsWith('SQLITE_CONSTRAINT')) return null; // correo ya registrado
        throw e;
    }
}

// Devuelve { usuario } | { error: 'CREDENCIALES' | 'BLOQUEADO' }.
export function verificarCredenciales(email, password) {
    const ahora = Date.now();
    const est = intentos.get(email);
    if (est && est.hasta > ahora) return { error: 'BLOQUEADO' };

    const u = db.prepare(`SELECT * FROM seg_usuarios WHERE email = ?`).get(email);
    const ok = bcrypt.compareSync(password, u ? u.password_hash : HASH_RELLENO) && !!u;
    if (!ok) {
        const bloqueoVencido = est && est.hasta !== 0 && est.hasta <= ahora;
        const n = (bloqueoVencido ? 0 : est?.n ?? 0) + 1;
        intentos.set(email, { n, hasta: n >= MAX_INTENTOS ? ahora + BLOQUEO_MS : 0 });
        return { error: 'CREDENCIALES' };
    }
    intentos.delete(email);
    return { usuario: { id: u.id, email: u.email, nombre: u.nombre, rol: u.rol } };
}

export async function crearSesion(usuario) {
    const expira = Date.now() + SESSION_DIAS * 24 * 60 * 60 * 1000;
    const payload = `${usuario.id}.${expira}`;
    const store = await cookies();
    store.set(COOKIE, `${payload}.${firmar(payload)}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_DIAS * 24 * 60 * 60,
    });
}

export async function cerrarSesion() {
    (await cookies()).delete(COOKIE);
}

export async function obtenerUsuarioSeguros() {
    const token = (await cookies()).get(COOKIE)?.value;
    if (!token) return null;
    const [id, expira, firma] = token.split('.');
    if (!id || !expira || !firma) return null;
    if (!igual(firmar(`${id}.${expira}`), firma)) return null;
    if (Date.now() > Number(expira)) return null;
    return db.prepare(`SELECT id, email, nombre, rol FROM seg_usuarios WHERE id = ?`).get(id) ?? null;
}

export function crearPoliza(usuarioId, p) {
    const r = db.prepare(`
        INSERT INTO seg_polizas (usuario_id, empresa, sector, zona, localidad, riesgo, monto, meses, sensibilidad, prima, umbral)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(usuarioId, p.empresa, p.sector, p.zona, p.localidad, p.riesgo, p.monto, p.meses, p.sensibilidad, p.prima, p.umbral);
    return Number(r.lastInsertRowid);
}

export function listarPolizas(usuarioId) {
    return db.prepare(`SELECT * FROM seg_polizas WHERE usuario_id = ? ORDER BY id DESC`).all(usuarioId);
}

export const esAdmin = (u) => u?.rol === 'ADMIN';

export function obtenerPoliza(id) {
    return db.prepare(`SELECT * FROM seg_polizas WHERE id = ?`).get(id) ?? null;
}

// Solo para el panel admin: todas las pólizas con su titular.
export function listarTodasPolizas() {
    return db.prepare(`
        SELECT p.*, u.email AS usuario_email, u.nombre AS usuario_nombre
        FROM seg_polizas p JOIN seg_usuarios u ON u.id = p.usuario_id
        ORDER BY p.id DESC
    `).all();
}

export function marcarPolizaEnviadaANico(id, leadId) {
    db.prepare(`UPDATE seg_polizas SET nico_lead_id = ?, nico_enviada = CURRENT_TIMESTAMP WHERE id = ?`).run(String(leadId ?? 'sin-id'), id);
}
