// server/services/flotaService.js
const crypto = require('crypto');
const QRCode = require('qrcode');
const { XMLParser } = require('fast-xml-parser');

const parser = new XMLParser();

// Factores de emisión estándar (kg CO2 / litro) — IPCC / GHG Protocol
const FACTORES_CO2_KG_POR_LITRO = {
    DIESEL: 2.68,
    GASOLINA: 2.31,
};

function parsearLecturaUso(xmlString) {
    const data = parser.parse(xmlString);
    const nodo = data.lectura;
    if (!nodo) throw new Error('XML de uso inválido: falta el nodo <lectura>');
    return {
        patente: String(nodo.patente || '').toUpperCase(),
        valor: Number(nodo.valor),
        unidad: String(nodo.unidad || '').toUpperCase(),
        fecha: nodo.fecha,
    };
}

function parsearLecturaCombustible(xmlString) {
    const data = parser.parse(xmlString);
    const nodo = data.lectura_combustible;
    if (!nodo) throw new Error('XML de combustible inválido: falta el nodo <lectura_combustible>');
    return {
        patente: String(nodo.patente || '').toUpperCase(),
        litros: Number(nodo.litros),
        folio_dte: nodo.folio_dte ? String(nodo.folio_dte) : null,
        rut_emisor: nodo.rut_emisor ? String(nodo.rut_emisor) : null,
        fecha: nodo.fecha,
    };
}

function calcularConsumoEsperado(tasaReferenciaLitros, lecturaUso) {
    return Number((tasaReferenciaLitros * lecturaUso).toFixed(3));
}

function calcularDiscrepanciaPct(consumoDeclarado, consumoEsperado) {
    if (consumoEsperado === 0) return 0;
    return Number((((consumoDeclarado - consumoEsperado) / consumoEsperado) * 100).toFixed(2));
}

function calcularCO2Kg(litros, tipoCombustible) {
    const factor = FACTORES_CO2_KG_POR_LITRO[tipoCombustible] || FACTORES_CO2_KG_POR_LITRO.DIESEL;
    return Number((litros * factor).toFixed(3));
}

// Rent a car/leasing sin control operacional del activo arrendado → Alcance 3 (Cat. 13, downstream leased assets)
// Transporte/maquinaria operada directamente por la empresa dueña → Alcance 1
function determinarAlcanceGHG(tipoNegocio) {
    return tipoNegocio === 'TRANSPORTE' ? 'ALCANCE_1' : 'ALCANCE_3';
}

function generarHashEvidencia(xmlUso, xmlCombustible) {
    return crypto.createHash('sha256').update(xmlUso + '|' + xmlCombustible).digest('hex');
}

async function generarQR(codigoQr) {
    // Data URL (PNG base64) — se embebe directo en la respuesta, sin servir archivos estáticos
    return QRCode.toDataURL(codigoQr, { errorCorrectionLevel: 'M', margin: 1, width: 256 });
}

function generarCodigoQR() {
    return crypto.randomUUID();
}

function generarNumeroAdhesivo(contratoId, secuencia) {
    return `SICR3P-${contratoId}-${String(secuencia).padStart(4, '0')}`;
}

module.exports = {
    parsearLecturaUso,
    parsearLecturaCombustible,
    calcularConsumoEsperado,
    calcularDiscrepanciaPct,
    calcularCO2Kg,
    determinarAlcanceGHG,
    generarHashEvidencia,
    generarQR,
    generarCodigoQR,
    generarNumeroAdhesivo,
    FACTORES_CO2_KG_POR_LITRO,
};
