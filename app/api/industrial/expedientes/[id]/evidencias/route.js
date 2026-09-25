import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import db from '@/lib/db';
import { exigirUsuarioSesion, puedeUsarFlujo } from '@/lib/auth';
import { BLOQUES_EVIDENCIA, resumenExpediente } from '@/lib/industrialService';
import { registrarActividadIndustrial } from '@/lib/trazabilidadIndustrial';

const UPLOADS_DIR = path.resolve(process.cwd(), 'data', 'uploads');

export async function GET(_request, { params }) {
  const usuario = await exigirUsuarioSesion();
  if (!usuario) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  const { id } = await params;
  const expediente = db.prepare('SELECT flujo FROM expedientes_industriales WHERE id = ?').get(id);
  if (!expediente) return NextResponse.json({ error: 'Expediente inexistente.' }, { status: 404 });
  if (!puedeUsarFlujo(usuario, expediente.flujo)) return NextResponse.json({ error: 'Tu usuario no tiene permiso para este expediente.' }, { status: 403 });
  const evidencias = db.prepare(`SELECT * FROM evidencias_industriales WHERE expediente_id = ? ORDER BY fecha_registro DESC, id DESC`).all(id);
  return NextResponse.json({ evidencias, resumen: resumenExpediente(id) });
}

export async function POST(request, { params }) {
  const usuario = await exigirUsuarioSesion();
  if (!usuario) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  const { id: expedienteId } = await params;
  const expediente = db.prepare('SELECT id, flujo FROM expedientes_industriales WHERE id = ?').get(expedienteId);
  if (!expediente) return NextResponse.json({ error: 'Expediente inexistente.' }, { status: 404 });
  if (!puedeUsarFlujo(usuario, expediente.flujo)) return NextResponse.json({ error: 'Tu usuario no tiene permiso para este expediente.' }, { status: 403 });

  const formData = await request.formData();
  const bloque = formData.get('bloque');
  const concepto = formData.get('concepto');
  const valor = formData.get('valor') || '';
  const unidad = formData.get('unidad') || '';
  const periodo = formData.get('periodo') || '';
  const fuente = formData.get('fuente') || '';
  const responsable = formData.get('responsable') || '';
  const nivel = formData.get('nivel_respaldo') || 'DECLARADO';
  const archivo = formData.get('archivo');

  if (!BLOQUES_EVIDENCIA.includes(bloque) || !concepto?.trim()) return NextResponse.json({ error: 'Bloque y concepto son obligatorios.' }, { status: 400 });
  if (!['DECLARADO', 'DOCUMENTADO', 'VALIDADO_EN_FUENTE'].includes(nivel)) return NextResponse.json({ error: 'Nivel de respaldo inválido.' }, { status: 400 });
  if (nivel !== 'DECLARADO' && (!archivo || typeof archivo === 'string')) return NextResponse.json({ error: 'El nivel documentado o validado exige un archivo original.' }, { status: 400 });

  let nombreOriginal = null;
  let hash = null;
  let ruta = null;
  if (archivo && typeof archivo !== 'string' && archivo.size > 0) {
    const buffer = Buffer.from(await archivo.arrayBuffer());
    hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const extension = (archivo.name.split('.').pop() || 'bin').toLowerCase();
    nombreOriginal = archivo.name;
    ruta = `${hash}.${extension}`;
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    const target = path.join(UPLOADS_DIR, ruta);
    if (!fs.existsSync(target)) fs.writeFileSync(target, buffer);
  }

  const result = db.prepare(`
    INSERT INTO evidencias_industriales (expediente_id, bloque, concepto, valor, unidad, periodo, fuente, responsable, nivel_respaldo, nombre_original, hash_sha256, ruta_archivo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(expedienteId, bloque, concepto.trim(), valor, unidad, periodo, fuente, responsable, nivel, nombreOriginal, hash, ruta);
  registrarActividadIndustrial({
    expedienteId,
    usuario,
    entidad: 'EVIDENCIA',
    entidadId: result.lastInsertRowid,
    accion: 'EVIDENCIA_REGISTRADA',
    detalle: { bloque, concepto: concepto.trim(), periodo, fuente, nivel_respaldo: nivel, nombre_original: nombreOriginal, hash_sha256: hash },
  });
  return NextResponse.json({ id: result.lastInsertRowid, hash, resumen: resumenExpediente(expedienteId) }, { status: 201 });
}
