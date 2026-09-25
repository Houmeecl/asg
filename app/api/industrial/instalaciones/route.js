import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { exigirUsuarioSesion } from '@/lib/auth';
import { registrarActividadIndustrial } from '@/lib/trazabilidadIndustrial';

export async function GET(request) {
  if (!(await exigirUsuarioSesion())) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  const proveedorId = new URL(request.url).searchParams.get('proveedor_id');
  if (!proveedorId) return NextResponse.json({ error: 'proveedor_id es obligatorio.' }, { status: 400 });
  const instalaciones = db.prepare(`SELECT * FROM instalaciones_industriales WHERE proveedor_id = ? ORDER BY activa DESC, nombre`).all(proveedorId);
  return NextResponse.json({ instalaciones });
}

export async function POST(request) {
  const usuario = await exigirUsuarioSesion();
  if (!usuario) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  const { proveedor_id, nombre, direccion = '', comuna = '', pais = 'CL' } = await request.json();
  if (!proveedor_id || !nombre?.trim()) return NextResponse.json({ error: 'Proveedor y nombre de instalación son obligatorios.' }, { status: 400 });
  const proveedor = db.prepare('SELECT id FROM empresas_proveedoras WHERE id = ?').get(proveedor_id);
  if (!proveedor) return NextResponse.json({ error: 'Proveedor inexistente.' }, { status: 404 });
  const result = db.prepare(`INSERT INTO instalaciones_industriales (proveedor_id, nombre, direccion, comuna, pais) VALUES (?, ?, ?, ?, ?)`)
    .run(proveedor_id, nombre.trim(), direccion.trim(), comuna.trim(), pais);
  registrarActividadIndustrial({
    usuario,
    entidad: 'INSTALACION',
    entidadId: result.lastInsertRowid,
    accion: 'INSTALACION_CREADA',
    detalle: { proveedor_id, nombre: nombre.trim(), comuna: comuna.trim(), pais },
  });
  return NextResponse.json({ id: result.lastInsertRowid, mensaje: 'Instalación registrada.' }, { status: 201 });
}
