import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request) {
    const { proveedor_id, periodo_fiscal, area_practica } = await request.json();
    try {
        const result = db.prepare(
            `INSERT INTO expedientes_sicr3p (proveedor_id, periodo_fiscal, area_practica) VALUES (?, ?, ?)`
        ).run(proveedor_id, periodo_fiscal, area_practica);
        return NextResponse.json({ mensaje: 'Expediente SICR3P abierto', id_expediente: result.lastInsertRowid }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Error al abrir el expediente', detalle: error.message }, { status: 400 });
    }
}
