import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { exigirAdministrador } from '@/lib/auth';

export async function GET() {
  const admin = await exigirAdministrador();
  if (!admin) return NextResponse.json({ error: 'Acceso administrativo requerido.' }, { status: 403 });

  const clientes = db.prepare(`
    SELECT c.id, c.rut, c.razon_social, c.email_contacto, c.telefono, c.tipo_cliente, c.estado, c.fecha_registro,
           a.id AS cuenta_id, a.alias AS cuenta_alias, a.saldo_disponible, a.moneda, a.estado AS cuenta_estado,
           COUNT(m.id) AS movimientos
    FROM antai_clientes c
    JOIN antai_cuentas a ON a.cliente_id = c.id
    LEFT JOIN antai_movimientos m ON m.cuenta_id = a.id
    GROUP BY c.id, a.id
    ORDER BY c.razon_social COLLATE NOCASE
  `).all();
  return NextResponse.json({ clientes });
}

export async function POST(request) {
  const admin = await exigirAdministrador();
  if (!admin) return NextResponse.json({ error: 'Acceso administrativo requerido.' }, { status: 403 });

  try {
    const payload = await request.json();
    const rut = String(payload.rut || '').trim();
    const razonSocial = String(payload.razon_social || '').trim();
    const email = String(payload.email_contacto || '').trim().toLowerCase();
    const telefono = String(payload.telefono || '').trim();
    const tipo = ['PROVEEDOR', 'MANDANTE', 'SERVICIO_RUTA'].includes(payload.tipo_cliente) ? payload.tipo_cliente : 'PROVEEDOR';
    if (!rut || !razonSocial) throw new Error('RUT y razón social son obligatorios.');
    if (email && !email.includes('@')) throw new Error('El correo de contacto no es válido.');

    const crear = db.transaction(() => {
      const cliente = db.prepare(`INSERT INTO antai_clientes (rut, razon_social, email_contacto, telefono, tipo_cliente) VALUES (?, ?, ?, ?, ?)`)
        .run(rut, razonSocial, email || null, telefono || null, tipo);
      const cuenta = db.prepare(`INSERT INTO antai_cuentas (cliente_id, alias) VALUES (?, ?)`)
        .run(cliente.lastInsertRowid, `Cuenta ${razonSocial}`);
      return { clienteId: cliente.lastInsertRowid, cuentaId: cuenta.lastInsertRowid };
    });
    const creado = crear();
    return NextResponse.json({ mensaje: 'Cliente y cuenta prepago creados.', ...creado }, { status: 201 });
  } catch (error) {
    const duplicado = String(error.message || '').includes('UNIQUE');
    return NextResponse.json({ error: duplicado ? 'Ya existe un cliente ANTĀi con ese RUT.' : error.message || 'No se pudo crear el cliente.' }, { status: 400 });
  }
}
