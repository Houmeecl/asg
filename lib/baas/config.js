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
