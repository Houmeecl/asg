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
    if (wallet && existing.kyc_estado === 'APROBADO') {
      return { status: 'READY', persona: existing, wallet };
    }
    if (existing.registro_token && existing.kyc_estado !== 'APROBADO') {
      return {
        status: 'NEEDS_KYC',
        persona: existing,
        registroPath: `/registro/${existing.registro_token}`,
        wallet,
      };
    }
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

/**
 * Completa KYC demo y crea tarjeta virtual (placeholder hasta prepago con emisor regulado).
 * Copy CMF: wallet virtual operativa, no medio de pago con provisión de fondos.
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

  let wallet = getWalletByPersona(persona.id);
  if (!wallet) {
    const walletId = genId('wlt');
    const tarjetaVirtualId = genId('vcard');
    db.prepare(`
      INSERT INTO baas_wallets (persona_id, wallet_id, tarjeta_virtual_id, estado, etiqueta)
      VALUES (?, ?, ?, 'VIRTUAL', ?)
    `).run(persona.id, walletId, tarjetaVirtualId, `Virtual · ${nombre}`);
    wallet = getWalletByPersona(persona.id);
  }

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
