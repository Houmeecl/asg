import db from '../db.js';
import { listPersonas } from './wallet.js';

export function listTerminales() {
  return db.prepare('SELECT * FROM baas_terminales ORDER BY id DESC').all();
}

export function registrarTerminal({ alias, serial, modelo = 'SUNMI', comercioRut }) {
  if (!alias || !serial) throw new Error('Alias y serial son requeridos');
  const existing = db.prepare('SELECT * FROM baas_terminales WHERE serial = ?').get(serial.trim());
  if (existing) return existing;
  const info = db.prepare(`
    INSERT INTO baas_terminales (alias, serial, modelo, comercio_rut, estado)
    VALUES (?, ?, ?, ?, 'DESCONECTADO')
  `).run(alias.trim(), serial.trim(), modelo, comercioRut || null);
  return db.prepare('SELECT * FROM baas_terminales WHERE id = ?').get(info.lastInsertRowid);
}

export function setTerminalEstado(id, estado) {
  const row = db.prepare('SELECT * FROM baas_terminales WHERE id = ?').get(id);
  if (!row) throw new Error('Terminal no encontrada');
  const latido = estado === 'CONECTADO' ? new Date().toISOString() : row.ultimo_latido;
  db.prepare(`
    UPDATE baas_terminales SET estado = ?, ultimo_latido = ? WHERE id = ?
  `).run(estado, latido, id);
  return db.prepare('SELECT * FROM baas_terminales WHERE id = ?').get(id);
}

export function analisisPos() {
  const porEstado = db.prepare(`
    SELECT estado, COUNT(*) AS n, COALESCE(SUM(monto_clp), 0) AS monto
    FROM baas_operaciones
    GROUP BY estado
  `).all();
  const porKyc = db.prepare(`
    SELECT kyc_estado, COUNT(*) AS n FROM baas_personas GROUP BY kyc_estado
  `).all();
  const recientes = db.prepare(`
    SELECT o.codigo, o.estado, o.monto_clp, o.modo, o.tuu_sequence, o.creado_en, p.nombre, p.rut, p.kyc_estado
    FROM baas_operaciones o
    LEFT JOIN baas_personas p ON p.id = o.persona_id
    ORDER BY o.id DESC
    LIMIT 12
  `).all();
  const terminales = listTerminales();
  return {
    operaciones: porEstado,
    kyc: porKyc,
    recientes,
    terminalesConectadas: terminales.filter((t) => t.estado === 'CONECTADO').length,
    terminalesTotal: terminales.length,
    pendientesKyc: porKyc
      .filter((r) => r.kyc_estado === 'PENDIENTE' || r.kyc_estado === 'EN_REVISION')
      .reduce((n, r) => n + r.n, 0),
  };
}

export function snapshotPosPortal() {
  return {
    terminales: listTerminales(),
    personas: listPersonas(),
    analisis: analisisPos(),
  };
}
