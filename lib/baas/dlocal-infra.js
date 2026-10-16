/**
 * Infraestructura dLocal (Go + Platforms): discovery, checklist y URLs públicas.
 * Docs: https://docs.dlocalgo.com/integration-api
 * Platforms: https://docs.dlocal.com/docs/onboarding-process-platforms
 */

import { DLOCAL_PAYOUT_COUNTRIES, CHILE_BANK_CODES, BAAS_LEGAL } from './config.js';
import {
  GO_BASE,
  PLATFORMS_BASE,
  entornoStatus,
  resolveGoConfig,
  resolvePlatformsConfig,
} from './dlocal-env.js';

const PUBLIC_ORIGIN = process.env.SICR3P_PUBLIC_ORIGIN || 'https://sicr3p.cl';

export function dlocalPublicUrls() {
  return {
    origin: PUBLIC_ORIGIN,
    webhookGo: `${PUBLIC_ORIGIN}/api/baas/webhooks/dlocal`,
    webhookPlatforms:
      process.env.DLOCAL_PLATFORMS_NOTIFICATION_URL ||
      `${PUBLIC_ORIGIN}/api/baas/webhooks/dlocal-platforms`,
    ops: `${PUBLIC_ORIGIN}/ops/dlocal`,
    onboarding: `${PUBLIC_ORIGIN}/ops/onboarding`,
    docs: `${PUBLIC_ORIGIN}/docs/dlocal`,
    autorizar: `${PUBLIC_ORIGIN}/autorizar`,
  };
}

/** Discovery público (sin secretos ni estado de credenciales). */
export function dlocalDiscovery() {
  const urls = dlocalPublicUrls();
  return {
    product: 'SICR3P dLocal infrastructure',
    version: '1',
    rail: 'TUU InterApp → lote → dLocal Go payout / pay-in',
    products: ['dLocal Go', 'dLocal for Platforms'],
    modes: [
      { id: 'simulator', label: 'Simulador local', remote: false },
      { id: 'sandbox', label: 'Entorno prueba (sandbox)', remote: true, aliases: ['prueba', 'test', 'sbx'] },
      { id: 'live', label: 'Producción', remote: true, aliases: ['prod', 'produccion'] },
    ],
    bases: {
      go: { ...GO_BASE },
      platforms: { ...PLATFORMS_BASE },
    },
    endpoints: {
      discovery: 'GET /api/baas/dlocal/infra',
      entorno: 'GET /api/baas/dlocal/entorno',
      webhookGo: 'POST /api/baas/webhooks/dlocal',
      webhookPlatforms: 'POST /api/baas/webhooks/dlocal-platforms',
      onboardingApi: 'GET|POST /api/baas/onboarding',
      dashboard: 'GET /api/baas/dashboard',
    },
    ui: {
      ops: '/ops/dlocal',
      onboarding: '/ops/onboarding',
      config: '/ops/config',
      docs: '/docs/dlocal',
      autorizar: '/autorizar',
      soporte: '/soporte',
    },
    publicUrls: urls,
    goApi: {
      docs: 'https://docs.dlocalgo.com/integration-api',
      auth: 'Bearer API_KEY:SECRET_KEY',
      payin: 'POST /v1/payments',
      payout: 'POST /v1/payouts',
    },
    platformsApi: {
      docs: 'https://docs.dlocal.com/docs/onboarding-process-platforms',
      createAccount: 'POST /v2/accounts',
      documents: 'POST /v2/accounts/{account_id}/documents',
    },
    chile: {
      country: 'CL',
      currency: 'CLP',
      payment_method_id: 'BANK_TRANSFER',
      document_type: 'RUT',
      flow_types: ['B2C', 'B2B', 'P2P'],
      bank_codes_sample: (CHILE_BANK_CODES || []).slice(0, 8),
    },
    payoutCountries: DLOCAL_PAYOUT_COUNTRIES,
    comercio: {
      razonSocial: BAAS_LEGAL.razonSocial,
      rut: BAAS_LEGAL.rut,
      email: BAAS_LEGAL.email,
    },
    notes: [
      'Webhook Go y Platforms deben ser HTTPS :443 con TLS 1.2+.',
      'Validá siempre sandbox antes de live; ambos slots de credenciales pueden coexistir.',
      'SICR3P SpA es comercio + software: no emisor ni billetera pública.',
    ],
  };
}

function check(id, ok, label, detail) {
  return { id, ok: Boolean(ok), label, detail: detail || '' };
}

/** Checklist operativo (sin secretos). */
export function dlocalChecklist() {
  const go = resolveGoConfig();
  const plat = resolvePlatformsConfig();
  const env = entornoStatus();
  const urls = dlocalPublicUrls();

  return [
    check(
      'go-mode',
      true,
      `Go activo: ${go.label}`,
      `DLOCAL_MODE=${go.mode}${go.base ? ` · ${go.base}` : ''}`,
    ),
    check(
      'go-creds',
      go.mode === 'simulator' || go.configured,
      go.mode === 'simulator' ? 'Go simulator (sin red)' : 'Credenciales Go del modo activo',
      go.mode === 'simulator'
        ? 'Demo local'
        : go.configured
          ? 'API key + secret presentes'
          : 'Faltan DLOCAL_SANDBOX_* o DLOCAL_LIVE_*',
    ),
    check(
      'go-sandbox-slot',
      env.prueba.go.configured,
      'Slot prueba Go (sandbox)',
      env.prueba.go.configured ? 'DLOCAL_SANDBOX_* listos' : 'Cargá DLOCAL_SANDBOX_API_KEY/SECRET_KEY',
    ),
    check(
      'platforms-mode',
      true,
      `Platforms activo: ${plat.label}`,
      `DLOCAL_PLATFORMS_MODE=${plat.mode}${plat.base ? ` · ${plat.base}` : ''}`,
    ),
    check(
      'platforms-creds',
      plat.mode === 'simulator' || plat.configured,
      plat.mode === 'simulator' ? 'Platforms simulator' : 'Credenciales Platforms del modo activo',
      plat.mode === 'simulator'
        ? 'Onboarding simulado'
        : plat.configured
          ? 'login + trans_key + secret'
          : 'Faltan DLOCAL_PLATFORMS_SANDBOX_* o LIVE_*',
    ),
    check(
      'webhook-go',
      true,
      'Webhook Go público',
      urls.webhookGo,
    ),
    check(
      'webhook-platforms',
      Boolean(urls.webhookPlatforms.startsWith('https://')),
      'Webhook Platforms (HTTPS)',
      urls.webhookPlatforms,
    ),
    check(
      'sandbox-before-live',
      go.mode !== 'live' || env.prueba.go.configured,
      'Sandbox validado antes de live',
      go.mode === 'live' && !env.prueba.go.configured
        ? 'Live activo sin slot sandbox cargado'
        : 'OK o aún en prueba/simulator',
    ),
  ];
}

/** Estado completo para ops (sesión). */
export function dlocalInfraStatus() {
  return {
    ok: true,
    discovery: dlocalDiscovery(),
    entornos: entornoStatus(),
    checklist: dlocalChecklist(),
    activo: {
      go: resolveGoConfig().mode,
      platforms: resolvePlatformsConfig().mode,
    },
  };
}
