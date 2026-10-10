/**
 * E2E Open Banking (contra Next en :3001 o BASE_URL).
 * Uso: node scripts/open-banking-e2e.mjs
 */
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3001';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function json(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body)}`);
  return body;
}

async function main() {
  // Trigger seed via admin API needs session — seed also runs on token endpoint
  console.log('1) List clients via token seed + create consent');

  // Discover demo credentials from ops API without session by creating via lib... 
  // Instead: hit consents with bootstrap — first call token after reading demo from a bootstrap endpoint.
  // Seed happens inside token; we need credentials. Use internal bootstrap:
  const boot = await fetch(`${BASE}/api/open-banking/v1/auth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ client_id: 'invalid', client_secret: 'invalid' }),
  });
  // seed side-effect already ran
  assert(boot.status === 401, 'token inválido debe ser 401');

  // Pull demo secret from Node db directly
  const { default: db } = await import('../lib/db.js');
  const { seedDemoOpenBankingClient, getDemoClientSecret } = await import('../lib/baas/open-banking.js');
  const seeded = seedDemoOpenBankingClient();
  const clientId = seeded.client_id || db.prepare(`SELECT client_id FROM ob_clients WHERE nombre = ?`).get('Demo Open Banking')?.client_id;
  const secret = seeded.client_secret || getDemoClientSecret(clientId);
  assert(clientId && secret, 'demo client');

  console.log('2) Token sin consent');
  const tok1 = await json(
    await fetch(`${BASE}/api/open-banking/v1/auth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: secret }),
    }),
  );
  assert(tok1.access_token, 'access_token');

  console.log('3) Crear + autorizar consent');
  const consent = await json(
    await fetch(`${BASE}/api/open-banking/v1/consents`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${tok1.access_token}`,
      },
      body: JSON.stringify({ empresa_email: 'empresa@sicr3p.cl' }),
    }),
  );
  const consentId = consent.Data.ConsentId;
  assert(consentId, 'consent id');

  const authz = await json(
    await fetch(`${BASE}/api/open-banking/v1/consents/${consentId}/authorise`, {
      method: 'POST',
      headers: { authorization: `Bearer ${tok1.access_token}` },
    }),
  );
  assert(authz.Data.Status === 'AUTHORISED', 'AUTHORISED');

  console.log('4) Token con consent + AIS');
  const tok2 = await json(
    await fetch(`${BASE}/api/open-banking/v1/auth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: secret,
        consent_id: consentId,
      }),
    }),
  );

  const accounts = await json(
    await fetch(`${BASE}/api/open-banking/v1/accounts`, {
      headers: { authorization: `Bearer ${tok2.access_token}` },
    }),
  );
  assert(accounts.Data?.Account?.length >= 1, 'accounts');

  const accountId = accounts.Data.Account[0].accountId;
  const txs = await json(
    await fetch(`${BASE}/api/open-banking/v1/accounts/${encodeURIComponent(accountId)}/transactions`, {
      headers: { authorization: `Bearer ${tok2.access_token}` },
    }),
  );
  assert(Array.isArray(txs.Data?.Transaction), 'transactions');

  console.log('5) PIS payment');
  const pay = await json(
    await fetch(`${BASE}/api/open-banking/v1/payments`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${tok2.access_token}`,
      },
      body: JSON.stringify({
        amount: 1500,
        currency: 'CLP',
        creditorName: 'Beneficiario OB',
        creditorAccount: '123456789',
        bankCode: '1',
        reference: 'E2E-OB',
        debtorRut: '11.111.111-1',
      }),
    }),
  );
  assert(pay.Data?.PaymentId, 'payment id');
  assert(
    ['AcceptedSettlementCompleted', 'AcceptedSettlementInProcess', 'Pending', 'Rejected'].includes(
      pay.Data.Status,
    ),
    `status ${pay.Data.Status}`,
  );

  const got = await json(
    await fetch(`${BASE}/api/open-banking/v1/payments/${pay.Data.PaymentId}`, {
      headers: { authorization: `Bearer ${tok2.access_token}` },
    }),
  );
  assert(got.Data.PaymentId === pay.Data.PaymentId, 'get payment');

  console.log('OK open-banking e2e', {
    clientId,
    consentId,
    accounts: accounts.Data.Account.length,
    payment: pay.Data.PaymentId,
    status: pay.Data.Status,
  });
}

main().catch((err) => {
  console.error('FAIL', err.message);
  process.exit(1);
});
