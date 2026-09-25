import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { exigirAdministrador } from '@/lib/auth';

export async function GET(_request, { params }) {
  const admin = await exigirAdministrador();
  if (!admin) return NextResponse.json({ error: 'Acceso administrativo requerido.' }, { status: 403 });
  const { id } = await params;
  const cliente = db.prepare(`
    SELECT c.*, a.id AS cuenta_id, a.alias AS cuenta_alias, a.saldo_disponible, a.moneda, a.estado AS cuenta_estado
    FROM antai_clientes c JOIN antai_cuentas a ON a.cliente_id = c.id WHERE c.id = ?
  `).get(id);
  if (!cliente) return NextResponse.json({ error: 'Cliente ANTĀi no encontrado.' }, { status: 404 });
  const movimientos = db.prepare(`
    SELECT id, tipo, monto, descripcion, centro_costo, referencia, fecha_registro
    FROM antai_movimientos WHERE cuenta_id = ? ORDER BY id DESC LIMIT 50
  `).all(cliente.cuenta_id);
  return NextResponse.json({ cliente, movimientos });
}
