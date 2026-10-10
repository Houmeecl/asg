/**
 * Adaptador TUU InterApp (mock + contrato SDK).
 * Docs: https://developers.tuu.cl/docs/integraci%C3%B3n-de-aplicaciones-de-pago-inter-app-new
 * Packages: com.haulmer.paymentapp.dev | com.haulmer.paymentapp
 */

export function buildTuuPaymentPayload({ amount, operationId, commerceRut, sourceVersion = '0.1.0' }) {
  return {
    amount: Number(amount),
    tip: 0,
    cashback: 0,
    method: 0,
    installmentsQuantity: 0,
    printVoucherOnApp: true,
    dteType: 48,
    extraData: {
      taxIdnValidation: commerceRut || '',
      exemptAmount: 0,
      netAmount: Number(amount),
      sourceName: 'sicr3p',
      sourceVersion,
      customFields: [
        { name: 'operationId', value: String(operationId), print: true },
      ],
    },
  };
}

export const TUU_PACKAGES = {
  dev: 'com.haulmer.paymentapp.dev',
  prod: 'com.haulmer.paymentapp',
};

/**
 * Mock de cobro (Cloud Agent / demo sin terminal).
 * Montos terminados en 13 → rechazo; en 66 → cancelado.
 */
export async function mockTuuCharge({ amount, reference }) {
  await new Promise((r) => setTimeout(r, 400));
  const n = Number(amount);
  if (n % 100 === 13) {
    return { approved: false, errorMessage: 'Tarjeta rechazada por el emisor (simulado)', transactionStatus: 'REJECTED' };
  }
  if (n % 100 === 66) {
    return { approved: false, errorMessage: 'Cobro cancelado en el terminal (simulado)', transactionStatus: 'CANCELED' };
  }
  const sequenceNumber = String(Date.now()).slice(-12).padStart(12, '0');
  return {
    approved: true,
    transactionStatus: 'APPROVED',
    sequenceNumber,
    authorizationCode: String(Math.floor(100000 + Math.random() * 899999)),
    cardLast4: String(Math.floor(1000 + Math.random() * 8999)),
    cardBrand: Math.random() > 0.5 ? 'VISA' : 'MASTERCARD',
    amountCharged: n,
    reference,
  };
}

export function parseTuuResult(raw) {
  const r = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return {
    approved: r.transactionStatus === 'APPROVED',
    transactionStatus: r.transactionStatus,
    sequenceNumber: r.sequenceNumber,
    authorizationCode: r.authorizationCode,
    cardLast4: r.last4 || r.cardLast4,
    cardBrand: r.brand || r.cardBrand,
    amountCharged: r.amount || r.amountCharged,
    errorMessage: r.transactionStatus === 'APPROVED' ? undefined : r.message || r.errorMessage || 'Cobro no aprobado',
  };
}
