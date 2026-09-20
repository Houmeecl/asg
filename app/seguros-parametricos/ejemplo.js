// Caso de ejemplo de la portada: helada en el Valle de Azapa.
// La serie es SINTÉTICA e ilustrativa (temporada normal con una helada de 3 noches); no proviene de una estación real.
import { RIESGOS, cotizar, pagoFraccion } from './data';

export const DIAS = 90;
export const serie = Array.from({ length: DIAS }, (_, i) => {
  const base = 8 + 3 * Math.sin(i / 6) + 2 * Math.cos(i / 3.3);
  const helada = 11.6 * Math.exp(-((i - 52) ** 2) / (2 * 2.2 ** 2));
  return +(base - helada).toFixed(1);
});

const monto = 80_000_000;
const meses = 3;
const cot = cotizar('helada', monto, meses, 50);
const minimo = Math.min(...serie);
const fraccion = pagoFraccion('helada', cot.umbral, minimo);

export const EJEMPLO = {
  riesgo: RIESGOS.helada,
  monto, meses, cot,
  prima: cot.prima, umbral: cot.umbral,
  minimo, diaMin: serie.indexOf(minimo),
  fraccion, pago: monto * fraccion,
};
