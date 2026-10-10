import crypto from 'crypto';
import db from '../db.js';

function cleanRut(rut) {
  return String(rut || '').replace(/\./g, '').replace(/-/g, '').toUpperCase();
}

function formatRut(rut) {
  const c = cleanRut(rut);
  if (c.length < 2) return c;
  return `${c.slice(0, -1)}-${c.slice(-1)}`;
}

function genId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

export function getPersonaByRut(rut) {
  const key = cleanRut(rut);
  return db.prepare('SELECT * FROM baas_personas WHERE rut = ? OR rut = ?').get(key, formatRut(rut));
}

export function getWalletByPersona(personaId) {
  return db.prepare('SELECT * FROM baas_wallets WHERE persona_id = ?').get(personaId);
}

/** Si no existe persona: crea token de registro KYC + QR path. */
export function startRegistroOrGetWallet(rut, { nombreHint } = {}) {
  const existing = getPersonaByRut(rut);
  if (existing) {
    const wallet = getWalletByPersona(existing.id);
    if (existing.kyc_estado === 'APROBADO') {
      return {
        status: 'READY',
        persona: existing,
        wallet: wallet || ensureWallet(existing.id, existing.nombre),
      };
    }
    if (existing.registro_token) {
      return {
        status: 'NEEDS_KYC',
        persona: existing,
        registroPath: `/registro/${existing.registro_token}`,
        wallet,
      };
    }
    const reopened = reopenRegistro(existing, nombreHint);
    return { status: 'NEEDS_KYC', ...reopened, wallet };
  }

  const token = crypto.randomBytes(16).toString('hex');
  const expira = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const rutFmt = formatRut(rut);
  const info = db.prepare(`
    INSERT INTO baas_personas (rut, nombre, kyc_estado, registro_token, registro_expira)
    VALUES (?, ?, 'PENDIENTE', ?, ?)
  `).run(rutFmt, nombreHint || 'Por registrar', token, expira);

  return {
    status: 'NEEDS_KYC',
    persona: { id: info.lastInsertRowid, rut: rutFmt, kyc_estado: 'PENDIENTE', registro_token: token },
    registroPath: `/registro/${token}`,
    wallet: null,
  };
}

export function getRegistroByToken(token) {
  return db.prepare('SELECT * FROM baas_personas WHERE registro_token = ?').get(token);
}

function reopenRegistro(persona, nombreHint) {
  const token = crypto.randomBytes(16).toString('hex');
  const expira = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  db.prepare(`
    UPDATE baas_personas
    SET registro_token = ?, registro_expira = ?, kyc_estado = 'PENDIENTE',
        nombre = CASE WHEN ? IS NOT NULL AND ? != '' THEN ? ELSE nombre END
    WHERE id = ?
  `).run(token, expira, nombreHint || null, nombreHint || null, nombreHint || null, persona.id);
  return {
    persona: db.prepare('SELECT * FROM baas_personas WHERE id = ?').get(persona.id),
    registroPath: `/registro/${token}`,
  };
}

/** El titular envía datos y queda en revisión. La wallet se crea al aprobar. */
export function submitPreregistro(token, { nombre, email, telefono, pais = 'CL' }) {
  const persona = getRegistroByToken(token);
  if (!persona) throw new Error('Token de registro inválido');
  if (persona.kyc_estado === 'APROBADO') throw new Error('Este registro ya fue aprobado');
  if (persona.registro_expira && new Date(persona.registro_expira) < new Date()) {
    throw new Error('El enlace de registro expiró. Solicita uno nuevo en el POS.');
  }
  db.prepare(`
    UPDATE baas_personas
    SET nombre = ?, email = ?, telefono = ?, pais = ?, kyc_estado = 'EN_REVISION'
    WHERE id = ?
  `).run(nombre, email || null, telefono || null, pais, persona.id);
  return db.prepare('SELECT * FROM baas_personas WHERE id = ?').get(persona.id);
}

function ensureWallet(personaId, nombre) {
  let wallet = getWalletByPersona(personaId);
  if (wallet) return wallet;
  const walletId = genId('wlt');
  const tarjetaVirtualId = genId('vcard');
  db.prepare(`
    INSERT INTO baas_wallets (persona_id, wallet_id, tarjeta_virtual_id, estado, etiqueta)
    VALUES (?, ?, ?, 'VIRTUAL', ?)
  `).run(personaId, walletId, tarjetaVirtualId, `Virtual · ${nombre}`);
  return getWalletByPersona(personaId);
}

export function approveKyc(personaId) {
  const persona = db.prepare('SELECT * FROM baas_personas WHERE id = ?').get(personaId);
  if (!persona) throw new Error('Persona no encontrada');
  if (persona.kyc_estado === 'RECHAZADO') throw new Error('El preregistro fue rechazado');
  db.prepare(`
    UPDATE baas_personas
    SET kyc_estado = 'APROBADO', registro_token = NULL, registro_expira = NULL
    WHERE id = ?
  `).run(persona.id);
  const wallet = ensureWallet(persona.id, persona.nombre);
  return {
    persona: db.prepare('SELECT * FROM baas_personas WHERE id = ?').get(persona.id),
    wallet,
  };
}

export function rejectKyc(personaId) {
  const persona = db.prepare('SELECT * FROM baas_personas WHERE id = ?').get(personaId);
  if (!persona) throw new Error('Persona no encontrada');
  if (persona.kyc_estado === 'APROBADO') throw new Error('El usuario ya está aprobado');
  db.prepare(`
    UPDATE baas_personas
    SET kyc_estado = 'RECHAZADO', registro_token = NULL, registro_expira = NULL
    WHERE id = ?
  `).run(persona.id);
  return db.prepare('SELECT * FROM baas_personas WHERE id = ?').get(persona.id);
}

/** Alta directa por operador: persona aprobada y wallet virtual. */
export function createUsuarioAprobado({ rut, nombre, email, telefono, pais = 'CL' }) {
  if (!rut || !nombre) throw new Error('RUT y nombre son requeridos');
  const existing = getPersonaByRut(rut);
  if (existing) {
    if (existing.kyc_estado === 'APROBADO') {
      return { persona: existing, wallet: getWalletByPersona(existing.id), existed: true };
    }
    db.prepare(`
      UPDATE baas_personas SET nombre = ?, email = ?, telefono = ?, pais = ? WHERE id = ?
    `).run(nombre, email || null, telefono || null, pais, existing.id);
    return { ...approveKyc(existing.id), existed: true };
  }
  const rutFmt = formatRut(rut);
  const info = db.prepare(`
    INSERT INTO baas_personas (rut, nombre, email, telefono, pais, kyc_estado)
    VALUES (?, ?, ?, ?, ?, 'APROBADO')
  `).run(rutFmt, nombre, email || null, telefono || null, pais);
  const wallet = ensureWallet(info.lastInsertRowid, nombre);
  return {
    persona: db.prepare('SELECT * FROM baas_personas WHERE id = ?').get(info.lastInsertRowid),
    wallet,
    existed: false,
  };
}

export function listPersonas(limit = 80) {
  return db.prepare(`
    SELECT p.*, w.wallet_id, w.tarjeta_virtual_id
    FROM baas_personas p
    LEFT JOIN baas_wallets w ON w.persona_id = p.id
    ORDER BY
      CASE p.kyc_estado WHEN 'EN_REVISION' THEN 0 WHEN 'PENDIENTE' THEN 1 ELSE 2 END,
      p.id DESC
    LIMIT ?
  `).all(limit);
}

/**
 * Completa KYC y crea la wallet virtual (placeholder hasta prepago con emisor regulado).
 * La usa el demo interno. El preregistro público queda en revisión y no llama esta función.
 */
export function completeKycAndCreateVirtualCard(token, { nombre, email, telefono, pais = 'CL' }) {
  const persona = getRegistroByToken(token);
  if (!persona) throw new Error('Token de registro inválido');
  if (persona.registro_expira && new Date(persona.registro_expira) < new Date()) {
    throw new Error('El enlace de registro expiró. Solicita uno nuevo en el POS.');
  }

  db.prepare(`
    UPDATE baas_personas
    SET nombre = ?, email = ?, telefono = ?, pais = ?, kyc_estado = 'APROBADO',
        registro_token = NULL, registro_expira = NULL
    WHERE id = ?
  `).run(nombre, email || null, telefono || null, pais, persona.id);

  const wallet = ensureWallet(persona.id, nombre);

  return {
    persona: db.prepare('SELECT * FROM baas_personas WHERE id = ?').get(persona.id),
    wallet,
  };
}

export function listWallets() {
  return db.prepare(`
    SELECT w.*, p.rut, p.nombre, p.email, p.kyc_estado
    FROM baas_wallets w
    JOIN baas_personas p ON p.id = w.persona_id
    ORDER BY w.id DESC
    LIMIT 100
  `).all();
}
