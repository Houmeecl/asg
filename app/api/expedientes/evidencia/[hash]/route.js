import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import db from '@/lib/db';
import { obtenerUsuarioSesion } from '@/lib/auth';

const UPLOADS_DIR = path.resolve(process.cwd(), 'data', 'uploads');

// A diferencia de /api/flota/verificar (público, pensado para terceros vía QR),
// la evidencia forense original solo la puede descargar un auditor con sesión activa.
export async function GET(request, { params }) {
    const usuario = await obtenerUsuarioSesion();
    if (!usuario) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { hash } = await params;

    const evidencia = db.prepare(
        `SELECT nombre_original, ruta_archivo, tipo_archivo FROM evidencias_forenses WHERE hash_sha256 = ?`
    ).get(hash);

    if (!evidencia || !evidencia.ruta_archivo) {
        return NextResponse.json({ error: 'Evidencia no encontrada.' }, { status: 404 });
    }

    const rutaCompleta = path.join(UPLOADS_DIR, evidencia.ruta_archivo);
    if (!fs.existsSync(rutaCompleta)) {
        return NextResponse.json({ error: 'El archivo original ya no está disponible en el servidor.' }, { status: 404 });
    }

    const buffer = fs.readFileSync(rutaCompleta);
    return new NextResponse(buffer, {
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${evidencia.nombre_original || evidencia.ruta_archivo}"`,
        },
    });
}
