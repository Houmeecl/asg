// lib/oraculo/indices.js — catálogo de índices que puede medir el oráculo.
//
// IMPORTANTE: el catálogo es configuración, no una afirmación legal. Qué índices son admisibles para un
// contrato lo determina la opinión legal del usuario (y, si se convierte en seguro, la norma de la CMF).
// Los índices marcados `verificado: false` requieren confirmar fuente, publicación y periodicidad antes de usarse.
//
//   dir        'menor' paga cuando el índice cae bajo el umbral; 'mayor' cuando lo supera.
//   agregacion cómo se resume un periodo (mes) a partir de varias lecturas: ultimo | min | max | promedio.
//   rango      valores físicamente posibles; fuera de él la lectura se rechaza.
//   maxSalto   variación máxima aceptada entre lecturas consecutivas (en unidades del índice); mayor => EN_DISPUTA.
export const INDICES = {
    actividad_minera_region: {
        nombre: 'Índice de actividad minera regional (Antofagasta)',
        unidad: 'índice (base 100)', dir: 'menor', umbral: 90, salida: 70,
        rango: [0, 300], maxSalto: 40, agregacion: 'ultimo', periodicidad: 'mensual', tipo: 'OFICIAL',
        fuente: 'Serie oficial cargada por el administrador (p. ej. estadísticas mineras públicas). Confirmar publicación y rezago antes de usar.',
        verificado: false,
    },
    precipitacion_24h: {
        nombre: 'Precipitación máxima en 24 h',
        unidad: 'mm', dir: 'mayor', umbral: 30, salida: 80,
        rango: [0, 500], maxSalto: 300, agregacion: 'max', periodicidad: 'diaria', tipo: 'OFICIAL',
        fuente: 'Estación oficial de la Dirección Meteorológica de Chile (citar la fuente).',
        verificado: false,
    },
    viento_rafaga: {
        nombre: 'Ráfaga máxima de viento (sensor propio o estación)',
        unidad: 'km/h', dir: 'mayor', umbral: 70, salida: 130,
        rango: [0, 400], maxSalto: 200, agregacion: 'max', periodicidad: 'diaria', tipo: 'IOT',
        fuente: 'Sensores IoT registrados; se valida contra una fuente oficial cuando exista.',
        verificado: false,
    },
};

export const indicePorId = (id) => INDICES[id] ?? null;
