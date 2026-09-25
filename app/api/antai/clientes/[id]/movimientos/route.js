import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { exigirAdministrador } from '@/lib/auth';

export async function POST(request, { params }) {
  const admin = await exigirAdministrador();
  if (!admin) return NextResponse.json({ error: 'Acceso administrativo requerido.' }, { status: 403 });
  try {
    const { id } = await params;
    const payload = await request.json();
    const tipo = ['CARGA', 'CARGO', 'AJUSTE'].includes(payload.tipo) ? payload.tipo : null;
    const monto = Number(payload.monto);
    const descripcion = String(payload.descripcion || '').trim();
    const centroCosto = String(payload.centro_costo || '').trim();
    if (!tipo || !Number.isInteger(monto) || monto <= 0 || !descripcion) throw new Error('Tipo, monto entero en CLP y descripción son obligatorios.');

    const registrar = db.transaction(() => {
      const cuenta = db.prepare('SELECT id, saldo_disponible, estado FROM antai_cuentas WHERE cliente_id = ?').get(id);
      if (!cuenta) throw new Error('Cuenta no encontrada.');
      if (cuenta.estado !== 'ACTIVA') throw new Error('La cuenta está bloqueada.');
      if (tipo === 'CARGO' && cuenta.saldo_disponible < monto) throw new Error('Saldo insuficiente para registrar el cargo.');
      const signo = tipo === 'CARGO' ? -1 : 1;
      const referencia = `ANT-${Date.now().toString(36).toUpperCase()}`;
      db.prepare(`INSERT INTO antai_movimientos (cuenta_id, tipo, monto, descripcion, centro_costo, referencia, creado_por_usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .run(cuenta.id, tipo, monto, descripcion, centroCosto || null, referencia, admin.id);
      db.prepare('UPDATE antai_cuentas SET saldo_disponible = saldo_disponible + ? WHERE id = ?').run(signo * monto, cuenta.id);
      return { referencia, saldo: cuenta.saldo_disponible + signo * monto };
    });
    const resultado = registrar();
    return NextResponse.json({ mensaje: 'Movimiento registrado.', ...resultado }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'No se pudo registrar el movimiento.' }, { status: 400 });
  }
}
