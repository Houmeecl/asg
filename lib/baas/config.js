/**
 * Datos legales / contacto — alineados al Estatuto Actualizado
 * Registro de Empresas y Sociedades, CVE CRFgy53XBVxc (08-10-2026).
 */
export const BAAS_LEGAL = {
  razonSocial: process.env.SICR3P_RAZON_SOCIAL || 'SICR3P SpA',
  nombreFantasia: process.env.SICR3P_NOMBRE_FANTASIA || 'sicr3p spa',
  rut: process.env.SICR3P_RUT || '78.529.455-6',
  email: process.env.SICR3P_CONTACT_EMAIL || 'contacto@sicr3p.cl',
  telefono: process.env.SICR3P_CONTACT_PHONE || '+56 2 2123 4567',
  direccion:
    process.env.SICR3P_ADDRESS || 'Antofagasta, Región de Antofagasta, Chile',
  fechaConstitucion: '07 de octubre de 2026',
  capitalSocial: '$20.000.000',
  representanteLegal: 'Edward Gonzalo Venegas Bugueño',
  representanteRut: '17.434.487-6',
  estatutoCve: 'CRFgy53XBVxc',
  estatutoUrl: '/legal/estatuto-sicr3p-spa.pdf',
  // Fundación relacionada (RUT SII folio 16548963, 06-07-2026).
  // No confundir con la SpA: son personas jurídicas distintas.
  fundacion: {
    razonSocial: process.env.SICR3P_FUNDACION_RAZON || 'Fundación Entretodos',
    rut: process.env.SICR3P_FUNDACION_RUT || '65.279.032-1',
    subTipo: 'FUNDACION',
    capital: '$1.000.000',
    direccion:
      process.env.SICR3P_FUNDACION_ADDRESS ||
      'Los Conquistadores 13704, Antofagasta',
    representante: 'Edward Gonzalo Venegas Bugueño',
    representanteRut: '17.434.487-6',
    incorporacionRepresentante: '03-07-2026',
    escritura: 'Nº 2232 · 27-03-2018 · Notaría Nº 4 de La Serena (Oñate Miranda)',
    rutOtorgado: '06-07-2026',
    folio: '16548963',
    pdfUrl: '/legal/fundacion-entretodos-rut.pdf',
  },
  // Solo enlaces reales; vacío = no mostrar iconos
  social: {
    linkedin: process.env.SICR3P_LINKEDIN || '',
    instagram: process.env.SICR3P_INSTAGRAM || '',
  },
};

export const DLOCAL_PAYOUT_COUNTRIES = [
  { code: 'CL', name: 'Chile', currency: 'CLP', symbol: '$' },
  { code: 'PE', name: 'Perú', currency: 'PEN', symbol: 'S/' },
  { code: 'BR', name: 'Brasil', currency: 'BRL', symbol: 'R$' },
  { code: 'AR', name: 'Argentina', currency: 'ARS', symbol: '$' },
  { code: 'MX', name: 'México', currency: 'MXN', symbol: '$' },
  { code: 'EC', name: 'Ecuador', currency: 'USD', symbol: '$' },
  { code: 'PY', name: 'Paraguay', currency: 'PYG', symbol: '₲' },
  { code: 'UY', name: 'Uruguay', currency: 'UYU', symbol: '$' },
];

export const CHILE_BANK_CODES = [
  { code: '1', name: 'Banco de Chile' },
  { code: '12', name: 'Banco del Estado de Chile' },
  { code: '16', name: 'Banco Crédito e Inversiones' },
  { code: '37', name: 'Banco Santander - Santiago' },
  { code: '39', name: 'Itau Corpbanca' },
  { code: '14', name: 'Scotiabank Chile' },
  { code: '28', name: 'Banco Bice' },
  { code: '51', name: 'Banco Falabella' },
  { code: '875', name: 'Mercado Pago' },
  { code: '730', name: 'Tenpo Prepago' },
];
