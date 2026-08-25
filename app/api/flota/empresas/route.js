import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        const rows = db.prepare(`SELECT * FROM flota_empresas ORDER BY fecha_registro DESC`).all();
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener empresas de flota' }, { status: 500 });
    }
}

export async function POST(request) {
    const { rut, razon_social, ciudad, pais, tipo_negocio } = await request.json();
    try {
        const result = db.prepare(
            `INSERT INTO flota_empresas (rut, razon_social, ciudad, pais, tipo_negocio) VALUES (?, ?, ?, ?, ?)`
        ).run(rut, razon_social, ciudad, pais || 'CL', tipo_negocio);
        return NextResponse.json({ mensaje: 'Empresa de flota registrada', id: result.lastInsertRowid }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Error al registrar empresa de flota', detalle: error.message }, { status: 400 });
    }
}
