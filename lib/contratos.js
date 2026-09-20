// lib/contratos.js — persistencia y reglas del piloto de cobertura por índice.
// Motor: fuentes (oficiales / IoT) -> oráculo (validación + consenso) -> gatillo (liquidación).
import crypto from 'crypto';
import db from '@/lib/db';
import { INDICES } from '@/lib/oraculo/indices';
import { consenso, hashLectura, validarLectura } from '@/lib/oraculo/validar';
import { backtest, evaluarReserva, montoLiquidacion } from '@/lib/contratosCalc';

db.exec(`
    CREATE TABLE IF NOT EXISTS dispositivos_iot (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        indice_id TEXT NOT NULL,
        secreto TEXT NOT NULL,
        activo INTEGER NOT NULL DEFAULT 1,
        ultimo_ts INTEGER NOT NULL DEFAULT 0,
        creado DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS oraculo_lecturas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        indice_id TEXT NOT NULL,
        tipo TEXT NOT NULL CHECK(tipo IN ('OFICIAL', 'IOT')),
        fuente TEXT NOT NULL,
        fecha_obs TEXT NOT NULL,
        valor REAL NOT NULL,
        estado TEXT NOT NULL CHECK(estado IN ('ACEPTADA', 'RECHAZADA', 'EN_DISPUTA')),
        motivo TEXT,
        hash_prev TEXT,
        hash TEXT NOT NULL,
        creada DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_lecturas_indice_fecha ON oraculo_lecturas (indice_id, fecha_obs);
    CREATE TABLE IF NOT EXISTS contratos_cobertura (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER NOT NULL,
        rut TEXT NOT NULL,
        pyme TEXT NOT NULL,
        exposicion TEXT NOT NULL,
        indice_id TEXT NOT NULL,
        umbral REAL NOT NULL,
        salida REAL NOT NULL,
        monto_max INTEGER NOT NULL,
        cargo_mensual REAL NOT NULL,
        inicio TEXT NOT NULL,
        fin TEXT NOT NULL,
        modo TEXT NOT NULL DEFAULT 'SIMULADO' CHECK(modo IN ('SIMULADO', 'REAL')),
        legal_ref TEXT,
        estado TEXT NOT NULL DEFAULT 'BORRADOR' CHECK(estado IN ('BORRADOR', 'VIGENTE', 'TERMINADO')),
        creado DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS liquidaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contrato_id INTEGER NOT NULL,
        periodo TEXT NOT NULL,
        valor REAL,
        fraccion REAL,
        monto INTEGER NOT NULL DEFAULT 0,
        estado TEXT NOT NULL CHECK(estado IN ('CALCULADA', 'SIN_DATOS', 'EN_DISPUTA', 'PAGADA_EXTERNA')),
        evidencia TEXT NOT NULL,
        creada DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (contrato_id, periodo),
        FOREIGN KEY (contrato_id) REFERENCES contratos_cobertura(id) ON DELETE CASCADE
    );
`);

// ---------- Puerta legal y reserva ----------
export const opinionLegalRef = () => (process.env.OPINION_LEGAL_REF ?? '').trim();
export const reservaDeclarada = () => Number(process.env.RESERVA_CLP ?? 0);

export function exposicionRealVigente() {
    return db.prepare(`SELECT COALESCE(SUM(monto_max), 0) AS t FROM contratos_cobertura WHERE modo = 'REAL' AND estado IN ('BORRADOR','VIGENTE')`).get().t;
}

// ---------- Oráculo ----------
export function crearDispositivo({ nombre, indiceId }) {
    const secreto = crypto.randomBytes(32).toString('hex');
    const r = db.prepare(`INSERT INTO dispositivos_iot (nombre, indice_id, secreto) VALUES (?, ?, ?)`).run(nombre, indiceId, secreto);
    return { id: Number(r.lastInsertRowid), secreto }; // el secreto solo se muestra una vez
}
export const obtenerDispositivo = (id) => db.prepare(`SELECT * FROM dispositivos_iot WHERE id = ?`).get(id) ?? null;
export const listarDispositivos = () => db.prepare(`SELECT id, nombre, indice_id, activo, ultimo_ts, creado FROM dispositivos_iot ORDER BY id DESC`).all();

function ultimaLectura(indiceId, fuente) {
    return db.prepare(`SELECT valor, hash FROM oraculo_lecturas WHERE indice_id = ? AND fuente = ? AND estado != 'RECHAZADA' ORDER BY id DESC LIMIT 1`).get(indiceId, fuente) ?? null;
}
const ultimoHash = () => db.prepare(`SELECT hash FROM oraculo_lecturas ORDER BY id DESC LIMIT 1`).get()?.hash ?? null;

// Valida y guarda una lectura (también las rechazadas, para auditoría) encadenada con la anterior.
export function registrarLectura({ indiceId, tipo, fuente, fechaObs, valor, tsMs }) {
    const indice = INDICES[indiceId];
    const previa = ultimaLectura(indiceId, fuente);
    const v = validarLectura({ indice, valor, tsMs, ultimoValor: previa?.valor ?? null, esIoT: tipo === 'IOT' });
    const hashPrev = ultimoHash();
    const hash = hashLectura(hashPrev, { indiceId, tipo, fuente, fechaObs, valor, estado: v.estado });
    const r = db.prepare(`
        INSERT INTO oraculo_lecturas (indice_id, tipo, fuente, fecha_obs, valor, estado, motivo, hash_prev, hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(indiceId, tipo, fuente, fechaObs, Number.isFinite(valor) ? valor : 0, v.estado, v.motivo, hashPrev, hash);
    return { id: Number(r.lastInsertRowid), ...v, hash };
}

export const existeLecturaOficial = (indiceId, fuente, fechaObs) =>
    Boolean(db.prepare(`SELECT 1 FROM oraculo_lecturas WHERE indice_id = ? AND fuente = ? AND fecha_obs = ? AND estado != 'RECHAZADA'`).get(indiceId, fuente, fechaObs));

export const listarLecturas = (limite = 40) =>
    db.prepare(`SELECT id, indice_id, tipo, fuente, fecha_obs, valor, estado, motivo, creada FROM oraculo_lecturas ORDER BY id DESC LIMIT ?`).all(limite);

// Verifica la cadena de hashes completa (detecta cualquier alteración posterior de una lectura).
export function verificarCadena() {
    const filas = db.prepare(`SELECT indice_id, tipo, fuente, fecha_obs, valor, estado, hash_prev, hash FROM oraculo_lecturas ORDER BY id`).all();
    let previo = null;
    for (let i = 0; i < filas.length; i++) {
        const f = filas[i];
        const esperado = hashLectura(previo, { indiceId: f.indice_id, tipo: f.tipo, fuente: f.fuente, fechaObs: f.fecha_obs, valor: f.valor, estado: f.estado });
        if (f.hash_prev !== previo || f.hash !== esperado) return { ok: false, rompeEn: i + 1, total: filas.length };
        previo = f.hash;
    }
    return { ok: true, total: filas.length };
}

// ---------- Contratos ----------
export function serieHistorica(indiceId) {
    const indice = INDICES[indiceId];
    const filas = db.prepare(`SELECT fecha_obs, valor, tipo, fuente FROM oraculo_lecturas WHERE indice_id = ? AND estado = 'ACEPTADA' ORDER BY fecha_obs, id`).all(indiceId);
    const porPeriodo = new Map();
    for (const f of filas) {
        const p = f.fecha_obs.slice(0, 7);
        if (!porPeriodo.has(p)) porPeriodo.set(p, []);
        porPeriodo.get(p).push({ tipo: f.tipo, fuente: f.fuente, valor: f.valor });
    }
    return [...porPeriodo.entries()].map(([periodo, ls]) => ({ periodo, valor: consenso(ls, { agregacion: indice.agregacion }).valor })).filter((x) => x.valor !== null);
}

export function sugerirCargo(indiceId, { umbral, salida, montoMax }) {
    return backtest(serieHistorica(indiceId), { umbral, salida, montoMax });
}

// Devuelve { id } o { error, status }. Los contratos nacen SIMULADOS; REAL exige opinión legal y reserva suficiente.
export function crearContrato(c) {
    if (c.modo === 'REAL') {
        if (!opinionLegalRef()) {
            return { error: 'No se puede crear un contrato REAL sin OPINION_LEGAL_REF (referencia de la opinión legal escrita) en el entorno del servidor.', status: 400 };
        }
        const ev = evaluarReserva({ exposicionActual: exposicionRealVigente(), montoNuevo: c.montoMax, reserva: reservaDeclarada() });
        if (!ev.ok) {
            return { error: `La exposición máxima (${ev.total}) superaría la reserva declarada (${ev.reserva || 'no definida: RESERVA_CLP'}).`, status: 400 };
        }
    }
    const r = db.prepare(`
        INSERT INTO contratos_cobertura (admin_id, rut, pyme, exposicion, indice_id, umbral, salida, monto_max, cargo_mensual, inicio, fin, modo, legal_ref, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'BORRADOR')
    `).run(c.adminId, c.rut, c.pyme, c.exposicion, c.indiceId, c.umbral, c.salida, c.montoMax, c.cargoMensual, c.inicio, c.fin, c.modo, c.modo === 'REAL' ? opinionLegalRef() : null);
    return { id: Number(r.lastInsertRowid) };
}

export const obtenerContrato = (id) => db.prepare(`SELECT * FROM contratos_cobertura WHERE id = ?`).get(id) ?? null;
export const listarContratos = () => db.prepare(`SELECT * FROM contratos_cobertura ORDER BY id DESC`).all();
export const listarLiquidaciones = () => db.prepare(`SELECT * FROM liquidaciones ORDER BY id DESC LIMIT 100`).all();
export const obtenerLiquidacion = (id) => db.prepare(`SELECT * FROM liquidaciones WHERE id = ?`).get(id) ?? null;

// ---------- Gatillo: liquida un periodo (YYYY-MM) ----------
// No sobrescribe liquidaciones pagadas ni en disputa. Sin datos suficientes NO paga.
export function liquidarPeriodo(contratoId, periodo) {
    const contrato = obtenerContrato(contratoId);
    if (!contrato) return { error: 'Contrato no encontrado.', status: 404 };
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodo)) return { error: 'Periodo no válido (AAAA-MM).', status: 400 };
    if (periodo < contrato.inicio.slice(0, 7) || periodo > contrato.fin.slice(0, 7)) return { error: 'El periodo está fuera de la vigencia del contrato.', status: 400 };

    const previa = db.prepare(`SELECT * FROM liquidaciones WHERE contrato_id = ? AND periodo = ?`).get(contratoId, periodo);
    if (previa && ['PAGADA_EXTERNA', 'EN_DISPUTA'].includes(previa.estado)) {
        return { error: `La liquidación está ${previa.estado} y no se recalcula.`, status: 409 };
    }

    const indice = INDICES[contrato.indice_id];
    const lecturas = db.prepare(`
        SELECT id, tipo, fuente, valor, hash FROM oraculo_lecturas
        WHERE indice_id = ? AND estado = 'ACEPTADA' AND fecha_obs LIKE ? ORDER BY fecha_obs, id
    `).all(contrato.indice_id, `${periodo}%`);
    const c = consenso(lecturas, { agregacion: indice.agregacion });

    let estado, valor = null, fraccion = 0, monto = 0;
    if (c.ok) {
        ({ fraccion, monto } = montoLiquidacion({ umbral: contrato.umbral, salida: contrato.salida, montoMax: contrato.monto_max }, c.valor));
        valor = c.valor;
        estado = 'CALCULADA';
    } else {
        estado = 'SIN_DATOS';
    }
    const evidencia = JSON.stringify({ base: c.base, fuentes: c.fuentes, agregacion: indice.agregacion, motivo: c.motivo ?? null, lecturas: lecturas.map((l) => ({ id: l.id, hash: l.hash })) });

    db.prepare(`
        INSERT INTO liquidaciones (contrato_id, periodo, valor, fraccion, monto, estado, evidencia) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (contrato_id, periodo) DO UPDATE SET valor = excluded.valor, fraccion = excluded.fraccion, monto = excluded.monto, estado = excluded.estado, evidencia = excluded.evidencia
    `).run(contratoId, periodo, valor, fraccion, monto, estado, evidencia);
    return { ok: true, periodo, estado, valor, fraccion, monto, simulado: contrato.modo === 'SIMULADO' };
}

export function cambiarEstadoLiquidacion(id, estado) {
    if (!['EN_DISPUTA', 'PAGADA_EXTERNA', 'CALCULADA'].includes(estado)) return { error: 'Estado no válido.', status: 400 };
    const l = obtenerLiquidacion(id);
    if (!l) return { error: 'Liquidación no encontrada.', status: 404 };
    if (estado === 'PAGADA_EXTERNA') {
        const c = obtenerContrato(l.contrato_id);
        if (c.modo !== 'REAL') return { error: 'Un contrato SIMULADO no tiene pagos reales que registrar.', status: 400 };
        if (l.estado !== 'CALCULADA' || l.monto <= 0) return { error: 'Solo se registra como pagada una liquidación calculada con monto.', status: 400 };
    }
    db.prepare(`UPDATE liquidaciones SET estado = ? WHERE id = ?`).run(estado, id);
    return { ok: true };
}
