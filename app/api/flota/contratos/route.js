import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request) {
    const { activo_id, cliente_id, dias_renovacion } = await request.json();
    try {
        const result = db.prepare(
            `INSERT INTO flota_contratos (activo_id, cliente_id, dias_renovacion) VALUES (?, ?, ?)`
        ).run(activo_id, cliente_id, dias_renovacion || 30);
        return NextResponse.json({ mensaje: 'Contrato registrado', id: result.lastInsertRowid }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Error al registrar contrato', detalle: error.message }, { status: 400 });
    }
}
