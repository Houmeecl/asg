// Vocabulario y avisos del contrato de cobertura por índice, en UN solo lugar.
//
// La terminología definitiva (y qué se puede afirmar públicamente) la fija la opinión legal escrita del titular
// del proyecto: si esa opinión cambia el nombre o el alcance de algo, se cambia aquí. Este archivo no decide
// la naturaleza jurídica del contrato; solo evita que el texto quede disperso por el sitio.

export const TERMINOS = {
  contrato: 'Contrato de cobertura por índice',
  cargo: 'cargo mensual',
  umbral: 'umbral de activación',
  liquidacion: 'liquidación',
  empresa: 'la Empresa',
  cliente: 'la PYME',
};

// Aviso obligatorio en todo documento y pantalla de contratación del piloto.
export const AVISO_CONTRATO =
  'Este contrato no es un seguro ni está supervisado por la Comisión para el Mercado Financiero. El pago depende de la capacidad de pago de la Empresa y de los datos del índice pactado.';

export const AVISO_BORRADOR =
  'BORRADOR — requiere revisión legal antes de firmarse. No constituye asesoría legal.';

export const AVISO_SIMULADO =
  'Este contrato opera en MODO SIMULACIÓN: se mide el índice y se calcula lo que se habría pagado, pero no genera obligaciones de pago para ninguna de las partes.';

// Aviso del sitio público mientras no exista una opinión legal registrada.
export const AVISO_SITIO =
  'Sitio de demostración: hoy no se comercializan coberturas ni seguros. Las cotizaciones y ejemplos son ilustrativos.';
