import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        const rows = db.prepare(`SELECT * FROM empresas_proveedoras ORDER BY fecha_registro DESC`).all();
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
    }
}

export async function POST(request) {
    const { rut, razon_social, sector_industrial } = await request.json();
    try {
        const result = db.prepare(
            `INSERT INTO empresas_proveedoras (rut, razon_social, sector_industrial) VALUES (?, ?, ?)`
        ).run(rut, razon_social, sector_industrial);
        return NextResponse.json({ mensaje: 'Cliente registrado exitosamente', id_cliente: result.lastInsertRowid }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Error al registrar cliente.', detalle: error.message }, { status: 400 });
    }
}
