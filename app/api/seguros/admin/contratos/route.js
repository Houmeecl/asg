import { NextResponse } from 'next/server';
import { requiereAdmin } from '@/lib/requiereAdmin';
import { INDICES } from '@/lib/oraculo/indices';
import { rutValido, rutFormateado } from '@/lib/rut';
import {
    cambiarEstadoLiquidacion, crearContrato, crearDispositivo, existeLecturaOficial, exposicionRealVigente,
    liquidarPeriodo, listarContratos, listarDispositivos, listarLecturas, listarLiquidaciones,
    opinionLegalRef, registrarLectura, reservaDeclarada, sugerirCargo, verificarCadena,
} from '@/lib/contratos';

const texto = (v, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const fecha = (v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : null);
const bad = (error, status = 400) => NextResponse.json({ error }, { status });

export async function GET() {
    const { error } = await requiereAdmin();
    if (error) return error;
    return NextResponse.json({
        contratos: listarContratos(),
        liquidaciones: listarLiquidaciones(),
        dispositivos: listarDispositivos(),
        lecturas: listarLecturas(40),
        cadena: verificarCadena(),
        indices: INDICES,
        reserva: { declarada: reservaDeclarada(), exposicionReal: exposicionRealVigente(), opinionLegalRef: opinionLegalRef() || null },
    });
}

// Convierte "2024-01;95,5" / "2024-01,95.5" / tabulado en filas { fecha, valor }.
function parsearSerie(csv) {
    const filas = [];
    for (const linea of String(csv).split(/\r?\n/).slice(0, 2001)) {
        const t = linea.trim();
        if (!t || /^fecha/i.test(t)) continue;
        const sep = /[;\t]/.test(t) ? /[;\t]/ : /,/;
        const [f, v] = t.split(sep).map((x) => x.trim());
        const valor = Number(String(v ?? '').replace(',', '.'));
        if (/^\d{4}-\d{2}(-\d{2})?$/.test(f ?? '') && Number.isFinite(valor)) filas.push({ fecha: f, valor });
    }
    return filas;
}

export async function POST(request) {
    const { error, usuario } = await requiereAdmin();
    if (error) return error;
    const b = await request.json().catch(() => null);
    if (!b) return bad('Cuerpo no válido.');

    switch (b.accion) {
        case 'nuevo_dispositivo': {
            const nombre = texto(b.nombre, 80);
            if (nombre.length < 2 || !INDICES[b.indiceId]) return bad('Nombre o índice no válido.');
            return NextResponse.json(crearDispositivo({ nombre, indiceId: b.indiceId }), { status: 201 });
        }

        case 'cargar_oficial': {
            const indice = INDICES[b.indiceId];
            const fuente = texto(b.fuente, 120);
            if (!indice) return bad('Índice no válido.');
            if (fuente.length < 3) return bad('Indica la fuente oficial de la serie (nombre y publicación).');
            const filas = parsearSerie(b.csv);
            if (filas.length === 0) return bad('No se encontraron filas válidas (formato: fecha;valor con fecha AAAA-MM o AAAA-MM-DD).');
            const res = { aceptadas: 0, rechazadas: 0, enDisputa: 0, duplicadas: 0 };
            for (const f of filas.sort((x, y) => x.fecha.localeCompare(y.fecha))) {
                if (existeLecturaOficial(b.indiceId, `OFICIAL:${fuente}`, f.fecha)) { res.duplicadas++; continue; }
                const l = registrarLectura({ indiceId: b.indiceId, tipo: 'OFICIAL', fuente: `OFICIAL:${fuente}`, fechaObs: f.fecha, valor: f.valor });
                if (l.estado === 'ACEPTADA') res.aceptadas++; else if (l.estado === 'EN_DISPUTA') res.enDisputa++; else res.rechazadas++;
            }
            return NextResponse.json({ ok: true, ...res });
        }

        case 'sugerir': {
            const indice = INDICES[b.indiceId];
            if (!indice) return bad('Índice no válido.');
            const umbral = Number(b.umbral), salida = Number(b.salida), montoMax = Number(b.montoMax);
            if (![umbral, salida, montoMax].every(Number.isFinite)) return bad('Umbral, salida y monto deben ser números.');
            return NextResponse.json(sugerirCargo(b.indiceId, { umbral, salida, montoMax }));
        }

        case 'crear': {
            const indice = INDICES[b.indiceId];
            const rut = texto(b.rut, 20), pyme = texto(b.pyme, 150), exposicion = texto(b.exposicion, 1000);
            const umbral = Number(b.umbral), salida = Number(b.salida);
            const montoMax = b.montoMax, cargoMensual = Number(b.cargoMensual);
            const inicio = fecha(b.inicio), fin = fecha(b.fin);
            if (!indice) return bad('Índice no válido.');
            if (pyme.length < 2) return bad('Ingresa el nombre de la PYME.');
            if (!rutValido(rut)) return bad('RUT no válido.');
            if (exposicion.length < 20) return bad('Describe la exposición operacional que se cubre (mín. 20 caracteres): sin interés real cubierto no se crea el contrato.');
            if (!Number.isFinite(umbral) || !Number.isFinite(salida)) return bad('Umbral y salida deben ser números.');
            if (indice.dir === 'menor' ? !(salida < umbral) : !(salida > umbral)) return bad(`Para este índice el pago total (${salida}) debe estar ${indice.dir === 'menor' ? 'por debajo' : 'por encima'} del umbral (${umbral}).`);
            if (!Number.isInteger(montoMax) || montoMax < 1_000_000 || montoMax > 2_000_000_000) return bad('Monto máximo fuera de rango.');
            if (!(cargoMensual >= 0) || cargoMensual > montoMax) return bad('Cargo mensual no válido.');
            if (!inicio || !fin || fin <= inicio) return bad('Vigencia no válida.');
            if ((Date.parse(fin) - Date.parse(inicio)) / 86_400_000 > 800) return bad('La vigencia del piloto no puede superar ~24 meses.');
            const modo = b.modo === 'REAL' ? 'REAL' : 'SIMULADO';
            const r = crearContrato({ adminId: usuario.id, rut: rutFormateado(rut), pyme, exposicion, indiceId: b.indiceId, umbral, salida, montoMax, cargoMensual, inicio, fin, modo });
            if (r.error) return bad(r.error, r.status);
            return NextResponse.json({ ok: true, id: r.id, modo }, { status: 201 });
        }

        case 'liquidar': {
            const r = liquidarPeriodo(Number(b.contratoId), String(b.periodo ?? ''));
            return r.error ? bad(r.error, r.status) : NextResponse.json(r);
        }

        case 'estado_liquidacion': {
            const r = cambiarEstadoLiquidacion(Number(b.id), b.estado);
            return r.error ? bad(r.error, r.status) : NextResponse.json(r);
        }

        default:
            return bad('Acción desconocida.');
    }
}
