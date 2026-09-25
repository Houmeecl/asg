import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { exigirUsuarioSesion, puedeUsarFlujo } from '@/lib/auth';
import { resumenExpediente } from '@/lib/industrialService';
import { registrarActividadIndustrial } from '@/lib/trazabilidadIndustrial';

export async function GET(request) {
  const usuario = await exigirUsuarioSesion();
  if (!usuario) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  const proveedorId = new URL(request.url).searchParams.get('proveedor_id');
  const query = proveedorId
    ? `SELECT e.*, i.nombre AS instalacion FROM expedientes_industriales e LEFT JOIN instalaciones_industriales i ON i.id = e.instalacion_id WHERE e.proveedor_id = ? ORDER BY e.id DESC`
    : `SELECT e.*, p.razon_social AS proveedor, i.nombre AS instalacion FROM expedientes_industriales e JOIN empresas_proveedoras p ON p.id = e.proveedor_id LEFT JOIN instalaciones_industriales i ON i.id = e.instalacion_id ORDER BY e.id DESC`;
  const expedientes = (proveedorId ? db.prepare(query).all(proveedorId) : db.prepare(query).all()).filter((expediente) => puedeUsarFlujo(usuario, expediente.flujo));
  return NextResponse.json({ expedientes });
}

export async function POST(request) {
  const usuario = await exigirUsuarioSesion();
  if (!usuario) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  const { proveedor_id, instalacion_id = null, flujo, periodo, producto, lote = '', codigo_cn = '', pais_origen = 'CL', pais_destino = '' } = await request.json();
  if (!proveedor_id || !flujo || !periodo?.trim() || !producto?.trim()) return NextResponse.json({ error: 'Proveedor, flujo, período y producto son obligatorios.' }, { status: 400 });
  if (!['PROVEEDOR_MINERO', 'CBAM', 'CORREDOR_BIOCEANICO'].includes(flujo)) return NextResponse.json({ error: 'Flujo inválido.' }, { status: 400 });
  if (!puedeUsarFlujo(usuario, flujo)) return NextResponse.json({ error: 'Tu usuario no tiene permiso para este flujo.' }, { status: 403 });
  const result = db.prepare(`
    INSERT INTO expedientes_industriales (proveedor_id, instalacion_id, flujo, periodo, producto, lote, codigo_cn, pais_origen, pais_destino)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(proveedor_id, instalacion_id || null, flujo, periodo.trim(), producto.trim(), lote.trim(), codigo_cn.trim(), pais_origen, pais_destino.trim());
  registrarActividadIndustrial({
    expedienteId: result.lastInsertRowid,
    usuario,
    entidad: 'EXPEDIENTE',
    entidadId: result.lastInsertRowid,
    accion: 'EXPEDIENTE_CREADO',
    detalle: { proveedor_id, instalacion_id: instalacion_id || null, flujo, periodo: periodo.trim(), producto: producto.trim(), lote: lote.trim(), codigo_cn: codigo_cn.trim(), pais_origen, pais_destino: pais_destino.trim() },
  });
  return NextResponse.json({ id: result.lastInsertRowid, mensaje: 'Expediente industrial abierto.' }, { status: 201 });
}

export async function PATCH(request) {
  const usuario = await exigirUsuarioSesion();
  if (!usuario) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  const body = await request.json();
  const { id, estado } = body;
  if (body.accion === 'ACTUALIZAR_DATOS') {
    const expediente = db.prepare('SELECT flujo FROM expedientes_industriales WHERE id = ?').get(id);
    if (!expediente) return NextResponse.json({ error: 'Expediente inexistente.' }, { status: 404 });
    if (!puedeUsarFlujo(usuario, expediente.flujo)) return NextResponse.json({ error: 'Tu usuario no tiene permiso para este expediente.' }, { status: 403 });
    const { periodo, producto, lote = '', codigo_cn = '', pais_origen = 'CL', pais_destino = '' } = body;
    if (!periodo?.trim() || !producto?.trim()) return NextResponse.json({ error: 'Período y producto son obligatorios.' }, { status: 400 });
    db.prepare(`UPDATE expedientes_industriales SET periodo = ?, producto = ?, lote = ?, codigo_cn = ?, pais_origen = ?, pais_destino = ? WHERE id = ?`)
      .run(periodo.trim(), producto.trim(), lote.trim(), codigo_cn.trim(), pais_origen.trim(), pais_destino.trim(), id);
    registrarActividadIndustrial({
      expedienteId: id, usuario, entidad: 'EXPEDIENTE', entidadId: id, accion: 'EXPEDIENTE_DATOS_ACTUALIZADOS',
      detalle: { periodo: periodo.trim(), producto: producto.trim(), lote: lote.trim(), codigo_cn: codigo_cn.trim(), pais_origen: pais_origen.trim(), pais_destino: pais_destino.trim() },
    });
    return NextResponse.json({ expediente: resumenExpediente(id) });
  }
  if (!id || !['ABIERTO', 'EN_REVISION', 'PREPARADO_PARA_TERCERO', 'CERRADO'].includes(estado)) return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 });
  const expediente = db.prepare('SELECT flujo FROM expedientes_industriales WHERE id = ?').get(id);
  if (!expediente) return NextResponse.json({ error: 'Expediente inexistente.' }, { status: 404 });
  if (!puedeUsarFlujo(usuario, expediente.flujo)) return NextResponse.json({ error: 'Tu usuario no tiene permiso para este expediente.' }, { status: 403 });
  if (['PREPARADO_PARA_TERCERO', 'CERRADO'].includes(estado)) {
    const resumen = resumenExpediente(id);
    if (!resumen.plan_completitud.listo_para_revision) {
      return NextResponse.json({ error: `Aún hay ${resumen.plan_completitud.bloqueos_salida} requisito(s) estructural(es) pendiente(s). Completa el plan antes de marcar este expediente como preparado o cerrado.` }, { status: 409 });
    }
  }
  db.prepare('UPDATE expedientes_industriales SET estado = ? WHERE id = ?').run(estado, id);
  registrarActividadIndustrial({
    expedienteId: id,
    usuario,
    entidad: 'EXPEDIENTE',
    entidadId: id,
    accion: 'EXPEDIENTE_ESTADO_ACTUALIZADO',
    detalle: { estado },
  });
  return NextResponse.json({ expediente: resumenExpediente(id) });
}
