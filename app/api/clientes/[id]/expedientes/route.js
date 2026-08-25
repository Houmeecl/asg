import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request, { params }) {
    const { id } = await params;
    try {
        const rows = db.prepare(
            `SELECT * FROM expedientes_sicr3p WHERE proveedor_id = ? ORDER BY fecha_apertura DESC`
        ).all(id);
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener expedientes' }, { status: 500 });
    }
}
