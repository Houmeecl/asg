/**
 * Cliente dLocal Go: pay-in (checkout) + payouts.
 * Docs: https://docs.dlocalgo.com/integration-api
 * Modos: simulator | sandbox (prueba) | live
 */

import crypto from 'crypto';
import { resolveGoConfig, normalizeMode } from './dlocal-env.js';

function cfg() {
  return resolveGoConfig();
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
  const { mode, configured, remote, label, base, isPrueba } = cfg();
  return { mode, configured, remote, label, base, isPrueba };
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

export function getDlocalEnv() {
  const c = cfg();
  return {
    mode: c.mode,
    label: c.label,
    base: c.base,
    configured: c.configured,
    remote: c.remote,
    isPrueba: c.isPrueba,
    isLive: c.isLive,
  };
}

export async function createPayment({ amount, currency = 'CLP', country = 'CL', orderId, description, successUrl, backUrl, notificationUrl }) {
  const { mode, base, configured } = cfg();
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
      environment: 'simulator',
    };
    simState.payments.push(payment);
    return payment;
  }

  if (!configured) {
    throw new Error(
      mode === 'sandbox'
        ? 'Faltan DLOCAL_SANDBOX_API_KEY / DLOCAL_SANDBOX_SECRET_KEY (entorno prueba)'
        : 'Faltan DLOCAL_LIVE_API_KEY / DLOCAL_LIVE_SECRET_KEY (producción)',
    );
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
    throw new Error(`dLocal payment failed (${mode}): ${res.status} ${text}`);
  }
  const json = await res.json();
  return { ...json, environment: mode };
}

export async function createPayout(payload) {
  const { mode, base, configured } = cfg();
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
      environment: 'simulator',
    };
    simState.payouts.push(payout);
    setTimeout(() => {
      payout.status = 'SUCCESS';
    }, 800);
    return payout;
  }

  if (!configured) {
    throw new Error(
      mode === 'sandbox'
        ? 'Faltan credenciales sandbox dLocal Go (entorno prueba)'
        : 'Faltan credenciales live dLocal Go',
    );
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
    throw new Error(`dLocal payout failed (${mode}): ${res.status} ${text}`);
  }
  const json = await res.json();
  return { ...json, environment: mode };
}

/** Simula fondeo merchant (abono TUU / pay-in) para liberar lotes en demo. */
export function simulateMerchantFunding(amountClp) {
  simState.balance += amountClp;
  return { balance: simState.balance };
}

export function getSimulatorState() {
  const c = cfg();
  return {
    mode: c.mode,
    label: c.label,
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

export { normalizeMode };
