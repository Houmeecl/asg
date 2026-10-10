/**
 * Onboarding dLocal for Platforms.
 * Docs: https://docs.dlocal.com/docs/onboarding-process-platforms
 *
 * La cuenta Platform la abre dLocal con la entidad (no hay API pública para crearla).
 * Las user accounts (vendedor, prestador, contratista) se crean con POST /v2/accounts.
 * Cobro, payout, liquidación y reembolso solo con status APPROVED.
 *
 * Modo por defecto: simulator. Sandbox/live con DLOCAL_PLATFORMS_MODE y credenciales.
 */

import crypto from 'crypto';
import db from '../db.js';

const ROLES = ['vendedor', 'prestador', 'contratista', 'submerchant'];
const STATUSES = ['CREATING', 'PENDING', 'APPROVED', 'BLOCKED', 'CANCELED', 'REJECTED'];

export const PASOS = [
  { n: 1, titulo: 'Cuenta Platform', detalle: 'dLocal abre la cuenta de la entidad. De ahí salen el account ID, las credenciales y el platform type por país.' },
  { n: 2, titulo: 'Datos del usuario', detalle: 'SICR3P recoge los datos. dLocal no muestra el dashboard al usuario: la experiencia es de la plataforma.' },
  { n: 3, titulo: 'Crear user account', detalle: 'POST /v2/accounts. El account_id que responde dLocal queda guardado para todo lo que sigue.' },
  { n: 4, titulo: 'Documentos KYC', detalle: 'Se suben con el nombre de archivo que pide dLocal, mientras el detalle sea documentation.' },
  { n: 5, titulo: 'Revisión', detalle: 'Identidad, persona viva y listas de sanciones. El cambio de estado llega por webhook.' },
  { n: 6, titulo: 'Operar', detalle: 'Pay-in, payout, liquidación y reembolso solo después de APPROVED.' },
];

export const KYC_INDIVIDUAL = ['copy_of_id_front', 'copy_of_id_back', 'selfie'];
export const KYC_COMPANY = [
  'certificate_of_incorporation',
  'shareholders_registry',
  'legal_representative_copy_of_id_front',
  'legal_representative_copy_of_id_back',
  'ubo_copy_of_id_front',
  'ubo_copy_of_id_back',
];

const STATUS_META = {
  pending: { status: 'PENDING', status_code: 100, status_detail: 'pending' },
  documentation: { status: 'PENDING', status_code: 101, status_detail: 'documentation' },
  compliance_review: { status: 'PENDING', status_code: 102, status_detail: 'compliance_review' },
  account_set_up: { status: 'PENDING', status_code: 103, status_detail: 'account_set_up' },
  approved: { status: 'APPROVED', status_code: 200, status_detail: 'approved' },
  pending_documentation: { status: 'APPROVED', status_code: 201, status_detail: 'pending_documentation' },
  pending_compliance_review: { status: 'APPROVED', status_code: 202, status_detail: 'pending_compliance_review' },
  trial_period: { status: 'APPROVED', status_code: 203, status_detail: 'trial_period' },
  blocked: { status: 'BLOCKED', status_code: 300, status_detail: 'blocked' },
  rejected: { status: 'REJECTED', status_code: 400, status_detail: 'rejected' },
  canceled: { status: 'CANCELED', status_code: 500, status_detail: 'canceled' },
};

export function platformsMode() {
  return process.env.DLOCAL_PLATFORMS_MODE || 'simulator';
}

function notificationUrl() {
  return process.env.DLOCAL_PLATFORMS_NOTIFICATION_URL || 'https://sicr3p.cl/api/baas/webhooks/dlocal-platforms';
}

function baseUrl() {
  const mode = platformsMode();
  if (process.env.DLOCAL_PLATFORMS_BASE_URL) return process.env.DLOCAL_PLATFORMS_BASE_URL;
  return mode === 'live' ? 'https://marketplace-api.dlocal.com' : 'https://marketplace-api.dlocal-sbox.com';
}

export function capacidades(status) {
  const approved = status === 'APPROVED';
  return {
    payins: approved,
    payouts: approved,
    settlements: approved,
    refunds: approved,
    chargebacks: status === 'PENDING' || status === 'APPROVED',
    operable: approved,
  };
}

export function puedeActualizar(status, statusDetail) {
  return (
    (status === 'PENDING' && statusDetail === 'documentation')
    || (status === 'APPROVED' && statusDetail === 'pending_documentation')
  );
}

function requiredFiles(taxCategory) {
  return taxCategory === 'company' ? KYC_COMPANY : KYC_INDIVIDUAL;
}

function ensurePlatform() {
  const existing = db.prepare('SELECT * FROM baas_platform_accounts WHERE id = 1').get();
  if (existing) return existing;
  db.prepare(`
    INSERT INTO baas_platform_accounts (
      id, account_id, platform_type, country, legal_name, payment_methods, fee_note, settlement_period, pricing_level
    ) VALUES (1, ?, ?, 'CL', ?, ?, ?, 7, 'type_1')
  `).run(
    'plt-sicr3p-cl',
    'SICR3P_CL',
    'SICR3P',
    'Tarjeta y transferencia en Chile. Se heredan a cada user account.',
    'Comisiones y plazo los define la cuenta Platform. El simulador usa 7 días y pricing type_1 hasta que dLocal entregue el ID real.',
  );
  return db.prepare('SELECT * FROM baas_platform_accounts WHERE id = 1').get();
}

export function guardarPlatform(input) {
  ensurePlatform();
  const country = String(input.country || 'CL').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) throw new Error('El país de la cuenta Platform es un código ISO de 2 letras');
  const settlement = Number(input.settlement_period);
  if (!Number.isInteger(settlement) || settlement < 1 || settlement > 30) {
    throw new Error('El plazo de liquidación va de 1 a 30 días');
  }
  const platformType = String(input.platform_type || '').trim();
  const accountId = String(input.account_id || '').trim();
  const legalName = String(input.legal_name || '').trim();
  if (!platformType || !accountId || !legalName) throw new Error('Account ID, platform type y razón social son obligatorios');
  db.prepare(`
    UPDATE baas_platform_accounts
    SET account_id = ?, platform_type = ?, country = ?, legal_name = ?,
        settlement_period = ?, pricing_level = ?, actualizado_en = CURRENT_TIMESTAMP
    WHERE id = 1
  `).run(accountId, platformType, country, legalName, settlement, String(input.pricing_level || 'type_1').trim() || 'type_1');
  return ensurePlatform();
}

function filesOf(accountRowId) {
  return db.prepare('SELECT file_name, original_name, creado_en FROM baas_kyc_files WHERE account_row_id = ? ORDER BY id').all(accountRowId);
}

function present(row) {
  const payload = JSON.parse(row.payload_json);
  const files = filesOf(row.id);
  const required = requiredFiles(row.tax_category);
  const loaded = new Set(files.map((f) => f.file_name));
  return {
    id: row.id,
    account_id: row.account_id,
    external_reference: row.external_reference,
    rol: row.rol,
    tax_category: row.tax_category,
    account_name: row.account_name,
    account_email: row.account_email,
    account_country: row.account_country,
    notification_url: row.notification_url,
    status: row.status,
    status_code: row.status_code,
    status_detail: row.status_detail,
    pricing_level: row.pricing_level,
    settlement_period: row.settlement_period,
    tax_id: payload.company_information?.tax_id || null,
    creado_en: row.creado_en,
    files,
    requeridos: required,
    faltantes: required.filter((name) => !loaded.has(name)),
    capacidades: capacidades(row.status),
    puede_actualizar: puedeActualizar(row.status, row.status_detail),
  };
}

function event(row, tipo, detalle) {
  db.prepare(`
    INSERT INTO baas_account_events (account_row_id, account_id, tipo, status, status_detail, detalle)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(row?.id || null, row?.account_id || null, tipo, row?.status || null, row?.status_detail || null, detalle || null);
}

function setStatus(row, meta, tipo, detalle) {
  db.prepare(`
    UPDATE baas_user_accounts
    SET status = ?, status_code = ?, status_detail = ?, actualizado_en = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(meta.status, meta.status_code, meta.status_detail, row.id);
  const next = db.prepare('SELECT * FROM baas_user_accounts WHERE id = ?').get(row.id);
  event(next, tipo, detalle);
  return next;
}

function clean(value, max) {
  const text = String(value || '').trim();
  if (max && text.length > max) throw new Error(`Texto demasiado largo (máximo ${max})`);
  return text;
}

function buildPayload(input, platform) {
  const taxCategory = input.tax_category === 'company' ? 'company' : 'individual';
  const rol = ROLES.includes(input.rol) ? input.rol : null;
  if (!rol) throw new Error('El rol es vendedor, prestador, contratista o submerchant');
  const accountName = clean(input.account_name, 100);
  const email = clean(input.account_email, 60);
  const taxId = clean(input.tax_id, 32);
  const documentNumber = clean(input.document_number || input.tax_id, 32);
  const phone = clean(input.phone, 20);
  const city = clean(input.city, 60);
  const address = clean(input.address, 120);
  if (!accountName || !email || !taxId || !phone || !city || !address) {
    throw new Error('Nombre, email, RUT, teléfono, ciudad y dirección son obligatorios');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email inválido');
  if (!input.consent_data || !input.consent_terms) {
    throw new Error('Hay que aceptar recolección de datos y términos');
  }

  const consents = [
    { type: 'DATA_COLLECTION', name: accountName, accepted: true },
    { type: 'TERMS_AND_CONDITIONS', name: accountName, accepted: true },
  ];
  const info = {
    tax_id: taxId,
    document_type: taxCategory === 'company' ? 'RUT' : 'CI',
    document_number: documentNumber,
    registered_name: accountName,
    email,
    phone,
    is_so: Boolean(input.is_so),
    legal_address: {
      country: 'CL',
      city,
      zip_code: clean(input.zip_code, 12) || '0000000',
      address,
    },
  };
  if (input.document_expedition_date) info.document_expedition_date = clean(input.document_expedition_date, 10);

  if (taxCategory === 'individual') {
    info.is_pep = Boolean(input.is_pep);
  } else {
    if (!input.consent_contract || !input.consent_funds) {
      throw new Error('La empresa acepta efectos contractuales y declaración de fondos');
    }
    const registered = clean(input.registered_name, 120);
    const incorporation = clean(input.date_of_incorporation, 10);
    const repName = clean(input.rep_name, 100);
    const uboName = clean(input.ubo_name, 100);
    const ownership = Number(input.ownership_percentage);
    if (!registered || !incorporation || !repName || !uboName) {
      throw new Error('Razón social, fecha de constitución, representante y UBO son obligatorios');
    }
    if (!Number.isFinite(ownership) || ownership <= 0 || ownership > 100) {
      throw new Error('El porcentaje del UBO va entre 0 y 100');
    }
    consents.push(
      { type: 'CONTRACTUAL_EFFECTS', name: accountName, accepted: true },
      { type: 'DECLARATION_OF_FUNDS', name: accountName, accepted: true },
    );
    info.registered_name = registered;
    info.date_of_incorporation = incorporation;
    info.legal_representative = {
      name: repName,
      document_type: 'CI',
      document_number: documentNumber,
      tax_id: taxId,
      is_pep: Boolean(input.is_pep),
      email,
      phone,
      country: 'CL',
      city,
      address,
    };
    info.ubos = [{
      name: uboName,
      document_type: 'CI',
      document_number: documentNumber,
      tax_id: taxId,
      is_pep: Boolean(input.is_pep),
      email,
      phone,
      country: 'CL',
      city,
      address,
      ownership_percentage: ownership,
    }];
  }

  const settlement = Number(input.settlement_period || platform.settlement_period);
  if (!Number.isInteger(settlement) || settlement < 1 || settlement > 30) {
    throw new Error('El plazo de liquidación va de 1 a 30 días');
  }
  const external = clean(input.external_reference, 100) || `CL-${taxId.replace(/[^0-9kK]/g, '').toUpperCase()}`;
  return {
    rol,
    payload: {
      platform_type: platform.platform_type,
      tax_category: taxCategory,
      account_name: accountName,
      account_email: email,
      account_country: 'CL',
      account_external_reference: external,
      notification_url: notificationUrl(),
      consents,
      company_information: info,
      settings: {
        pricing_level: clean(input.pricing_level, 40) || platform.pricing_level,
        settlement_period: settlement,
      },
    },
  };
}

function signHeaders(rawBody) {
  const login = process.env.DLOCAL_PLATFORMS_LOGIN || '';
  const trans = process.env.DLOCAL_PLATFORMS_TRANS_KEY || '';
  const secret = process.env.DLOCAL_PLATFORMS_SECRET || '';
  if (!login || !trans || !secret) {
    throw new Error('Faltan DLOCAL_PLATFORMS_LOGIN, DLOCAL_PLATFORMS_TRANS_KEY y DLOCAL_PLATFORMS_SECRET');
  }
  const xDate = new Date().toISOString();
  const signature = crypto.createHmac('sha256', secret).update(login + xDate + rawBody).digest('hex');
  return {
    'Content-Type': 'application/json',
    'X-Date': xDate,
    'X-Login': login,
    'X-Trans-Key': trans,
    'X-Version': '2.1',
    'User-Agent': 'SICR3P-Platforms',
    Authorization: `V2-HMAC-SHA256, Signature: ${signature}`,
  };
}

async function createRemote(payload) {
  const raw = JSON.stringify(payload);
  const res = await fetch(`${baseUrl()}/v2/accounts`, {
    method: 'POST',
    headers: signHeaders(raw),
    body: raw,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`dLocal Platforms ${res.status}: ${text.slice(0, 280)}`);
  return JSON.parse(text);
}

export async function crearUserAccount(input) {
  const platform = ensurePlatform();
  const { rol, payload } = buildPayload(input, platform);
  const dup = db.prepare('SELECT id FROM baas_user_accounts WHERE external_reference = ?').get(payload.account_external_reference);
  if (dup) throw new Error('Esa referencia externa ya existe en esta cuenta Platform');

  let remote = null;
  if (platformsMode() !== 'simulator') remote = await createRemote(payload);

  const accountId = remote?.account_id || crypto.randomUUID();
  const meta = remote
    ? {
      status: remote.status || 'PENDING',
      status_code: Number(remote.status_code || 101),
      status_detail: remote.status_detail || 'documentation',
    }
    : STATUS_META.documentation;

  if (!STATUSES.includes(meta.status)) throw new Error('dLocal devolvió un status desconocido');

  const info = db.prepare(`
    INSERT INTO baas_user_accounts (
      account_id, external_reference, rol, tax_category, account_name, account_email, account_country,
      notification_url, status, status_code, status_detail, pricing_level, settlement_period, payload_json
    ) VALUES (?, ?, ?, ?, ?, ?, 'CL', ?, ?, ?, ?, ?, ?, ?)
  `).run(
    accountId,
    payload.account_external_reference,
    rol,
    payload.tax_category,
    payload.account_name,
    payload.account_email,
    payload.notification_url,
    meta.status,
    meta.status_code,
    meta.status_detail,
    payload.settings.pricing_level,
    payload.settings.settlement_period,
    JSON.stringify(payload),
  );
  const row = db.prepare('SELECT * FROM baas_user_accounts WHERE id = ?').get(info.lastInsertRowid);
  event(row, remote ? 'create_remote' : 'create', 'User account creada. Falta documentación para la revisión.');
  return present(row);
}

export function subirKyc({ id, file_name, original_name }) {
  const row = db.prepare('SELECT * FROM baas_user_accounts WHERE id = ?').get(Number(id));
  if (!row) throw new Error('User account no encontrada');
  if (!puedeActualizar(row.status, row.status_detail)) {
    throw new Error('dLocal no acepta documentos mientras la cuenta está en revisión o ya quedó cerrada');
  }
  const name = clean(file_name, 80);
  const allowed = new Set([...KYC_INDIVIDUAL, ...KYC_COMPANY, 'proof_of_address', 'tax_id', 'source_of_funds_declaration', 'other_document']);
  if (!allowed.has(name)) throw new Error('Ese nombre de archivo no está en el catálogo KYC de dLocal');
  db.prepare(`
    INSERT INTO baas_kyc_files (account_row_id, file_name, original_name)
    VALUES (?, ?, ?)
    ON CONFLICT(account_row_id, file_name) DO UPDATE SET original_name = excluded.original_name
  `).run(row.id, name, clean(original_name, 120) || name);

  const loaded = new Set(filesOf(row.id).map((f) => f.file_name));
  const complete = requiredFiles(row.tax_category).every((item) => loaded.has(item));
  let next = row;
  if (complete && row.status_detail === 'documentation') {
    next = setStatus(row, STATUS_META.compliance_review, 'kyc_completo', 'Documentos mínimos cargados. Pasa a compliance_review.');
  } else if (complete && row.status_detail === 'pending_documentation') {
    next = setStatus(row, STATUS_META.pending_compliance_review, 'kyc_completo', 'Documentos actualizados. Pasa a pending_compliance_review.');
  } else {
    event(row, 'kyc_archivo', name);
  }
  return present(next.id ? next : row);
}

export function actualizarSettings({ id, pricing_level, settlement_period }) {
  const row = db.prepare('SELECT * FROM baas_user_accounts WHERE id = ?').get(Number(id));
  if (!row) throw new Error('User account no encontrada');
  if (!puedeActualizar(row.status, row.status_detail)) {
    throw new Error('La configuración se edita solo cuando dLocal pide documentación');
  }
  const settlement = Number(settlement_period);
  if (!Number.isInteger(settlement) || settlement < 1 || settlement > 30) {
    throw new Error('El plazo de liquidación va de 1 a 30 días');
  }
  const level = clean(pricing_level, 40) || row.pricing_level;
  db.prepare(`
    UPDATE baas_user_accounts
    SET pricing_level = ?, settlement_period = ?, actualizado_en = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(level, settlement, row.id);
  const next = db.prepare('SELECT * FROM baas_user_accounts WHERE id = ?').get(row.id);
  event(next, 'settings', `${level} · ${settlement} días`);
  return present(next);
}

export function aplicarNotificacion(body) {
  const accountId = String(body.account_id || '').trim();
  if (!accountId) throw new Error('account_id requerido');
  const row = db.prepare('SELECT * FROM baas_user_accounts WHERE account_id = ?').get(accountId);
  if (!row) throw new Error('No hay una user account con ese account_id');
  const status = String(body.status || '').toUpperCase();
  const detail = String(body.status_detail || '').trim();
  if (!STATUSES.includes(status) || !detail) throw new Error('status y status_detail son obligatorios');
  const known = Object.values(STATUS_META).find((item) => item.status === status && item.status_detail === detail);
  const meta = known || {
    status,
    status_code: Number(body.status_code || 0),
    status_detail: detail,
  };
  const next = setStatus(row, meta, 'webhook', body.message || 'Notificación de dLocal');
  return present(next);
}

export function simularRevision({ id, decision }) {
  if (platformsMode() !== 'simulator') throw new Error('La revisión simulada solo corre en modo simulator');
  const row = db.prepare('SELECT * FROM baas_user_accounts WHERE id = ?').get(Number(id));
  if (!row) throw new Error('User account no encontrada');
  const reviewing = row.status_detail === 'compliance_review' || row.status_detail === 'pending_compliance_review';
  if (!reviewing) throw new Error('La revisión corre cuando el detalle es compliance_review');
  const map = {
    aprobar: STATUS_META.approved,
    trial: STATUS_META.trial_period,
    rechazar: STATUS_META.rejected,
    pedir_documentos: row.status === 'APPROVED' ? STATUS_META.pending_documentation : STATUS_META.documentation,
  };
  const meta = map[decision];
  if (!meta) throw new Error('Decisión inválida');
  const next = setStatus(row, meta, 'revision', decision);
  return present(next);
}

export function cambiarEstadoPlatform({ id, accion }) {
  const row = db.prepare('SELECT * FROM baas_user_accounts WHERE id = ?').get(Number(id));
  if (!row) throw new Error('User account no encontrada');
  if (row.status === 'CANCELED' || row.status === 'REJECTED') throw new Error('Ese estado es final');
  if (accion === 'bloquear') return present(setStatus(row, STATUS_META.blocked, 'platform', 'Bloqueada por la cuenta Platform'));
  if (accion === 'cancelar') return present(setStatus(row, STATUS_META.canceled, 'platform', 'Cancelada por la cuenta Platform'));
  throw new Error('Acción inválida');
}

export function snapshotOnboarding() {
  const platform = ensurePlatform();
  const cuentas = db.prepare('SELECT * FROM baas_user_accounts ORDER BY id DESC').all().map(present);
  const eventos = db.prepare(`
    SELECT e.*, a.account_name
    FROM baas_account_events e
    LEFT JOIN baas_user_accounts a ON a.id = e.account_row_id
    ORDER BY e.id DESC LIMIT 40
  `).all();
  const porStatus = cuentas.reduce((acc, cuenta) => {
    acc[cuenta.status] = (acc[cuenta.status] || 0) + 1;
    return acc;
  }, {});
  return {
    mode: platformsMode(),
    notification_url: notificationUrl(),
    platform,
    pasos: PASOS,
    kyc: { individual: KYC_INDIVIDUAL, company: KYC_COMPANY },
    cuentas,
    eventos,
    porStatus,
    operables: cuentas.filter((c) => c.capacidades.operable).length,
  };
}
