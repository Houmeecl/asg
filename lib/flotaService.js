// lib/flotaService.js
import crypto from 'crypto';
import QRCode from 'qrcode';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser();

// Factor de emisión del combustible 100% fósil (kg CO2 / litro), sin mezcla de
// biocombustible — coincide con IPCC 2006 / EPA GHG Emission Factors Hub / HuellaChile
// nivel básico (2.676 diésel, 2.241 gasolina). Ver docs/investigacion-co2-internacional.md.
export const FACTORES_CO2_FOSIL_KG_POR_LITRO = {
    DIESEL: 2.68,
    GASOLINA: 2.31,
};

// % obligatorio de biocombustible mezclado en el combustible vendido en surtidor,
// por país — determina qué fracción del litro reportado es fósil (cuenta para el
// alcance GHG) vs biogénica (se reporta aparte, no suma al total de Alcance 1/3
// según el GHG Protocol Corporate Standard). Chile: mezcla voluntaria B2-B5/E2-E5,
// consumo real hoy insignificante — se trata como 0% a efectos de cálculo.
// Perú: B5 obligatorio (diésel) + gasohol ~7.8% etanol (DS 021-2007-EM, OSINERGMIN).
// Brasil: B15 obligatorio (diésel) + E30 obligatorio (gasolina) — Ley 11.097/2005, ANP.
export const MEZCLA_BIOCOMBUSTIBLE_PCT_POR_PAIS = {
    CL: { DIESEL: 0, GASOLINA: 0, fuente: 'HuellaChile / IPCC 2006 — factor nivel básico, sin ajuste (blend voluntario marginal)' },
    PE: { DIESEL: 5, GASOLINA: 7.8, fuente: 'OSINERGMIN DS 021-2007-EM (B5) + gasohol; factor base IPCC/INFOCARBONO' },
    BR: { DIESEL: 15, GASOLINA: 30, fuente: 'ANP / Lei 11.097/2005 (B15 + E30, vigente desde 2026); factor base IPCC — MCTI recomendado para producción' },
};

export const PAISES_SOPORTADOS = ['CL', 'PE', 'BR'];

export function parsearLecturaUso(xmlString) {
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

export function parsearLecturaCombustible(xmlString) {
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

export function calcularConsumoEsperado(tasaReferenciaLitros, lecturaUso) {
    return Number((tasaReferenciaLitros * lecturaUso).toFixed(3));
}

export function calcularDiscrepanciaPct(consumoDeclarado, consumoEsperado) {
    if (consumoEsperado === 0) return 0;
    return Number((((consumoDeclarado - consumoEsperado) / consumoEsperado) * 100).toFixed(2));
}

// Separa el CO2 fósil (cuenta para el total de Alcance 1/3) del CO2 biogénico
// (se reporta aparte, no suma al alcance — GHG Protocol Corporate Standard).
// La fracción biogénica se estima con el mismo factor del combustible fósil
// equivalente por simplicidad — es una aproximación conservadora documentada,
// no un factor de ciclo de vida completo del biocombustible (que requeriría
// datos de producción específicos de cada planta, fuera de alcance aquí).
export function calcularCO2(litros, tipoCombustible, pais = 'CL') {
    const factor = FACTORES_CO2_FOSIL_KG_POR_LITRO[tipoCombustible] || FACTORES_CO2_FOSIL_KG_POR_LITRO.DIESEL;
    const mezcla = MEZCLA_BIOCOMBUSTIBLE_PCT_POR_PAIS[pais] || MEZCLA_BIOCOMBUSTIBLE_PCT_POR_PAIS.CL;
    const blendPct = mezcla[tipoCombustible] ?? 0;

    const litrosFosiles = litros * (1 - blendPct / 100);
    const litrosBiogenicos = litros * (blendPct / 100);

    return {
        co2_fosil_kg: Number((litrosFosiles * factor).toFixed(3)),
        co2_biogenico_kg: Number((litrosBiogenicos * factor).toFixed(3)),
        mezcla_biocombustible_pct: blendPct,
        factor_fuente: mezcla.fuente,
    };
}

// Rent a car/leasing sin control operacional del activo arrendado → Alcance 3 (Cat. 13, downstream leased assets)
// Transporte/maquinaria operada directamente por la empresa dueña → Alcance 1
export function determinarAlcanceGHG(tipoNegocio) {
    return tipoNegocio === 'TRANSPORTE' ? 'ALCANCE_1' : 'ALCANCE_3';
}

export function generarHashEvidencia(xmlUso, xmlCombustible) {
    return crypto.createHash('sha256').update(xmlUso + '|' + xmlCombustible).digest('hex');
}

export async function generarQR(codigoQr) {
    return QRCode.toDataURL(codigoQr, { errorCorrectionLevel: 'M', margin: 1, width: 256 });
}

export function generarCodigoQR() {
    return crypto.randomUUID();
}

export function generarNumeroAdhesivo(contratoId, secuencia) {
    return `SICR3P-${contratoId}-${String(secuencia).padStart(4, '0')}`;
}
