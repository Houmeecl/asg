import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { exigirUsuarioSesion, puedeAccederModulo } from '@/lib/auth';
import { resumenExpediente } from '@/lib/industrialService';
import { registrarActividadIndustrial } from '@/lib/trazabilidadIndustrial';

const APLICA = ['PENDIENTE', 'NO_APLICA', 'APLICA'];
const RIESGOS = ['NO_EVALUADO', 'BAJO', 'ESTANDAR', 'ALTO'];

export async function GET(_request, { params }) {
  const usuario = await exigirUsuarioSesion();
  if (!usuario) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  if (!puedeAccederModulo(usuario, 'CORREDOR')) return NextResponse.json({ error: 'Tu usuario no tiene permiso para Corredor/EUDR.' }, { status: 403 });

  const { id: expedienteId } = await params;
  const expediente = db.prepare('SELECT flujo FROM expedientes_industriales WHERE id = ?').get(expedienteId);
  if (!expediente) return NextResponse.json({ error: 'Expediente inexistente.' }, { status: 404 });
  if (expediente.flujo !== 'CORREDOR_BIOCEANICO') return NextResponse.json({ error: 'EUDR se registra dentro de expedientes del Corredor Bioceánico.' }, { status: 400 });
  const registros = db.prepare('SELECT * FROM eudr_corredor WHERE expediente_id = ? ORDER BY id DESC').all(expedienteId);
  return NextResponse.json({ registros, resumen: resumenExpediente(expedienteId) });
}

export async function POST(request, { params }) {
  const usuario = await exigirUsuarioSesion();
  if (!usuario) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  if (!puedeAccederModulo(usuario, 'CORREDOR')) return NextResponse.json({ error: 'Tu usuario no tiene permiso para Corredor/EUDR.' }, { status: 403 });

  const { id: expedienteId } = await params;
  const expediente = db.prepare('SELECT id, flujo FROM expedientes_industriales WHERE id = ?').get(expedienteId);
  if (!expediente) return NextResponse.json({ error: 'Expediente inexistente.' }, { status: 404 });
  if (expediente.flujo !== 'CORREDOR_BIOCEANICO') return NextResponse.json({ error: 'EUDR se registra dentro de expedientes del Corredor Bioceánico.' }, { status: 400 });

  const {
    aplica = 'PENDIENTE',
    producto_relevante = '',
    codigo_hs = '',
    materia_prima = '',
    pais_produccion = '',
    geolocalizacion = '',
    documento_legalidad = '',
    referencia_dds = '',
    nivel_riesgo = 'NO_EVALUADO',
    observacion = '',
  } = await request.json();

  if (!APLICA.includes(aplica)) return NextResponse.json({ error: 'Estado EUDR inválido.' }, { status: 400 });
  if (!RIESGOS.includes(nivel_riesgo)) return NextResponse.json({ error: 'Nivel de riesgo EUDR inválido.' }, { status: 400 });
  if (aplica === 'APLICA' && !producto_relevante.trim()) return NextResponse.json({ error: 'Si EUDR aplica, identifica el producto relevante.' }, { status: 400 });

  const result = db.prepare(`
    INSERT INTO eudr_corredor
    (expediente_id, aplica, producto_relevante, codigo_hs, materia_prima, pais_produccion, geolocalizacion, documento_legalidad, referencia_dds, nivel_riesgo, observacion)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    expedienteId,
    aplica,
    producto_relevante.trim(),
    codigo_hs.trim(),
    materia_prima.trim(),
    pais_produccion.trim(),
    geolocalizacion.trim(),
    documento_legalidad.trim(),
    referencia_dds.trim(),
    nivel_riesgo,
    observacion.trim()
  );

  registrarActividadIndustrial({
    expedienteId,
    usuario,
    entidad: 'EUDR_CORREDOR',
    entidadId: result.lastInsertRowid,
    accion: 'EUDR_EVALUACION_REGISTRADA',
    detalle: { aplica, producto_relevante: producto_relevante.trim(), codigo_hs: codigo_hs.trim(), pais_produccion: pais_produccion.trim(), nivel_riesgo },
  });

  return NextResponse.json({ id: result.lastInsertRowid, resumen: resumenExpediente(expedienteId) }, { status: 201 });
}
