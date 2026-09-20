import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { INDICES } from '@/lib/oraculo/indices';
import { firmaValida } from '@/lib/oraculo/validar';
import { obtenerDispositivo, registrarLectura } from '@/lib/contratos';

// Recepción de lecturas de sensores IoT. Sin sesión de usuario: cada dispositivo se autentica con
//   x-dispositivo: <id>   x-timestamp: <epoch ms>   x-firma: HMAC-SHA256(secreto, `${timestamp}.${cuerpo}`)
// Cuerpo JSON: { "valor": <número> }. El timestamp debe ser reciente y estrictamente mayor que el último aceptado (anti-replay).

const MAX_CUERPO = 1024;

export async function POST(request) {
    const cuerpo = await request.text();
    if (cuerpo.length > MAX_CUERPO) return NextResponse.json({ error: 'Cuerpo demasiado grande.' }, { status: 413 });

    const id = Number(request.headers.get('x-dispositivo'));
    const tsRaw = request.headers.get('x-timestamp') ?? '';
    const firma = request.headers.get('x-firma') ?? '';
    const tsMs = Number(tsRaw);
    const dispositivo = Number.isInteger(id) ? obtenerDispositivo(id) : null;

    // Misma respuesta para dispositivo inexistente, inactivo o firma inválida: no revela qué falló.
    if (!dispositivo || !dispositivo.activo || !/^\d{10,15}$/.test(tsRaw) || !firmaValida(dispositivo.secreto, tsRaw, cuerpo, firma)) {
        return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    let datos;
    try { datos = JSON.parse(cuerpo); } catch { return NextResponse.json({ error: 'JSON no válido.' }, { status: 400 }); }
    if (typeof datos?.valor !== 'number') return NextResponse.json({ error: 'Falta "valor" numérico.' }, { status: 400 });

    // La ventana de reloj se valida ANTES de tocar el anti-replay: un timestamp futuro no debe bloquear al sensor.
    if (Math.abs(Date.now() - tsMs) > 5 * 60 * 1000) {
        return NextResponse.json({ error: 'Marca de tiempo fuera de la ventana permitida (5 min). Revisa el reloj del sensor.' }, { status: 422 });
    }

    // Anti-replay atómico: el timestamp debe superar al último aceptado de este dispositivo.
    const r = db.prepare(`UPDATE dispositivos_iot SET ultimo_ts = ? WHERE id = ? AND ultimo_ts < ?`).run(tsMs, dispositivo.id, tsMs);
    if (r.changes !== 1) return NextResponse.json({ error: 'Lectura repetida o fuera de orden.' }, { status: 409 });

    const indice = INDICES[dispositivo.indice_id];
    if (!indice) return NextResponse.json({ error: 'Índice del dispositivo no configurado.' }, { status: 500 });

    const lectura = registrarLectura({
        indiceId: dispositivo.indice_id, tipo: 'IOT', fuente: `IOT:${dispositivo.id}`,
        fechaObs: new Date(tsMs).toISOString(), valor: datos.valor, tsMs,
    });
    return NextResponse.json({ estado: lectura.estado, motivo: lectura.motivo }, { status: lectura.estado === 'RECHAZADA' ? 422 : 201 });
}
