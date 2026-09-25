import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { exigirUsuarioSesion, puedeAccederModulo } from '@/lib/auth';
import { resumenExpediente } from '@/lib/industrialService';
import { registrarActividadIndustrial } from '@/lib/trazabilidadIndustrial';

export async function POST(request, { params }) {
  const usuario = await exigirUsuarioSesion();
  if (!usuario) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  if (!puedeAccederModulo(usuario, 'CORREDOR')) return NextResponse.json({ error: 'Tu usuario no tiene permiso para Corredor/EUDR.' }, { status: 403 });
  const { id: expedienteId } = await params;
  const expediente = db.prepare('SELECT flujo FROM expedientes_industriales WHERE id = ?').get(expedienteId);
  if (!expediente) return NextResponse.json({ error: 'Expediente inexistente.' }, { status: 404 });
  if (expediente.flujo !== 'CORREDOR_BIOCEANICO') return NextResponse.json({ error: 'Los hitos se registran en expedientes del Corredor Bioceánico.' }, { status: 400 });
  const { etapa, actor, pais, estado = 'PENDIENTE', referencia = '', norma_referencia = '', documento_requerido = '', fecha_hito = '' } = await request.json();
  if (!['PRODUCTOR_ORIGEN', 'EXPORTADOR', 'TRANSPORTE', 'ADUANA_PUERTO', 'IMPORTADOR_DESTINO'].includes(etapa) || !actor?.trim() || !pais?.trim()) {
    return NextResponse.json({ error: 'Etapa, actor y país son obligatorios.' }, { status: 400 });
  }
  if (!['PENDIENTE', 'DOCUMENTADO', 'VALIDADO_EN_FUENTE'].includes(estado)) return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 });
  const result = db.prepare(`INSERT INTO hitos_corredor (expediente_id, etapa, actor, pais, estado, referencia, norma_referencia, documento_requerido, fecha_hito) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(expedienteId, etapa, actor.trim(), pais.trim(), estado, referencia.trim(), norma_referencia.trim(), documento_requerido.trim(), fecha_hito || null);
  registrarActividadIndustrial({
    expedienteId,
    usuario,
    entidad: 'HITO_CORREDOR',
    entidadId: result.lastInsertRowid,
    accion: 'HITO_REGISTRADO',
    detalle: { etapa, actor: actor.trim(), pais: pais.trim(), estado, referencia: referencia.trim(), norma_referencia: norma_referencia.trim(), documento_requerido: documento_requerido.trim(), fecha_hito: fecha_hito || null },
  });
  return NextResponse.json({ id: result.lastInsertRowid, resumen: resumenExpediente(expedienteId) }, { status: 201 });
}
