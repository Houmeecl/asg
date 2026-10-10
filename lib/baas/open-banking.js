/**
 * Open Banking API layer over SICR3P BaaS (AIS + PIS).
 * Software/partner API — no emisor ni billetera pública.
 */
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { getSimulatorState, createPayout, simulateMerchantFunding } from './dlocal.js';
import { listOperaciones, getOperacion, crearOperacionEnvio } from './operations.js';

const OB_SCOPES = ['accounts:read', 'transactions:read', 'payments:write'];
const TOKEN_TTL_SEC = 3600;

function hashSecret(secret) {
  return bcrypt.hashSync(secret, 10);
}

function verifySecret(secret, hash) {
  return bcrypt.compareSync(secret, hash);
}

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(12).toString('hex')}`;
}

export function audit(clientId, action, path, detail) {
  db.prepare(
    `INSERT INTO ob_audit (client_id, action, path, detail) VALUES (?, ?, ?, ?)`,
  ).run(clientId || null, action, path || null, detail ? JSON.stringify(detail) : null);
}

export function listClients() {
  return db
    .prepare(
      `SELECT id, client_id, nombre, empresa_usuario_id, scopes_default, activo, creado_en
       FROM ob_clients ORDER BY id DESC`,
    )
    .all();
}

export function getClient(clientId) {
  return db.prepare(`SELECT * FROM ob_clients WHERE client_id = ?`).get(clientId);
}

export function createClient({ nombre, empresaUsuarioId, scopes }) {
  const clientId = newId('obc');
  const secret = `obs_${crypto.randomBytes(24).toString('hex')}`;
  const scopesDefault = (scopes || OB_SCOPES).join(' ');
  db.prepare(
    `INSERT INTO ob_clients (client_id, client_secret_hash, nombre, empresa_usuario_id, scopes_default)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(clientId, hashSecret(secret), nombre, empresaUsuarioId || null, scopesDefault);
  audit(clientId, 'client.create', null, { nombre });
  return { client_id: clientId, client_secret: secret, scopes_default: scopesDefault };
}

export function seedDemoOpenBankingClient() {
  const existing = db.prepare(`SELECT client_id FROM ob_clients WHERE nombre = ?`).get('Demo Open Banking');
  if (existing) return { client_id: existing.client_id, seeded: false };
  const empresa = db.prepare(`SELECT id FROM usuarios WHERE email = ?`).get('empresa@sicr3p.cl');
  const created = createClient({
    nombre: 'Demo Open Banking',
    empresaUsuarioId: empresa?.id || null,
    scopes: OB_SCOPES,
  });
  // Persist demo secret once for local/dev (hash remains canonical for auth)
  db.prepare(
    `INSERT INTO ob_audit (client_id, action, path, detail) VALUES (?, 'client.demo_secret', NULL, ?)`,
  ).run(created.client_id, JSON.stringify({ client_secret: created.client_secret }));
  return { ...created, seeded: true };
}

export function getDemoClientSecret(clientId) {
  const row = db
    .prepare(
      `SELECT detail FROM ob_audit WHERE client_id = ? AND action = 'client.demo_secret' ORDER BY id DESC LIMIT 1`,
    )
    .get(clientId);
  if (!row?.detail) return null;
  try {
    return JSON.parse(row.detail).client_secret || null;
  } catch {
    return null;
  }
}

export function verifyClientCredentials(clientId, clientSecret) {
  const client = getClient(clientId);
  if (!client || !client.activo) return false;
  return verifySecret(clientSecret, client.client_secret_hash);
}

export function issueToken({ clientId, clientSecret, consentId, scopes }) {
  const client = getClient(clientId);
  if (!client || !client.activo) throw new Error('invalid_client');
  if (!verifySecret(clientSecret, client.client_secret_hash)) throw new Error('invalid_client');

  let scopeList = (scopes || client.scopes_default || '').split(/\s+/).filter(Boolean);
  let consent = null;
  if (consentId) {
    consent = db.prepare(`SELECT * FROM ob_consents WHERE consent_id = ?`).get(consentId);
    if (!consent || consent.client_id !== clientId) throw new Error('invalid_consent');
    if (consent.status !== 'AUTHORISED') throw new Error('consent_not_authorised');
    if (consent.expires_at && new Date(consent.expires_at) < new Date()) {
      db.prepare(`UPDATE ob_consents SET status = 'EXPIRED' WHERE id = ?`).run(consent.id);
      throw new Error('consent_expired');
    }
    scopeList = consent.scopes.split(/\s+/).filter(Boolean);
  }

  const accessToken = newId('oba');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_SEC * 1000).toISOString();
  db.prepare(
    `INSERT INTO ob_tokens (access_token, client_id, consent_id, scopes, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(accessToken, clientId, consent?.consent_id || null, scopeList.join(' '), expiresAt);
  audit(clientId, 'token.issue', '/auth/token', { consent_id: consent?.consent_id, scopes: scopeList });
  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: TOKEN_TTL_SEC,
    scope: scopeList.join(' '),
    consent_id: consent?.consent_id || null,
  };
}

export function authenticateBearer(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  const row = db.prepare(`SELECT * FROM ob_tokens WHERE access_token = ?`).get(token);
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) return null;
  const client = getClient(row.client_id);
  if (!client?.activo) return null;
  let consent = null;
  if (row.consent_id) {
    consent = db.prepare(`SELECT * FROM ob_consents WHERE consent_id = ?`).get(row.consent_id);
    if (!consent || consent.status !== 'AUTHORISED') return null;
  }
  return {
    token: row,
    client,
    consent,
    scopes: new Set(row.scopes.split(/\s+/).filter(Boolean)),
  };
}

export function requireScope(auth, scope) {
  if (!auth?.scopes?.has(scope)) {
    const err = new Error('insufficient_scope');
    err.status = 403;
    throw err;
  }
}

export function createConsent({ clientId, empresaUsuarioId, scopes, ttlHours = 24 }) {
  const client = getClient(clientId);
  if (!client) throw new Error('invalid_client');
  const scopeList = (scopes || client.scopes_default.split(/\s+/)).filter((s) => OB_SCOPES.includes(s));
  if (!scopeList.length) throw new Error('invalid_scopes');
  const consentId = newId('obn');
  const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();
  db.prepare(
    `INSERT INTO ob_consents (consent_id, client_id, empresa_usuario_id, scopes, status, expires_at)
     VALUES (?, ?, ?, ?, 'AWAITING_AUTHORISATION', ?)`,
  ).run(consentId, clientId, empresaUsuarioId, scopeList.join(' '), expiresAt);
  audit(clientId, 'consent.create', '/consents', { consent_id: consentId, scopes: scopeList });
  return getConsent(consentId);
}

export function getConsent(consentId) {
  return db.prepare(`SELECT * FROM ob_consents WHERE consent_id = ?`).get(consentId);
}

export function authoriseConsent(consentId) {
  const c = getConsent(consentId);
  if (!c) throw new Error('consent_not_found');
  if (c.status === 'REVOKED' || c.status === 'EXPIRED') throw new Error('consent_not_active');
  db.prepare(
    `UPDATE ob_consents SET status = 'AUTHORISED', autorizado_en = CURRENT_TIMESTAMP WHERE consent_id = ?`,
  ).run(consentId);
  audit(c.client_id, 'consent.authorise', `/consents/${consentId}`);
  return getConsent(consentId);
}

export function revokeConsent(consentId) {
  const c = getConsent(consentId);
  if (!c) throw new Error('consent_not_found');
  db.prepare(`UPDATE ob_consents SET status = 'REVOKED' WHERE consent_id = ?`).run(consentId);
  audit(c.client_id, 'consent.revoke', `/consents/${consentId}`);
  return getConsent(consentId);
}

export function listConsents({ clientId } = {}) {
  if (clientId) {
    return db.prepare(`SELECT * FROM ob_consents WHERE client_id = ? ORDER BY id DESC LIMIT 50`).all(clientId);
  }
  return db.prepare(`SELECT * FROM ob_consents ORDER BY id DESC LIMIT 50`).all();
}

/** AIS: merchant / wallet accounts for the consented empresa. */
export function getAccounts(auth) {
  requireScope(auth, 'accounts:read');
  const empresaId = auth.consent?.empresa_usuario_id || auth.client.empresa_usuario_id;
  const sim = getSimulatorState();
  const wallets = db
    .prepare(
      `SELECT w.wallet_id, w.tarjeta_virtual_id, w.estado, p.rut, p.nombre
       FROM baas_wallets w
       JOIN baas_personas p ON p.id = w.persona_id
       ORDER BY w.id DESC LIMIT 20`,
    )
    .all();

  const accounts = [
    {
      accountId: `merchant-${empresaId || 'demo'}`,
      currency: 'CLP',
      accountType: 'Business',
      nickname: 'Saldo merchant operativo sicr3p/',
      balances: [{ type: 'InterimAvailable', amount: String(sim.balance || 0), currency: 'CLP' }],
      status: 'Enabled',
    },
    ...wallets.map((w) => ({
      accountId: w.wallet_id,
      currency: 'CLP',
      accountType: 'Personal',
      nickname: w.nombre || w.rut,
      schemeName: 'CL.RUT',
      identification: w.rut,
      cardId: w.tarjeta_virtual_id,
      status: w.estado,
      balances: [{ type: 'InterimAvailable', amount: '0', currency: 'CLP' }],
    })),
  ];
  return { Data: { Account: accounts } };
}

export function getTransactions(auth, accountId) {
  requireScope(auth, 'transactions:read');
  const ops = listOperaciones({ limit: 40 });
  const txs = ops
    .filter((o) => {
      if (accountId?.startsWith('merchant-')) return true;
      return true;
    })
    .map((o) => ({
      transactionId: o.codigo,
      accountId: accountId || `merchant-${auth.consent?.empresa_usuario_id || 'demo'}`,
      creditDebitIndicator: o.modo === 'TURISTA_QR' ? 'Credit' : 'Debit',
      status: o.estado,
      bookingDateTime: o.creado_en,
      amount: { amount: String(o.monto_clp), currency: 'CLP' },
      transactionInformation: o.nota || o.modo,
      proprietaryBankTransactionCode: o.estado,
    }));
  return { Data: { Transaction: txs } };
}

export async function initiatePayment(auth, body) {
  requireScope(auth, 'payments:write');
  const amount = Number(body?.amount ?? body?.InstructedAmount?.Amount);
  if (!amount || amount < 1) throw new Error('invalid_amount');
  const currency = body?.currency || body?.InstructedAmount?.Currency || 'CLP';
  const creditorName = body?.creditorName || body?.CreditorAccount?.Name || 'Beneficiario';
  const creditorAccount = body?.creditorAccount || body?.CreditorAccount?.Identification || '';
  const bankCode = body?.bankCode || body?.CreditorAccount?.SchemeName || '';
  const reference = body?.reference || body?.RemittanceInformation?.Unstructured || `OB-${Date.now()}`;
  const rutEmisor = body?.debtorRut || '11.111.111-1';

  const empresaId = auth.consent?.empresa_usuario_id || auth.client.empresa_usuario_id;
  const { operacion } = crearOperacionEnvio({
    montoClp: amount,
    paisDestino: body?.country || 'CL',
    monedaDestino: currency,
    rutEmisor,
    empresaUsuarioId: empresaId,
  });

  const paymentId = newId('obp');
  db.prepare(
    `INSERT INTO ob_payments
      (payment_id, consent_id, client_id, status, amount_clp, currency, creditor_name, creditor_account, creditor_bank_code, reference, operacion_id)
     VALUES (?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    paymentId,
    auth.consent.consent_id,
    auth.client.client_id,
    amount,
    currency,
    creditorName,
    creditorAccount,
    bankCode,
    reference,
    operacion.id,
  );

  // Auto-advance in simulator: fund + payout stub when READY
  let status = 'Pending';
  let dlocalPayoutId = null;
  if (operacion.estado === 'PENDIENTE_COBRO' || operacion.estado === 'PENDIENTE_REGISTRO') {
    status = 'AcceptedSettlementInProcess';
    simulateMerchantFunding(amount);
    try {
      const payout = await createPayout({
        amount,
        currency,
        country: body?.country || 'CL',
        externalId: paymentId,
        beneficiary: {
          name: creditorName,
          bank_account: creditorAccount,
          bank_code: bankCode || '1',
          document_id: body?.creditorDocument || '111111111',
        },
        description: reference,
      });
      dlocalPayoutId = payout.payout_id || payout.id || null;
      status = 'AcceptedSettlementCompleted';
      db.prepare(`UPDATE baas_operaciones SET estado = 'ENVIADA', dlocal_payout_id = ? WHERE id = ?`).run(
        dlocalPayoutId,
        operacion.id,
      );
    } catch (err) {
      status = 'Rejected';
      audit(auth.client.client_id, 'payment.reject', `/payments/${paymentId}`, { error: err.message });
    }
  }

  db.prepare(
    `UPDATE ob_payments SET status = ?, dlocal_payout_id = ?, actualizado_en = CURRENT_TIMESTAMP WHERE payment_id = ?`,
  ).run(status, dlocalPayoutId, paymentId);

  audit(auth.client.client_id, 'payment.create', `/payments/${paymentId}`, { amount, status });
  return getPayment(paymentId);
}

export function getPayment(paymentId) {
  const p = db.prepare(`SELECT * FROM ob_payments WHERE payment_id = ?`).get(paymentId);
  if (!p) return null;
  const op = p.operacion_id ? getOperacion(p.operacion_id) : null;
  return {
    Data: {
      PaymentId: p.payment_id,
      ConsentId: p.consent_id,
      Status: p.status,
      CreationDateTime: p.creado_en,
      StatusUpdateDateTime: p.actualizado_en,
      Initiation: {
        InstructedAmount: { Amount: String(p.amount_clp), Currency: p.currency },
        CreditorAccount: {
          Name: p.creditor_name,
          Identification: p.creditor_account,
          SchemeName: p.creditor_bank_code,
        },
        RemittanceInformation: { Unstructured: p.reference },
      },
      SupplementaryData: {
        operacionCodigo: op?.codigo,
        dlocalPayoutId: p.dlocal_payout_id,
      },
    },
  };
}

export function listPayments({ clientId } = {}) {
  if (clientId) {
    return db.prepare(`SELECT * FROM ob_payments WHERE client_id = ? ORDER BY id DESC LIMIT 50`).all(clientId);
  }
  return db.prepare(`SELECT * FROM ob_payments ORDER BY id DESC LIMIT 50`).all();
}

export function listAudit(limit = 40) {
  return db.prepare(`SELECT * FROM ob_audit ORDER BY id DESC LIMIT ?`).all(limit);
}

export { OB_SCOPES };
