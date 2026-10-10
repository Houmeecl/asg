/**
 * Cliente dLocal Go: pay-in (checkout) + payouts.
 * Docs: https://docs.dlocalgo.com/integration-api
 * Modos: simulator | sandbox | live
 */

import crypto from 'crypto';

function cfg() {
  const mode = process.env.DLOCAL_MODE || 'simulator';
  const base =
    process.env.DLOCAL_BASE_URL ||
    (mode === 'live' ? 'https://api.dlocalgo.com' : 'https://api-sbx.dlocalgo.com');
  return {
    mode,
    base,
    apiKey: process.env.DLOCAL_API_KEY || '',
    secret: process.env.DLOCAL_SECRET_KEY || '',
    webhookSecret: process.env.DLOCAL_WEBHOOK_SECRET || process.env.DLOCAL_SECRET_KEY || '',
  };
}

/** Valida firma de webhook Go cuando hay secret (sandbox/live). Simulator sin secret = ok. */
export function verifyGoWebhook(rawBody, headers = {}) {
  const { mode, webhookSecret } = cfg();
  if (mode === 'simulator' && !webhookSecret) return true;
  if (!webhookSecret) return mode === 'simulator';
  const sig =
    headers['x-signature'] ||
    headers['X-Signature'] ||
    (typeof headers.get === 'function' ? headers.get('x-signature') : null) ||
    '';
  const auth =
    headers.authorization ||
    headers.Authorization ||
    (typeof headers.get === 'function' ? headers.get('authorization') : null) ||
    '';
  const fromAuth = (String(auth).match(/Signature:\s*([a-fA-F0-9]+)/) || [])[1] || '';
  const got = String(sig || fromAuth).toLowerCase();
  if (!got) return false;
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody || '').digest('hex');
  if (got.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

export function dlocalConfigured() {
  const { mode, apiKey, secret } = cfg();
  if (mode === 'simulator') return { mode, configured: true, remote: false };
  return { mode, configured: Boolean(apiKey && secret), remote: true };
}

function authHeader() {
  const { apiKey, secret } = cfg();
  return `Bearer ${apiKey}:${secret}`;
}

const simState = {
  balance: 0,
  payouts: [],
  payments: [],
};

export function getDlocalMode() {
  return cfg().mode;
}

export async function createPayment({ amount, currency = 'CLP', country = 'CL', orderId, description, successUrl, backUrl, notificationUrl }) {
  const { mode, base } = cfg();
  if (mode === 'simulator') {
    const id = `DP-SIM-${Date.now()}`;
    const payment = {
      id,
      amount,
      currency,
      country,
      order_id: String(orderId),
      status: 'PENDING',
      redirect_url: `${backUrl || '/portal'}?dlocal_sim=${id}`,
      description,
    };
    simState.payments.push(payment);
    return payment;
  }

  const res = await fetch(`${base}/v1/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      amount,
      currency,
      country,
      order_id: String(orderId),
      description,
      success_url: successUrl,
      back_url: backUrl,
      notification_url: notificationUrl,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`dLocal payment failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function createPayout(payload) {
  const { mode, base } = cfg();
  if (mode === 'simulator') {
    const payout = {
      payout_id: `PO-SIM-${Date.now()}`,
      flow_type: payload.flow_type,
      country: payload.transfer_country,
      currency_to_pay: payload.currency_to_pay,
      amount: payload.transfer_amount,
      purpose: payload.purpose,
      status: 'PENDING',
      description: payload.description,
    };
    simState.payouts.push(payout);
    // Simula avance
    setTimeout(() => {
      payout.status = 'SUCCESS';
    }, 800);
    return payout;
  }

  const res = await fetch(`${base}/v1/payouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`dLocal payout failed: ${res.status} ${text}`);
  }
  return res.json();
}

/** Simula fondeo merchant (abono TUU / pay-in) para liberar lotes en demo. */
export function simulateMerchantFunding(amountClp) {
  simState.balance += amountClp;
  return { balance: simState.balance };
}

export function getSimulatorState() {
  return {
    mode: cfg().mode,
    balance: simState.balance,
    payouts: [...simState.payouts].slice(-30).reverse(),
    payments: [...simState.payments].slice(-30).reverse(),
  };
}

export function advanceSimPayout(payoutId, status = 'SUCCESS') {
  const p = simState.payouts.find((x) => x.payout_id === payoutId);
  if (p) p.status = status;
  return p;
}
