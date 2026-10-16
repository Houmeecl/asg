#!/usr/bin/env node
/**
 * Smoke infraestructura dLocal: discovery público + shape de checklist.
 * Uso: BASE_URL=http://127.0.0.1:3001 node scripts/dlocal-infra-smoke.mjs
 */
const base = (process.env.BASE_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');

function fail(msg) {
  console.error('FAIL', msg);
  process.exit(1);
}

const res = await fetch(`${base}/api/baas/dlocal/infra`);
if (!res.ok) fail(`infra HTTP ${res.status}`);
const j = await res.json();
if (!j.ok && j.product == null && !j.endpoints) fail('body sin discovery');

const discovery = j.discovery || j;
if (!discovery.endpoints?.discovery) fail('faltan endpoints.discovery');
if (!discovery.bases?.go?.sandbox) fail('faltan bases.go.sandbox');
if (!discovery.publicUrls?.webhookGo?.includes('/webhooks/dlocal')) fail('webhookGo');
if (discovery.chile?.country !== 'CL') fail('chile.country');

console.log('OK discovery', {
  product: discovery.product,
  goSandbox: discovery.bases.go.sandbox,
  webhookGo: discovery.publicUrls.webhookGo,
  endpoints: Object.keys(discovery.endpoints),
});

if (Array.isArray(j.checklist)) {
  console.log(
    'OK checklist (sesión)',
    j.checklist.map((c) => `${c.id}:${c.ok ? 'ok' : 'pend'}`).join(' '),
  );
} else {
  console.log('OK público (sin checklist; esperado sin cookie ops)');
}

process.exit(0);
