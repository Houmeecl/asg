import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import db from '@/lib/db';
import { actividadesDelExpediente } from '@/lib/trazabilidadIndustrial';

const UPLOADS_DIR = path.resolve(process.cwd(), 'data', 'uploads');

export const BLOQUES_EVIDENCIA = [
  'EMPRESA_INSTALACION',
  'VENTA',
  'MATERIAL',
  'ENERGIA',
  'COMBUSTIBLE',
  'PRODUCCION',
  'ENTREGA',
];

const NOMBRES_PAIS = {
  CL: 'Chile', AR: 'Argentina', BO: 'Bolivia', BR: 'Brazil', PY: 'Paraguay', PE: 'Peru',
};

const ETAPAS_CORREDOR = [
  'PRODUCTOR_ORIGEN', 'EXPORTADOR', 'TRANSPORTE', 'ADUANA_PUERTO', 'IMPORTADOR_DESTINO',
];

const PRODUCTOS_EUDR = ['Bovinos', 'Cacao', 'Café', 'Palma aceitera', 'Caucho', 'Soja', 'Madera'];

function codigoCnNormalizado(codigo) {
  return String(codigo || '').replace(/\D/g, '');
}

export function referenciasCbam({ pais_origen, codigo_cn }) {
  const pais = NOMBRES_PAIS[String(pais_origen || '').toUpperCase()] || pais_origen || null;
  const codigoNormalizado = codigoCnNormalizado(codigo_cn);
  const fuentes = db.prepare(`
    SELECT clave, titulo, tipo, referencia_legal, version, fecha_publicacion, vinculante, url_oficial, nota_uso
    FROM fuentes_normativas
    WHERE clave IN ('CBAM_METODOLOGIA_2025_2547', 'CBAM_VERIFICACION_2025_2546', 'CBAM_ACREDITACION_2025_2551', 'CBAM_GUIA_VERIFICACION_2026', 'CBAM_VALORES_DEFECTO_2026_08', 'CBAM_BENCHMARKS_2026_02')
    ORDER BY vinculante DESC, fecha_publicacion DESC
  `).all();
  const parametros = codigoNormalizado ? [`${codigoNormalizado}%`] : [];
  const filtroCodigo = codigoNormalizado ? 'AND v.codigo_cn_normalizado LIKE ?' : '';
  const valoresDefecto = pais && codigoNormalizado ? db.prepare(`
    SELECT v.codigo_cn, v.descripcion, v.sector, v.ruta_produccion, v.emisiones_directas, v.emisiones_indirectas, v.emisiones_totales, v.unidad, f.version, f.referencia_legal
    FROM valores_cbam_referencia v JOIN fuentes_normativas f ON f.id = v.fuente_id
    WHERE v.tipo = 'VALOR_POR_DEFECTO' AND v.pais = ? ${filtroCodigo}
    ORDER BY LENGTH(v.codigo_cn_normalizado), v.codigo_cn LIMIT 12
  `).all(pais, ...parametros) : [];
  const benchmarks = codigoNormalizado ? db.prepare(`
    SELECT v.codigo_cn, v.descripcion, v.sector, v.benchmark_a, v.ruta_benchmark_a, v.benchmark_b, v.ruta_benchmark_b, v.unidad, f.version, f.referencia_legal
    FROM valores_cbam_referencia v JOIN fuentes_normativas f ON f.id = v.fuente_id
    WHERE v.tipo = 'BENCHMARK' ${filtroCodigo}
    ORDER BY LENGTH(v.codigo_cn_normalizado), v.codigo_cn LIMIT 12
  `).all(...parametros) : [];

  return {
    pais,
    codigo_cn: codigo_cn || null,
    fuentes,
    valores_defecto: valoresDefecto,
    benchmarks,
    aviso: codigoNormalizado
      ? 'Los valores por defecto y benchmarks son referencias normativas versionadas; no prueban emisiones reales ni sustituyen la evidencia de la instalación.'
      : 'Ingresa un código CN para consultar referencias de valores por defecto y benchmarks aplicables al expediente.',
  };
}

export function guardarOriginal(archivo) {
  const buffer = Buffer.from(archivo);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  return { buffer, hash, uploadsDir: UPLOADS_DIR };
}

export function resumenExpediente(expedienteId) {
  const expediente = db.prepare(`
    SELECT e.*, p.razon_social AS proveedor, p.rut AS proveedor_rut,
           i.nombre AS instalacion, i.comuna AS comuna_instalacion
    FROM expedientes_industriales e
    JOIN empresas_proveedoras p ON p.id = e.proveedor_id
    LEFT JOIN instalaciones_industriales i ON i.id = e.instalacion_id
    WHERE e.id = ?
  `).get(expedienteId);

  if (!expediente) return null;

  const evidencia = db.prepare(`
    SELECT bloque, nivel_respaldo, COUNT(*) AS cantidad
    FROM evidencias_industriales WHERE expediente_id = ?
    GROUP BY bloque, nivel_respaldo
  `).all(expedienteId);
  const hitos = db.prepare(`SELECT * FROM hitos_corredor WHERE expediente_id = ? ORDER BY id`).all(expedienteId);
  const trazabilidad = actividadesDelExpediente(expedienteId);
  const eudrRegistros = expediente.flujo === 'CORREDOR_BIOCEANICO'
    ? db.prepare(`SELECT * FROM eudr_corredor WHERE expediente_id = ? ORDER BY id DESC`).all(expedienteId)
    : [];
  const fuenteEudr = expediente.flujo === 'CORREDOR_BIOCEANICO'
    ? db.prepare(`SELECT clave, titulo, referencia_legal, version, url_oficial, nota_uso FROM fuentes_normativas WHERE clave = ?`).get('EUDR_REGLAMENTO_2023_1115')
    : null;
  const paisesCorredor = expediente.flujo === 'CORREDOR_BIOCEANICO'
    ? db.prepare('SELECT * FROM paises_corredor ORDER BY codigo').all()
    : [];

  const bloques = BLOQUES_EVIDENCIA.map((bloque) => {
    const registros = evidencia.filter((item) => item.bloque === bloque);
    return {
      bloque,
      cantidad: registros.reduce((sum, item) => sum + item.cantidad, 0),
      declarado: registros.find((item) => item.nivel_respaldo === 'DECLARADO')?.cantidad || 0,
      documentado: registros.find((item) => item.nivel_respaldo === 'DOCUMENTADO')?.cantidad || 0,
      validado_en_fuente: registros.find((item) => item.nivel_respaldo === 'VALIDADO_EN_FUENTE')?.cantidad || 0,
    };
  });

  const bloquesConEvidencia = bloques.filter((bloque) => bloque.cantidad > 0).length;
  const pendientes = [];
  const agregarPendiente = (tipo, texto, bloqueaSalida = true) => pendientes.push({ tipo, texto, bloquea_salida: bloqueaSalida });
  if (!expediente.instalacion_id) agregarPendiente('ALCANCE', 'Identificar la instalación donde ocurre la producción.');
  if (!expediente.lote) agregarPendiente('ALCANCE', 'Incorporar lote o referencia de producción.');
  for (const bloque of bloques.filter((bloque) => bloque.cantidad === 0)) {
    agregarPendiente('EVIDENCIA', `Incorporar evidencia para: ${bloque.bloque.replaceAll('_', ' ').toLowerCase()}.`);
  }
  const referencias = expediente.flujo === 'CBAM' ? referenciasCbam(expediente) : null;
  if (expediente.flujo === 'CBAM') {
    if (!expediente.codigo_cn) agregarPendiente('NORMA', 'Confirmar el código CN para asociar referencias CBAM.');
    if (expediente.codigo_cn && referencias.valores_defecto.length === 0) agregarPendiente('NORMA', 'Revisar la coincidencia país de origen / código CN en las referencias cargadas.');
    agregarPendiente('REVISION', 'Documentar conclusión del verificador y los hallazgos antes de emitir el Informe Preverificado CBAM.', false);
  }
  if (expediente.flujo === 'CORREDOR_BIOCEANICO') {
    const etapasRegistradas = new Set(hitos.map((hito) => hito.etapa));
    for (const etapa of ETAPAS_CORREDOR.filter((etapa) => !etapasRegistradas.has(etapa))) {
      agregarPendiente('CORREDOR', `Registrar hito: ${etapa.replaceAll('_', ' ').toLowerCase()}.`);
    }
    if (eudrRegistros.length === 0) {
      agregarPendiente('EUDR', 'Registrar evaluación EUDR del producto transportado: aplica, no aplica o queda pendiente de análisis.');
    }
    for (const registro of eudrRegistros.filter((item) => item.aplica === 'APLICA')) {
      if (!registro.producto_relevante) agregarPendiente('EUDR', 'Identificar producto relevante EUDR: bovinos, cacao, café, palma aceitera, caucho, soja o madera.');
      if (!registro.codigo_hs) agregarPendiente('EUDR', 'Registrar código HS/CN del producto EUDR.');
      if (!registro.pais_produccion) agregarPendiente('EUDR', 'Registrar país de producción del producto EUDR.');
      if (!registro.geolocalizacion) agregarPendiente('EUDR', 'Agregar geolocalización, polígono o referencia del predio/origen productivo.');
      if (!registro.documento_legalidad) agregarPendiente('EUDR', 'Agregar documento de legalidad del país de producción.');
    }
  }
  return {
    ...expediente,
    bloques,
    hitos,
    trazabilidad,
    eudr: expediente.flujo === 'CORREDOR_BIOCEANICO' ? {
      fuente: fuenteEudr,
      productos_relevantes: PRODUCTOS_EUDR,
      registros: eudrRegistros,
      aviso: 'EUDR exige evaluar productos relevantes libres de deforestación, legalidad en país de producción y debida diligencia antes de su colocación o exportación en la UE. SICR3P prepara evidencia del corredor; no presenta DDS ni actúa por el operador/importador europeo.',
      fechas: 'Aplicación oficial: 30 de diciembre de 2026 para operadores grandes y medianos; 30 de junio de 2027 para micro y pequeñas empresas.',
    } : null,
    paises_corredor: paisesCorredor,
    referencias_cbam: referencias,
    plan_completitud: {
      completitud_pct: Math.round(((BLOQUES_EVIDENCIA.length - bloques.filter((bloque) => bloque.cantidad === 0).length) / BLOQUES_EVIDENCIA.length) * 100),
      pendientes,
      bloqueos_salida: pendientes.filter((pendiente) => pendiente.bloquea_salida).length,
      listo_para_revision: pendientes.every((pendiente) => !pendiente.bloquea_salida),
    },
    cobertura_pct: Math.round((bloquesConEvidencia / BLOQUES_EVIDENCIA.length) * 100),
    aviso: expediente.flujo === 'CBAM'
      ? 'Informe Preverificado CBAM validado por verificador registrado. Describe la evidencia revisada y sus brechas; no genera certificados CBAM ni sustituye el informe formal de verificación aplicable.'
      : 'Cobertura documental y nivel de respaldo describen evidencia y brechas del expediente.',
  };
}
