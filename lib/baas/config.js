/** Datos legales / contacto — alinear con cuenta dLocal Go antes de pedir revisión. */
export const BAAS_LEGAL = {
  razonSocial: process.env.SICR3P_RAZON_SOCIAL || 'SICR3P SpA (dato a confirmar)',
  rut: process.env.SICR3P_RUT || '76.XXXX.XXX-X (dato a confirmar)',
  email: process.env.SICR3P_CONTACT_EMAIL || 'contacto@sicr3p.cl',
  telefono: process.env.SICR3P_CONTACT_PHONE || '+56 2 2123 4567',
  direccion: process.env.SICR3P_ADDRESS || 'Antofagasta, Chile',
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
