import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';

export async function POST(request, { params }) {
    const { id: expediente_id } = await params;

    let archivo, categoria_analisis;
    try {
        const formData = await request.formData();
        archivo = formData.get('archivo');
        categoria_analisis = formData.get('categoria_analisis');
    } catch (error) {
        return NextResponse.json({ error: 'Formulario inválido' }, { status: 400 });
    }

    if (!archivo || typeof archivo === 'string') {
        return NextResponse.json({ error: 'No se ha adjuntado ningún archivo.' }, { status: 400 });
    }

    try {
        // Hash calculado en memoria — sin escribir a disco, sin riesgo de fs.unlinkSync fallido.
        const buffer = Buffer.from(await archivo.arrayBuffer());
        const hash_sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
        const tipo_archivo = (archivo.name.split('.').pop() || 'DESCONOCIDO').toUpperCase();
        const resultado_inicial = JSON.stringify({ status: 'Evidencia blindada criptográficamente' });

        const result = db.prepare(
            `INSERT INTO evidencias_forenses (expediente_id, tipo_archivo, hash_sha256, categoria_analisis, resultado_ia) VALUES (?, ?, ?, ?, ?)`
        ).run(expediente_id, tipo_archivo, hash_sha256, categoria_analisis, resultado_inicial);

        return NextResponse.json({
            mensaje: 'Evidencia procesada y blindada',
            id_evidencia: result.lastInsertRowid,
            hash_inmutabilidad: hash_sha256,
            tipo: tipo_archivo
        }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Error interno', detalle: error.message }, { status: 500 });
    }
}
