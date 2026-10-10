import crypto from 'crypto';
import db from '../db.js';
import { LEGAL_UPDATED } from './legal-copy.js';
import { normalizeMode } from './dlocal-env.js';

export const TERMINOS_VERSION = LEGAL_UPDATED;

/** Autorización de integración SICR3P (no solo dLocal): prueba | produccion */
export function normalizeEntornoAutorizacion(raw) {
  const m = normalizeMode(raw || 'prueba', 'sandbox');
  if (m === 'live') return 'produccion';
  if (m === 'sandbox' || m === 'simulator') return 'prueba';
  const key = String(raw || 'prueba').trim().toLowerCase();
  if (['produccion', 'producción', 'prod', 'live', 'production'].includes(key)) return 'produccion';
  return 'prueba';
}

export function crearAutorizacion({
  nombre,
  email,
  rut = '',
  empresa = '',
  aceptaTerminos,
  aceptaPrivacidad,
  aceptaIntegracion,
  entorno = 'prueba',
  ip = '',
  userAgent = '',
}) {
  if (!nombre?.trim() || !email?.trim()) {
    throw new Error('Nombre y email son obligatorios');
  }
  if (!aceptaTerminos || !aceptaPrivacidad) {
    throw new Error('Debés aceptar Términos y Privacidad');
  }
  if (!aceptaIntegracion) {
    throw new Error('Debés autorizar la integración empresarial descrita en los términos');
  }

  const env = normalizeEntornoAutorizacion(entorno);
  const codigo = `AUT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const info = db
    .prepare(
      `INSERT INTO baas_autorizaciones
        (codigo, nombre, email, rut, empresa, terminos_version, acepta_terminos, acepta_privacidad, acepta_integracion, entorno, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, 1, 1, 1, ?, ?, ?)`,
    )
    .run(
      codigo,
      nombre.trim(),
      email.trim().toLowerCase(),
      (rut || '').trim(),
      (empresa || '').trim(),
      TERMINOS_VERSION,
      env,
      ip || null,
      userAgent || null,
    );

  return getAutorizacion(info.lastInsertRowid);
}

export function getAutorizacion(id) {
  return db.prepare('SELECT * FROM baas_autorizaciones WHERE id = ?').get(id);
}

export function getAutorizacionByCodigo(codigo) {
  return db.prepare('SELECT * FROM baas_autorizaciones WHERE codigo = ?').get(codigo);
}

export function listAutorizaciones({ limit = 50 } = {}) {
  return db
    .prepare('SELECT * FROM baas_autorizaciones ORDER BY id DESC LIMIT ?')
    .all(limit);
}
