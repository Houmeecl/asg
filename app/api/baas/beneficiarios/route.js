import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { exigirEmpresa, exigirUsuarioSesion } from '@/lib/auth';

export async function GET() {
  const usuario = await exigirUsuarioSesion();
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const rows = db.prepare(`
    SELECT * FROM baas_beneficiarios
    WHERE empresa_usuario_id = ? OR ? IN ('ADMIN','OPERADOR')
    ORDER BY id DESC LIMIT 100
  `).all(usuario.id, usuario.rol);
  return NextResponse.json({ beneficiarios: rows });
}

export async function POST(request) {
  const usuario = await exigirEmpresa();
  const u = usuario || (await exigirUsuarioSesion());
  if (!u || (u.rol !== 'EMPRESA' && u.rol !== 'ADMIN')) {
    return NextResponse.json({ error: 'Solo empresa' }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const nombre = String(body.nombre || '').trim();
  const documento = String(body.documento || '').trim();
  if (!nombre || !documento) {
    return NextResponse.json({ error: 'Nombre y documento son obligatorios' }, { status: 400 });
  }
  const info = db.prepare(`
    INSERT INTO baas_beneficiarios
      (empresa_usuario_id, nombre, documento, documento_tipo, pais, bank_code, bank_account, bank_account_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    u.id,
    nombre,
    documento,
    body.documentoTipo || 'RUT',
    body.pais || 'CL',
    body.bankCode || null,
    body.bankAccount || null,
    body.bankAccountType || 'CHECKING',
  );
  const row = db.prepare('SELECT * FROM baas_beneficiarios WHERE id = ?').get(info.lastInsertRowid);
  return NextResponse.json({ beneficiario: row });
}
