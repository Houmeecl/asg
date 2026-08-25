import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request, { params }) {
    const { id } = await params;
    try {
        const rows = db.prepare(`SELECT * FROM flota_activos WHERE empresa_id = ? ORDER BY fecha_registro DESC`).all(id);
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener activos' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    const { id } = await params;
    const { patente, tipo_activo, unidad_medida, descripcion, tasa_referencia_litros, tipo_combustible } = await request.json();
    try {
        const result = db.prepare(
            `INSERT INTO flota_activos (empresa_id, patente, tipo_activo, unidad_medida, descripcion, tasa_referencia_litros, tipo_combustible)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(id, patente, tipo_activo, unidad_medida, descripcion, tasa_referencia_litros, tipo_combustible || 'DIESEL');
        return NextResponse.json({ mensaje: 'Activo registrado', id: result.lastInsertRowid }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Error al registrar activo', detalle: error.message }, { status: 400 });
    }
}
