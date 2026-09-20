// lib/contratosCalc.js — cálculo puro de liquidación, backtest y reserva (sin base de datos).
import { fraccionLineal } from '@/app/seguros-parametricos/data';

// Monto a pagar por un valor de índice, con tope en el monto máximo del contrato. Nunca negativo.
export function montoLiquidacion({ umbral, salida, montoMax }, valor) {
    const fraccion = fraccionLineal(umbral, salida, valor);
    return { fraccion, monto: Math.round(montoMax * fraccion) };
}

const RECARGO = 1.35; // margen sobre el pago esperado histórico (gastos, riesgo, capital); ajustable por el usuario

// serie: [{ periodo, valor }] histórica. Devuelve la experiencia de pagos si el contrato hubiera existido.
export function backtest(serie, contrato) {
    const filas = serie.filter((p) => Number.isFinite(p.valor)).map((p) => ({ ...p, ...montoLiquidacion(contrato, p.valor) }));
    if (filas.length === 0) return { n: 0 };
    const activaciones = filas.filter((f) => f.monto > 0);
    const pagoEsperadoMensual = filas.reduce((a, f) => a + f.monto, 0) / filas.length;
    const peor = filas.reduce((m, f) => (f.monto > m.monto ? f : m), filas[0]);
    return {
        n: filas.length,
        activaciones: activaciones.length,
        frecuencia: activaciones.length / filas.length,
        pagoEsperadoMensual: Math.round(pagoEsperadoMensual),
        peorPeriodo: { periodo: peor.periodo, monto: peor.monto },
        cargoSugeridoMensual: Math.round(pagoEsperadoMensual * RECARGO),
        // Con pocos periodos la estimación es frágil: se avisa en vez de aparentar precisión.
        confiable: filas.length >= 36,
    };
}

// Exposición máxima = suma de los montos máximos de contratos REAL vigentes. Se compara con la reserva declarada.
export function evaluarReserva({ exposicionActual, montoNuevo, reserva }) {
    const total = exposicionActual + montoNuevo;
    return { total, reserva, ok: Number.isFinite(reserva) && reserva > 0 && total <= reserva };
}
