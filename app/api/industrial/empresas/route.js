import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { exigirUsuarioSesion } from '@/lib/auth';
import { registrarActividadIndustrial } from '@/lib/trazabilidadIndustrial';

export async function GET() {
  if (!(await exigirUsuarioSesion())) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  const empresas = db.prepare(`
    SELECT p.*, COUNT(DISTINCT i.id) AS instalaciones, COUNT(DISTINCT e.id) AS expedientes
    FROM empresas_proveedoras p
    LEFT JOIN instalaciones_industriales i ON i.proveedor_id = p.id
    LEFT JOIN expedientes_industriales e ON e.proveedor_id = p.id
    GROUP BY p.id ORDER BY p.razon_social
  `).all();
  return NextResponse.json({ empresas });
}

export async function POST(request) {
  const usuario = await exigirUsuarioSesion();
  if (!usuario) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  const { rut, razon_social, sector_industrial = 'Metalmecánica / proveedor minero' } = await request.json();
  if (!rut?.trim() || !razon_social?.trim()) return NextResponse.json({ error: 'RUT y razón social son obligatorios.' }, { status: 400 });
  try {
    const result = db.prepare(`INSERT INTO empresas_proveedoras (rut, razon_social, sector_industrial) VALUES (?, ?, ?)`)
      .run(rut.trim(), razon_social.trim(), sector_industrial.trim());
    registrarActividadIndustrial({
      usuario,
      entidad: 'EMPRESA',
      entidadId: result.lastInsertRowid,
      accion: 'EMPRESA_CREADA',
      detalle: { rut: rut.trim(), razon_social: razon_social.trim(), sector_industrial: sector_industrial.trim() },
    });
    return NextResponse.json({ id: result.lastInsertRowid, mensaje: 'Proveedor registrado.' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo registrar el proveedor.', detalle: error.message }, { status: 400 });
  }
}
