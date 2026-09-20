// Caso de ejemplo de la portada: calor anómalo en el Valle de Azapa (Arica).
//
// DATOS REALES: temperatura máxima diaria (°C) del 21-jun-2026 al 18-sep-2026 para -18.53,-70.17
// (Santa Rosa, Arica), obtenida del servicio de resúmenes diarios de Xweather (Vaisala) el 20-sep-2026.
// Es una instantánea estática: la página no consulta a Xweather en tiempo real. Antes de publicar, confirmar
// con Xweather que su licencia permite mostrar estos datos en un sitio comercial y citar la fuente.
//
// Nota climática: en Azapa la temperatura mínima de estos 90 días nunca bajó de 15,8 °C, por eso el ejemplo
// es de calor y no de helada.
import { RIESGOS, cotizar, pagoFraccion } from './data';

export const FUENTE = 'Xweather · resumen diario, Santa Rosa (Arica), −18,53 / −70,17';
export const INICIO = new Date(Date.UTC(2026, 5, 21)); // 21 de junio de 2026

export const serie = [
  20.1, 21.31, 20.31, 20.91, 21.14, 20.56, 20.39, 20.8, 20.46, 20.75, 20.63, 21.52, 21.52, 22.11, 21.13, 23.18, 22.13, 21.26, 22, 21.24, 21.03, 20.46, 20.55, 22.2, 20.75, 21.24, 22.06, 21.83, 21.08, 20.55,
  21.93, 21.67, 22.29, 21.3, 21.31, 21.7, 21.03, 21.44, 22.71, 23.18, 22.69, 21.9, 22, 21.61, 21.59, 21.44, 20.8, 20.9, 21, 21.57, 22.53, 26.16, 24.39, 23.82, 22.45, 21.95, 21.5, 19.26, 18.66, 21.15,
  21.57, 21.86, 22.29, 20.69, 22.41, 23.8, 23.04, 22.16, 22.37, 22.71, 22.83, 23.14, 22.37, 22.27, 22.88, 23.13, 24.47, 23.4, 23.13, 22.58, 24.77, 23.33, 23.04, 22.44, 23.59, 24.66, 24.22, 24.68, 26.31, 28.87,
];
export const DIAS = serie.length;

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export function fechaDia(i) {
  const d = new Date(INICIO.getTime() + i * 86_400_000);
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
}

const monto = 80_000_000;
const meses = 3;
const cot = cotizar('calorMax', monto, meses, 50);
const maximo = Math.max(...serie);
const fraccion = pagoFraccion('calorMax', cot.umbral, maximo);

export const EJEMPLO = {
  riesgo: RIESGOS.calorMax,
  monto, meses, cot,
  prima: cot.prima, umbral: cot.umbral,
  maximo, diaMax: serie.indexOf(maximo),
  diasSobreUmbral: serie.filter((t) => t > cot.umbral).length,
  normal: +(serie.reduce((a, b) => a + b, 0) / serie.length).toFixed(1),
  fraccion, pago: monto * fraccion,
};
