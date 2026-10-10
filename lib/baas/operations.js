import crypto from 'crypto';
import db from '../db.js';
import { mockTuuCharge } from './tuu.js';
import { createPayout, simulateMerchantFunding, getSimulatorState } from './dlocal.js';
import { startRegistroOrGetWallet, completeKycAndCreateVirtualCard } from './wallet.js';

function codigo() {
  const part = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `S3-${part()}-${part()}`;
}

export function listOperaciones({ limit = 50 } = {}) {
  return db.prepare(`
    SELECT o.*, p.rut AS persona_rut, p.nombre AS persona_nombre, w.tarjeta_virtual_id, w.wallet_id
    FROM baas_operaciones o
    LEFT JOIN baas_personas p ON p.id = o.persona_id
    LEFT JOIN baas_wallets w ON w.persona_id = o.persona_id
    ORDER BY o.id DESC
    LIMIT ?
  `).all(limit);
}

export function getOperacion(id) {
  return db.prepare('SELECT * FROM baas_operaciones WHERE id = ?').get(id);
}

export function getOperacionByCodigo(codigoOp) {
  return db.prepare('SELECT * FROM baas_operaciones WHERE codigo = ?').get(codigoOp);
}

/** Flujo envío: RUT emisor → wallet o QR registro KYC. */
export function crearOperacionEnvio({ montoClp, paisDestino = 'PE', monedaDestino = 'PEN', rutEmisor, empresaUsuarioId, beneficiarioId }) {
  const reg = startRegistroOrGetWallet(rutEmisor);
  const cod = codigo();
  const estado = reg.status === 'READY' ? 'PENDIENTE_COBRO' : 'PENDIENTE_REGISTRO';
  const info = db.prepare(`
    INSERT INTO baas_operaciones
      (codigo, modo, estado, monto_clp, pais_destino, moneda_destino, persona_id, beneficiario_id, empresa_usuario_id)
    VALUES (?, 'ENVIO', ?, ?, ?, ?, ?, ?, ?)
  `).run(cod, estado, Number(montoClp), paisDestino, monedaDestino, reg.persona.id, beneficiarioId || null, empresaUsuarioId || null);

  return {
    operacion: getOperacion(info.lastInsertRowid),
    registro: reg,
  };
}

/** Modo turista: cobro por QR (no tarjeta TUU en el momento). */
export function crearOperacionTurista({ montoClp, empresaUsuarioId, nota }) {
  const token = crypto.randomBytes(12).toString('hex');
  const cod = codigo();
  const info = db.prepare(`
    INSERT INTO baas_operaciones
      (codigo, modo, estado, monto_clp, pais_destino, moneda_destino, empresa_usuario_id, tourist_qr_token, nota)
    VALUES (?, 'TURISTA_QR', 'PENDIENTE_COBRO', ?, 'CL', 'CLP', ?, ?, ?)
  `).run(cod, Number(montoClp), empresaUsuarioId || null, token, nota || 'Pago turista');

  return {
    operacion: getOperacion(info.lastInsertRowid),
    payPath: `/pagar/${token}`,
  };
}

export function getOperacionByTouristToken(token) {
  return db.prepare(`SELECT * FROM baas_operaciones WHERE tourist_qr_token = ?`).get(token);
}

export async function cobrarConTuuMock(operacionId) {
  const op = getOperacion(operacionId);
  if (!op) throw new Error('Operación no encontrada');
  if (op.modo === 'TURISTA_QR') throw new Error('Esta operación se cobra por QR turista, no por TUU');
  if (op.estado === 'PENDIENTE_REGISTRO') throw new Error('El emisor debe completar registro KYC primero');

  const result = await mockTuuCharge({ amount: op.monto_clp, reference: op.codigo });
  if (!result.approved) {
    db.prepare(`UPDATE baas_operaciones SET estado = 'RECHAZADA', nota = ? WHERE id = ?`)
      .run(result.errorMessage || 'Rechazado', op.id);
    return { ok: false, result, operacion: getOperacion(op.id) };
  }

  db.prepare(`UPDATE baas_operaciones SET estado = 'COBRADA', tuu_sequence = ? WHERE id = ?`)
    .run(result.sequenceNumber, op.id);
  simulateMerchantFunding(op.monto_clp);
  return { ok: true, result, operacion: getOperacion(op.id) };
}

/** Marca cobro turista (simula pay-in dLocal / link pagado). */
export function marcarCobroTurista(token) {
  const op = getOperacionByTouristToken(token);
  if (!op) throw new Error('Pago no encontrado');
  db.prepare(`UPDATE baas_operaciones SET estado = 'COBRADA', dlocal_payment_id = ? WHERE id = ?`)
    .run(`DP-TUR-${Date.now()}`, op.id);
  simulateMerchantFunding(op.monto_clp);
  return getOperacion(op.id);
}

export function cerrarLote() {
  const pendientes = db.prepare(`SELECT * FROM baas_operaciones WHERE estado = 'COBRADA'`).all();
  if (!pendientes.length) return null;
  const ref = `LOTE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;
  const monto = pendientes.reduce((s, o) => s + o.monto_clp, 0);
  const lote = db.prepare(`INSERT INTO baas_lotes (referencia, estado, monto_esperado) VALUES (?, 'CERRADO', ?)`)
    .run(ref, monto);
  const link = db.prepare(`INSERT INTO baas_lote_ops (lote_id, operacion_id) VALUES (?, ?)`);
  const upd = db.prepare(`UPDATE baas_operaciones SET estado = 'EN_LOTE' WHERE id = ?`);
  for (const o of pendientes) {
    link.run(lote.lastInsertRowid, o.id);
    upd.run(o.id);
  }
  return db.prepare('SELECT * FROM baas_lotes WHERE id = ?').get(lote.lastInsertRowid);
}

export async function liberarLoteConDlocal(loteId) {
  const lote = db.prepare('SELECT * FROM baas_lotes WHERE id = ?').get(loteId);
  if (!lote) throw new Error('Lote no encontrado');
  const ops = db.prepare(`
    SELECT o.* FROM baas_operaciones o
    JOIN baas_lote_ops lo ON lo.operacion_id = o.id
    WHERE lo.lote_id = ?
  `).all(loteId);

  db.prepare(`UPDATE baas_lotes SET estado = 'FONDEADO', transferido_en = CURRENT_TIMESTAMP WHERE id = ?`).run(loteId);

  const results = [];
  for (const op of ops) {
    const payout = await createPayout({
      transfer_amount: op.monto_clp,
      transfer_country: op.pais_destino,
      flow_type: 'B2C',
      purpose: 'SERVICE_PAYMENT',
      beneficiary_first_name: 'Beneficiario',
      beneficiary_last_name: op.codigo,
      beneficiary_document: '111111111',
      beneficiary_document_type: op.pais_destino === 'CL' ? 'RUT' : 'ID',
      bank_code: '1',
      bank_account: '000000001',
      bank_branch: '001',
      bank_account_type: 'CHECKING',
      currency_to_pay: op.moneda_destino,
      description: `SICR3P ${op.codigo}`,
    });
    db.prepare(`UPDATE baas_operaciones SET estado = 'ENVIADA', dlocal_payout_id = ? WHERE id = ?`)
      .run(payout.payout_id, op.id);
    results.push({ operacionId: op.id, payout });
  }

  db.prepare(`UPDATE baas_lotes SET estado = 'LIBERADO' WHERE id = ?`).run(loteId);
  return { lote: db.prepare('SELECT * FROM baas_lotes WHERE id = ?').get(loteId), results, simulator: getSimulatorState() };
}

export function listLotes() {
  return db.prepare('SELECT * FROM baas_lotes ORDER BY id DESC LIMIT 50').all();
}

export function dashboardStats() {
  const rows = db.prepare(`
    SELECT estado, COUNT(*) AS n, COALESCE(SUM(monto_clp),0) AS monto
    FROM baas_operaciones GROUP BY estado
  `).all();
  const by = Object.fromEntries(rows.map((r) => [r.estado, r]));
  return {
    total: rows.reduce((s, r) => s + r.n, 0),
    montoMes: rows.reduce((s, r) => s + r.monto, 0),
    pendientes: (by.PENDIENTE_COBRO?.n || 0) + (by.PENDIENTE_REGISTRO?.n || 0) + (by.EN_LOTE?.n || 0),
    pagadas: by.PAGADA?.n || 0,
    cobradas: by.COBRADA?.n || 0,
    enviadas: by.ENVIADA?.n || 0,
    dlocal: getSimulatorState(),
  };
}

export function seedDemoBaas() {
  const existing = db.prepare(`SELECT id, kyc_estado FROM baas_personas WHERE rut IN ('11.111.111-1','111111111')`).get();
  if (existing?.kyc_estado === 'APROBADO') return;
  const reg = startRegistroOrGetWallet('11.111.111-1', { nombreHint: 'Cliente Demo' });
  if (reg.status === 'READY') return;
  const token = reg.persona.registro_token || db.prepare('SELECT registro_token FROM baas_personas WHERE id = ?').get(reg.persona.id)?.registro_token;
  if (!token) return;
  completeKycAndCreateVirtualCard(token, {
    nombre: 'Cliente Demo Pérez',
    email: 'cliente@demo.cl',
    telefono: '+56911111111',
  });
}
