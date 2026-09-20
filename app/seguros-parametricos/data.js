// Datos y lógica compartida del sitio SICR3P Seguros. Todo ilustrativo (demo).

export const BASE = '/seguros-parametricos';

// `dir`: el pago se activa cuando el índice cae por debajo ('menor') o sube por encima ('mayor') del umbral.
export const RIESGOS = {
  helada: { nombre: 'Helada', indice: 'Temperatura mínima', unidad: '°C', dir: 'menor', umbral: -2, salida: -6, base: 0.09 },
  sequia: { nombre: 'Sequía', indice: 'Precipitación acumulada', unidad: 'mm', dir: 'menor', umbral: 120, salida: 40, base: 0.12 },
  lluvia: { nombre: 'Lluvia intensa / aluvión', indice: 'Precipitación en 24 h', unidad: 'mm', dir: 'mayor', umbral: 40, salida: 90, base: 0.07 },
  viento: { nombre: 'Viento', indice: 'Ráfaga máxima', unidad: 'km/h', dir: 'mayor', umbral: 70, salida: 130, base: 0.06 },
  calor: { nombre: 'Ola de calor', corto: 'Calor', indice: 'Días sobre 35 °C', unidad: 'días', dir: 'mayor', umbral: 5, salida: 20, base: 0.1 },
  calorMax: { nombre: 'Calor anómalo', indice: 'Temperatura máxima diaria', unidad: '°C', dir: 'mayor', umbral: 26, salida: 32, base: 0.1 },
  marejada: { nombre: 'Marejada', indice: 'Altura significativa de ola', unidad: 'm', dir: 'mayor', umbral: 3, salida: 6, base: 0.08 },
};

export const ZONAS_NORTE = ['Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo'];

export const SECTORES = [
  {
    slug: 'mineria',
    lugar: { lat: -22.295, lon: -68.9, z: 13, nombre: 'Zona minera de Calama, Antofagasta' },
    nombre: 'Minería y faenas',
    corto: 'Faenas, campamentos y rutas de acceso',
    icon: 'Mountain',
    zonas: ['Tarapacá', 'Antofagasta', 'Atacama'],
    zonaDefault: 'Antofagasta',
    riesgos: ['lluvia', 'viento', 'helada'],
    riesgoDefault: 'lluvia',
    resumen:
      'Una lluvia altiplánica o un temporal de viento puede detener una faena, cortar una ruta o dejar sin acceso un campamento. El seguro paramétrico paga por el evento, sin esperar a evaluar el daño.',
    dolores: [
      ['Detención de faena', 'Días sin producción por lluvias o nieve en cota alta.'],
      ['Rutas cortadas', 'Quebradas activadas que aíslan campamentos y proveedores.'],
      ['Cadena de suministro', 'Las pymes proveedoras absorben el costo de la parada sin respaldo.'],
    ],
    riesgoDetalle: {
      lluvia: 'Precipitación en 24 h en la estación de referencia más cercana a la faena.',
      viento: 'Ráfaga máxima que obliga a suspender trabajos en altura y transporte.',
      helada: 'Temperatura mínima en campamentos y plantas en altura.',
    },
  },
  {
    slug: 'agricultura',
    lugar: { lat: -18.5295, lon: -70.166, z: 14, nombre: 'Valle de Azapa, Arica y Parinacota' },
    nombre: 'Agricultura de valles',
    corto: 'Olivos, hortalizas, uva de mesa y frutales',
    icon: 'Sprout',
    zonas: ['Arica y Parinacota', 'Atacama', 'Coquimbo'],
    zonaDefault: 'Arica y Parinacota',
    riesgoDefault: 'calorMax',
    riesgos: ['calorMax', 'helada', 'sequia'],
    resumen:
      'Los valles del norte producen en microclimas muy sensibles: una helada tardía o una ola de calor en floración se traduce en pérdidas de temporada. Cubre el índice, no la discusión sobre el daño.',
    dolores: [
      ['Helada en floración', 'Una noche bajo el umbral puede definir la cosecha completa.'],
      ['Estrés térmico', 'Semanas seguidas de calor extremo reducen calibre y calidad.'],
      ['Déficit hídrico', 'Lluvias invernales bajas limitan recarga de acuíferos y riego.'],
    ],
    riesgoDetalle: {
      helada: 'Temperatura mínima nocturna en la estación agroclimática del valle.',
      calorMax: 'Temperatura máxima diaria en la estación agroclimática del valle; los valles costeros como Azapa rara vez pasan de 25 °C.',
      sequia: 'Precipitación acumulada del periodo frente al promedio histórico.',
    },
  },
  {
    slug: 'energia',
    lugar: { lat: -22.77, lon: -69.47, z: 13, nombre: 'Desierto de Atacama, María Elena' },
    nombre: 'Energía solar y eólica',
    corto: 'Parques fotovoltaicos y eólicos',
    icon: 'Sun',
    zonas: ['Antofagasta', 'Atacama', 'Tarapacá'],
    zonaDefault: 'Atacama',
    riesgoDefault: 'viento',
    riesgos: ['viento', 'lluvia', 'calor'],
    resumen:
      'Los parques del desierto operan al límite de sus especificaciones: viento que obliga a detener seguidores, lluvias inusuales que dañan caminos y subestaciones, o calor que reduce generación.',
    dolores: [
      ['Vientos extremos', 'Los paneles se ponen en posición de resguardo y se pierde generación.'],
      ['Lluvias inusuales', 'Caminos, canalizaciones y subestaciones no están diseñados para aluviones.'],
      ['Temperatura alta', 'El calor extremo baja el rendimiento y acelera el desgaste.'],
    ],
    riesgoDetalle: {
      viento: 'Ráfaga máxima medida en el sitio o la estación más cercana.',
      lluvia: 'Precipitación en 24 h sobre el área del parque.',
      calor: 'Días sobre 35 °C en el periodo de cobertura.',
    },
  },
  {
    slug: 'turismo',
    lugar: { lat: -22.95, lon: -68.2, z: 12, nombre: 'San Pedro de Atacama, Antofagasta' },
    nombre: 'Turismo y altiplano',
    corto: 'Tour operadores, hoteles y eventos',
    icon: 'Plane',
    zonas: ['Arica y Parinacota', 'Tarapacá', 'Antofagasta'],
    zonaDefault: 'Antofagasta',
    riesgoDefault: 'lluvia',
    riesgos: ['lluvia', 'helada', 'viento'],
    resumen:
      'Una ruta cerrada por lluvia o nieve en temporada alta significa cancelaciones, reembolsos y ocupación perdida. Protege tu temporada con un pago automático ligado al clima observado.',
    dolores: [
      ['Cierre de rutas', 'Pasos y caminos del altiplano cortados en plena temporada.'],
      ['Cancelaciones', 'Reembolsos y reprogramaciones que nadie te cubre.'],
      ['Eventos al aire libre', 'Festivales y actividades expuestos al clima adverso.'],
    ],
    riesgoDetalle: {
      lluvia: 'Precipitación en 24 h en la estación de referencia del destino.',
      helada: 'Temperatura mínima en localidades de altura.',
      viento: 'Ráfaga máxima que suspende actividades y traslados.',
    },
  },
  {
    slug: 'pesca',
    lugar: { lat: -20.22, lon: -70.15, z: 13, nombre: 'Borde costero de Iquique, Tarapacá' },
    nombre: 'Pesca y acuicultura',
    corto: 'Caletas, pesca artesanal y centros de cultivo',
    icon: 'Waves',
    zonas: ['Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Coquimbo'],
    zonaDefault: 'Tarapacá',
    riesgoDefault: 'marejada',
    riesgos: ['marejada', 'viento'],
    resumen:
      'Las marejadas cierran puertos y caletas durante días. Cada jornada sin zarpar es ingreso perdido para pescadores, plantas y proveedores. El índice de oleaje define el pago, sin peritajes.',
    dolores: [
      ['Puertos cerrados', 'La autoridad marítima suspende la navegación por oleaje.'],
      ['Ingresos diarios', 'Sin zarpe no hay captura ni venta, y los costos fijos siguen.'],
      ['Daño en infraestructura', 'Muelles, balsas jaula y equipos expuestos al mar.'],
    ],
    riesgoDetalle: {
      marejada: 'Altura significativa de ola en la boya o modelo de oleaje de referencia.',
      viento: 'Ráfaga máxima costera que impide la operación.',
    },
  },
];

export const sectorPorSlug = (slug) => SECTORES.find((s) => s.slug === slug);

export const clp = (n) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

// Más sensibilidad = umbral más cercano a lo normal = más probabilidad de pago = más prima.
export function cotizar(riesgoKey, monto, meses, sensPct) {
  const r = RIESGOS[riesgoKey];
  const s = sensPct / 100;
  const prob = Math.min(0.6, r.base * (0.4 + 1.6 * s) * (meses / 6));
  const prima = monto * prob * 1.35;
  const umbral = r.umbral + (r.umbral - r.salida) * (s - 0.5) * 0.4;
  return { prob, prima, tasa: prima / monto, umbral };
}

// Fracción (0–1) del monto asegurado que paga el índice observado: lineal entre umbral y salida.
// Sirve en ambos sentidos: si salida > umbral paga al subir; si salida < umbral paga al bajar.
export function fraccionLineal(umbral, salida, valor) {
  if (!Number.isFinite(valor) || umbral === salida) return 0;
  return Math.max(0, Math.min(1, (valor - umbral) / (salida - umbral)));
}

export function pagoFraccion(riesgoKey, umbral, valor) {
  return fraccionLineal(umbral, RIESGOS[riesgoKey].salida, valor);
}

// Predio de ejemplo (Valle de Azapa) para el caso de helada de la portada. Polígono ilustrativo.
export const PREDIO_EJEMPLO = {
  centro: [-18.5295, -70.166],
  zoom: 14,
  poligono: [[-18.5277, -70.1713], [-18.5277, -70.1645], [-18.5333, -70.1645], [-18.5333, -70.1713]],
  estacion: [-18.5268, -70.1632],
};
