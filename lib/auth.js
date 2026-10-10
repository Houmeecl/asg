// lib/auth.js
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import db from '@/lib/db';
import { seedDemoBaas } from '@/lib/baas/operations';

const SESSION_COOKIE = 'sicr3p_session';
const SESSION_DIAS = 7;

// En un despliegue real esto DEBE venir de una variable de entorno (SESSION_SECRET).
const SESSION_SECRET = process.env.SESSION_SECRET || 'sicr3p-dev-secret-cambiar-en-produccion';

const DEMO_USERS = [
  { email: 'admin@sicr3p.cl', password: 'sicr3p2026', nombre: 'Admin Demo', rol: 'ADMIN' },
  { email: 'empresa@sicr3p.cl', password: 'sicr3p2026', nombre: 'Empresa Demo', rol: 'EMPRESA' },
  { email: 'ops@sicr3p.cl', password: 'sicr3p2026', nombre: 'Operador Demo', rol: 'OPERADOR' },
];

const PERMISOS_VALIDOS = ['INDUSTRIAL', 'CORREDOR'];
const ROLES_VALIDOS = ['ADMIN', 'AUDITOR', 'EMPRESA', 'OPERADOR'];

function seedUsuariosDemo() {
  const hashCache = {};
  for (const u of DEMO_USERS) {
    if (!hashCache[u.password]) hashCache[u.password] = bcrypt.hashSync(u.password, 10);
    const result = db.prepare(
      `INSERT OR IGNORE INTO usuarios (email, password_hash, nombre, rol) VALUES (?, ?, ?, ?)`
    ).run(u.email, hashCache[u.password], u.nombre, u.rol);
    if (result.changes > 0) {
      console.log(`[auth] Usuario demo creado — ${u.email} / ${u.password} (${u.rol})`);
    } else {
      // Asegura rol actualizado si el usuario ya existía con otro rol
      db.prepare(`UPDATE usuarios SET rol = ?, nombre = ? WHERE email = ?`).run(u.rol, u.nombre, u.email);
    }
  }
  const admin = db.prepare('SELECT id FROM usuarios WHERE email = ?').get('admin@sicr3p.cl');
  if (admin) {
    const asignarPermiso = db.prepare('INSERT OR IGNORE INTO usuario_permisos (usuario_id, permiso) VALUES (?, ?)');
    for (const permiso of PERMISOS_VALIDOS) asignarPermiso.run(admin.id, permiso);
  }
  try {
    seedDemoBaas();
  } catch (err) {
    console.warn('[auth] seedDemoBaas:', err.message);
  }
}
seedUsuariosDemo();

function firmar(payload) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
}

function permisosDeUsuario(usuarioId) {
  return db.prepare('SELECT permiso FROM usuario_permisos WHERE usuario_id = ? ORDER BY permiso').all(usuarioId).map((item) => item.permiso);
}

function usuarioSeguro(usuario) {
  if (!usuario) return null;
  const permisos = usuario.rol === 'ADMIN' ? PERMISOS_VALIDOS : permisosDeUsuario(usuario.id);
  return { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol, permisos };
}

export function destinoTrasLogin(usuario) {
  if (!usuario) return '/ingresar';
  if (usuario.rol === 'EMPRESA') return '/portal';
  if (usuario.rol === 'OPERADOR' || usuario.rol === 'ADMIN') return '/ops';
  return '/panel';
}

export function verificarCredenciales(email, password) {
  const usuario = db.prepare(`SELECT * FROM usuarios WHERE email = ?`).get(email);
  if (!usuario) return null;
  const valido = bcrypt.compareSync(password, usuario.password_hash);
  return valido ? usuarioSeguro(usuario) : null;
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
  return usuarioSeguro(usuario);
}

export async function exigirUsuarioSesion() {
  return obtenerUsuarioSesion();
}

export async function exigirAdministrador() {
  const usuario = await obtenerUsuarioSesion();
  return usuario?.rol === 'ADMIN' ? usuario : null;
}

export async function exigirRol(...roles) {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) return null;
  if (usuario.rol === 'ADMIN') return usuario;
  return roles.includes(usuario.rol) ? usuario : null;
}

export async function exigirEmpresa() {
  return exigirRol('EMPRESA');
}

export async function exigirOps() {
  return exigirRol('OPERADOR', 'ADMIN');
}

export function puedeAccederModulo(usuario, permiso) {
  if (!usuario) return false;
  if (usuario.rol === 'ADMIN') return true;
  return usuario.permisos?.includes(permiso);
}

export function puedeUsarFlujo(usuario, flujo) {
  if (flujo === 'CORREDOR_BIOCEANICO') return puedeAccederModulo(usuario, 'CORREDOR');
  if (['PROVEEDOR_MINERO', 'CBAM'].includes(flujo)) return puedeAccederModulo(usuario, 'INDUSTRIAL');
  return false;
}

export function permisosDesdeEntrada(rol, permisos = []) {
  if (rol === 'ADMIN') return PERMISOS_VALIDOS;
  const limpios = Array.isArray(permisos) ? permisos.filter((permiso) => PERMISOS_VALIDOS.includes(permiso)) : [];
  return limpios.length ? [...new Set(limpios)] : ['INDUSTRIAL'];
}

export function crearUsuario({ email, password, nombre, rol = 'AUDITOR', permisos = [] }) {
  const correo = String(email || '').trim().toLowerCase();
  const nombreLimpio = String(nombre || '').trim();
  if (!correo || !correo.includes('@') || !nombreLimpio) throw new Error('Nombre y correo válido son obligatorios.');
  if (typeof password !== 'string' || password.length < 10) throw new Error('La contraseña debe tener al menos 10 caracteres.');
  if (!ROLES_VALIDOS.includes(rol)) throw new Error('Rol inválido.');
  const passwordHash = bcrypt.hashSync(password, 12);
  const resultado = db.prepare('INSERT INTO usuarios (email, password_hash, nombre, rol) VALUES (?, ?, ?, ?)').run(correo, passwordHash, nombreLimpio, rol);
  const permisosFinales = rol === 'EMPRESA' || rol === 'OPERADOR' ? [] : permisosDesdeEntrada(rol, permisos);
  const asignarPermiso = db.prepare('INSERT INTO usuario_permisos (usuario_id, permiso) VALUES (?, ?)');
  for (const permiso of permisosFinales) asignarPermiso.run(resultado.lastInsertRowid, permiso);
  return { id: resultado.lastInsertRowid, email: correo, nombre: nombreLimpio, rol, permisos: permisosFinales };
}
