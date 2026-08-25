import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request, { params }) {
    const { id } = await params;
    try {
        const rows = db.prepare(`SELECT * FROM flota_clientes WHERE empresa_id = ? ORDER BY fecha_registro DESC`).all(id);
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener clientes de flota' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    const { id } = await params;
    const { nombre } = await request.json();
    try {
        const result = db.prepare(`INSERT INTO flota_clientes (empresa_id, nombre) VALUES (?, ?)`).run(id, nombre);
        return NextResponse.json({ mensaje: 'Cliente de flota registrado', id: result.lastInsertRowid }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Error al registrar cliente de flota', detalle: error.message }, { status: 400 });
    }
}
