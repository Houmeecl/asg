import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request, { params }) {
    const { id } = await params;
    try {
        const rows = db.prepare(
            `SELECT c.*, a.patente, a.descripcion, a.tipo_activo, cl.nombre AS cliente_nombre
             FROM flota_contratos c
             JOIN flota_activos a ON a.id = c.activo_id
             JOIN flota_clientes cl ON cl.id = c.cliente_id
             WHERE a.empresa_id = ?
             ORDER BY c.fecha_inicio DESC`
        ).all(id);
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener contratos' }, { status: 500 });
    }
}
