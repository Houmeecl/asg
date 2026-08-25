import { NextResponse } from 'next/server';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import db from '@/lib/db';

const UPLOADS_DIR = path.resolve(process.cwd(), 'data', 'uploads');

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
        const buffer = Buffer.from(await archivo.arrayBuffer());
        const hash_sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
        const extension = (archivo.name.split('.').pop() || 'bin').toLowerCase();
        const tipo_archivo = extension.toUpperCase();
        const resultado_inicial = JSON.stringify({ status: 'Evidencia blindada criptográficamente' });

        // Nombre de archivo = hash: dos documentos distintos nunca chocan de nombre,
        // y verificar integridad después es tan simple como recalcular el hash del archivo guardado.
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        const nombreArchivo = `${hash_sha256}.${extension}`;
        const rutaArchivo = path.join(UPLOADS_DIR, nombreArchivo);
        if (!fs.existsSync(rutaArchivo)) {
            fs.writeFileSync(rutaArchivo, buffer);
        }

        const result = db.prepare(
            `INSERT INTO evidencias_forenses (expediente_id, tipo_archivo, hash_sha256, nombre_original, ruta_archivo, categoria_analisis, resultado_ia)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(expediente_id, tipo_archivo, hash_sha256, archivo.name, nombreArchivo, categoria_analisis, resultado_inicial);

        return NextResponse.json({
            mensaje: 'Evidencia procesada, blindada y almacenada',
            id_evidencia: result.lastInsertRowid,
            hash_inmutabilidad: hash_sha256,
            tipo: tipo_archivo,
            url_descarga: `/api/expedientes/evidencia/${hash_sha256}`
        }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Error interno', detalle: error.message }, { status: 500 });
    }
}
