import crypto from 'crypto';
import db from '@/lib/db';

function canonizar(valor) {
  if (Array.isArray(valor)) return valor.map(canonizar);
  if (valor && typeof valor === 'object') {
    return Object.keys(valor).sort().reduce((resultado, clave) => {
      resultado[clave] = canonizar(valor[clave]);
      return resultado;
    }, {});
  }
  return valor;
}

export function registrarActividadIndustrial({ expedienteId = null, usuario = null, entidad, entidadId = null, accion, detalle = {} }) {
  const anterior = db.prepare('SELECT hash_evento FROM trazabilidad_industrial ORDER BY id DESC LIMIT 1').get();
  const fecha = new Date().toISOString();
  const detalleJson = JSON.stringify(canonizar(detalle));
  const contenido = [anterior?.hash_evento || 'GENESIS', expedienteId || '', usuario?.id || '', entidad, entidadId || '', accion, detalleJson, fecha].join('|');
  const hashEvento = crypto.createHash('sha256').update(contenido).digest('hex');
  const resultado = db.prepare(`
    INSERT INTO trazabilidad_industrial (expediente_id, usuario_id, entidad, entidad_id, accion, detalle_json, hash_anterior, hash_evento, fecha_registro)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(expedienteId, usuario?.id || null, entidad, entidadId, accion, detalleJson, anterior?.hash_evento || null, hashEvento, fecha);
  return { id: resultado.lastInsertRowid, hashEvento };
}

export function actividadesDelExpediente(expedienteId) {
  return db.prepare(`
    SELECT t.*, u.nombre AS usuario_nombre, u.email AS usuario_email
    FROM trazabilidad_industrial t
    LEFT JOIN usuarios u ON u.id = t.usuario_id
    WHERE t.expediente_id = ?
    ORDER BY t.id DESC
  `).all(expedienteId);
}
