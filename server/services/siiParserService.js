const { XMLParser } = require('fast-xml-parser');

const FACTOR_DIESEL = 2.71; 
const FACTOR_EE = 0.38;     

function parsearFacturaXML(xmlContent) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
  });

  const parsed = parser.parse(xmlContent);
  const documento = parsed.DTE ? parsed.DTE.Documento : (parsed.Documento || parsed);

  if (!documento) {
    throw new Error('Estructura XML de DTE no válida');
  }

  const encabezado = documento.Encabezado;
  const folio = encabezado?.IdDoc?.Folio || "0";
  const rutEmisor = encabezado?.Emisor?.RUTEmisor || "N/A";

  let detalles = documento.Detalle;
  if (!Array.isArray(detalles)) {
    detalles = [detalles];
  }

  const resultados = [];

  for (const item of detalles) {
    if (!item) continue;

    const nombreItem = item.NmbItem || "Sin descripción";
    const montoNeto = parseFloat(item.MontoItem || 0);
    const cantidad = parseFloat(item.QtyItem || 0);

    let categoria = "OTROS";
    let unidadMedida = "N/A";
    let emisionesCO2eTon = 0;

    const nombreUpper = nombreItem.toUpperCase();

    if (nombreUpper.includes("DIESEL") || nombreUpper.includes("PETROLEO")) {
      categoria = "COMBUSTIBLE (ALCANCE 1)";
      unidadMedida = "LITROS";
      emisionesCO2eTon = (cantidad * FACTOR_DIESEL) / 1000;
    } else if (nombreUpper.includes("ELECTRICIDAD") || nombreUpper.includes("KWH")) {
      categoria = "ENERGÍA (ALCANCE 2)";
      unidadMedida = "KWH";
      emisionesCO2eTon = (cantidad * FACTOR_EE) / 1000;
    } else if (nombreUpper.includes("AGUA") || nombreUpper.includes("M3")) {
      categoria = "CAPITAL NATURAL (AGUA)";
      unidadMedida = "M3";
    }

    resultados.push({
      folio,
      rutEmisor,
      itemDescripcion: nombreItem,
      montoNeto,
      cantidadFisica: cantidad,
      unidadMedida,
      categoriaASG: categoria,
      emisionesCO2eTon: parseFloat(emisionesCO2eTon.toFixed(4))
    });
  }

  return resultados;
}

module.exports = { parsearFacturaXML };