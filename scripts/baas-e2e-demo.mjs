/**
 * Demo e2e: mock TUU + simulador dLocal (sin servidor HTTP).
 * Uso: node scripts/baas-e2e-demo.mjs
 */
import db from '../lib/db.js';
import {
  crearOperacionEnvio,
  cobrarConTuuMock,
  cerrarLote,
  liberarLoteConDlocal,
  crearOperacionTurista,
  marcarCobroTurista,
  dashboardStats,
} from '../lib/baas/operations.js';
import { completeKycAndCreateVirtualCard, startRegistroOrGetWallet } from '../lib/baas/wallet.js';
import { getSimulatorState } from '../lib/baas/dlocal.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const rutNuevo = `22.222.222-${Math.floor(Math.random() * 9)}`;

console.log('1) Operación con RUT nuevo → PENDIENTE_REGISTRO');
const { operacion: op1, registro } = crearOperacionEnvio({
  montoClp: 20000,
  paisDestino: 'PE',
  monedaDestino: 'PEN',
  rutEmisor: rutNuevo,
  empresaUsuarioId: 1,
});
assert(op1.estado === 'PENDIENTE_REGISTRO', `esperado PENDIENTE_REGISTRO, got ${op1.estado}`);
assert(registro.status === 'NEEDS_KYC', 'debe pedir KYC');

console.log('2) Completar KYC + wallet virtual');
const kyc = completeKycAndCreateVirtualCard(registro.persona.registro_token, {
  nombre: 'Emisor E2E',
  email: 'e2e@demo.cl',
  telefono: '+56900000000',
});
assert(kyc.wallet?.tarjeta_virtual_id, 'wallet virtual');

// Reabrir: marcar pendiente cobro (flujo real: POS reintenta tras KYC)
db.prepare(`UPDATE baas_operaciones SET estado = 'PENDIENTE_COBRO' WHERE id = ?`).run(op1.id);

console.log('3) Cobro TUU mock');
const charge = await cobrarConTuuMock(op1.id);
assert(charge.ok, 'cobro debe aprobar');
assert(charge.operacion.estado === 'COBRADA', 'estado COBRADA');

console.log('4) Turista QR + pay-in sim');
const tur = crearOperacionTurista({ montoClp: 9000, empresaUsuarioId: 1, nota: 'e2e' });
const paid = marcarCobroTurista(tur.operacion.tourist_qr_token);
assert(paid.estado === 'COBRADA', 'turista COBRADA');

console.log('5) Cerrar lote + liberar dLocal');
const lote = cerrarLote();
assert(lote, 'lote creado');
const liberado = await liberarLoteConDlocal(lote.id);
assert(liberado.lote.estado === 'LIBERADO', 'lote LIBERADO');
assert(liberado.results.length >= 1, 'payouts');

const sim = getSimulatorState();
const stats = dashboardStats();
console.log('OK e2e', {
  balance: sim.balance,
  payouts: sim.payouts.length,
  stats,
  readyRut: startRegistroOrGetWallet('11.111.111-1').status,
});
