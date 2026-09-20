// lib/oraculo/validar.js — funciones puras del oráculo (sin base de datos: fáciles de probar).
import crypto from 'crypto';

const VENTANA_TS_MS = 5 * 60 * 1000; // tolerancia de reloj de un sensor

// Firma HMAC-SHA256 (hex) de `${ts}.${cuerpoCrudo}` con el secreto del dispositivo.
export function firmar(secreto, ts, cuerpoCrudo) {
    return crypto.createHmac('sha256', secreto).update(`${ts}.${cuerpoCrudo}`).digest('hex');
}

export function firmaValida(secreto, ts, cuerpoCrudo, firma) {
    const esperada = Buffer.from(firmar(secreto, ts, cuerpoCrudo), 'hex');
    const recibida = Buffer.from(String(firma), 'hex');
    return esperada.length === recibida.length && crypto.timingSafeEqual(esperada, recibida);
}

// Encadena cada lectura con la anterior: alterar una lectura pasada invalida todos los hashes posteriores.
export function hashLectura(hashPrevio, datos) {
    return crypto.createHash('sha256').update(`${hashPrevio ?? 'GENESIS'}|${JSON.stringify(datos)}`).digest('hex');
}

// -> { estado: 'ACEPTADA' | 'RECHAZADA' | 'EN_DISPUTA', motivo }
export function validarLectura({ indice, valor, tsMs, ahoraMs = Date.now(), ultimoValor = null, esIoT }) {
    if (typeof valor !== 'number' || !Number.isFinite(valor)) return { estado: 'RECHAZADA', motivo: 'Valor no numérico.' };
    if (esIoT && (!Number.isFinite(tsMs) || Math.abs(ahoraMs - tsMs) > VENTANA_TS_MS)) {
        return { estado: 'RECHAZADA', motivo: 'Marca de tiempo fuera de la ventana permitida (sensor desfasado o reenvío).' };
    }
    const [min, max] = indice.rango;
    if (valor < min || valor > max) return { estado: 'RECHAZADA', motivo: `Valor fuera del rango físico [${min}, ${max}].` };
    if (ultimoValor !== null && Math.abs(valor - ultimoValor) > indice.maxSalto) {
        return { estado: 'EN_DISPUTA', motivo: `Salto de ${Math.abs(valor - ultimoValor).toFixed(1)} ${indice.unidad} respecto de la lectura anterior.` };
    }
    return { estado: 'ACEPTADA', motivo: null };
}

const mediana = (xs) => {
    const a = [...xs].sort((x, y) => x - y);
    const m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};

export function agregar(valores, modo) {
    if (valores.length === 0) return null;
    if (modo === 'min') return Math.min(...valores);
    if (modo === 'max') return Math.max(...valores);
    if (modo === 'promedio') return valores.reduce((a, b) => a + b, 0) / valores.length;
    return valores[valores.length - 1]; // 'ultimo' (lecturas ya ordenadas por fecha)
}

// Consenso de un periodo a partir de lecturas ACEPTADAS { tipo, fuente, valor }.
//  - Con lectura(s) OFICIAL(es): manda la fuente oficial.
//  - Solo con IoT: exige >= minDispositivos dispositivos distintos y usa la mediana de sus valores agregados.
//  - En cualquier otro caso: sin datos suficientes => NO se dispara ni se paga.
export function consenso(lecturas, { agregacion, minDispositivos = 2 }) {
    const oficiales = lecturas.filter((l) => l.tipo === 'OFICIAL');
    if (oficiales.length > 0) {
        return { ok: true, valor: agregar(oficiales.map((l) => l.valor), agregacion), base: 'OFICIAL', fuentes: [...new Set(oficiales.map((l) => l.fuente))] };
    }
    const porDispositivo = new Map();
    for (const l of lecturas.filter((x) => x.tipo === 'IOT')) {
        if (!porDispositivo.has(l.fuente)) porDispositivo.set(l.fuente, []);
        porDispositivo.get(l.fuente).push(l.valor);
    }
    if (porDispositivo.size < minDispositivos) {
        return { ok: false, valor: null, base: 'IOT', fuentes: [...porDispositivo.keys()], motivo: `Se requieren ${minDispositivos} fuentes independientes o una oficial; hay ${porDispositivo.size}.` };
    }
    const valores = [...porDispositivo.values()].map((v) => agregar(v, agregacion));
    return { ok: true, valor: mediana(valores), base: 'IOT', fuentes: [...porDispositivo.keys()] };
}
