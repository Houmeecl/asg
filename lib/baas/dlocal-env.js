/**
 * Entornos dLocal Go + Platforms.
 * - simulator: demo local sin red (no es dLocal real)
 * - sandbox / prueba / test: API sandbox dLocal (entorno de prueba)
 * - live: producción
 *
 * Credenciales por entorno (recomendado):
 *   DLOCAL_SANDBOX_* / DLOCAL_LIVE_*
 *   DLOCAL_PLATFORMS_SANDBOX_* / DLOCAL_PLATFORMS_LIVE_*
 * Legacy (modo activo): DLOCAL_API_KEY / DLOCAL_SECRET_KEY / DLOCAL_PLATFORMS_*
 */

export const GO_BASE = {
  sandbox: 'https://api-sbx.dlocalgo.com',
  live: 'https://api.dlocalgo.com',
};

export const PLATFORMS_BASE = {
  sandbox: 'https://marketplace-api.dlocal-sbox.com',
  live: 'https://marketplace-api.dlocal.com',
};

const MODE_ALIASES = {
  sim: 'simulator',
  simulator: 'simulator',
  local: 'simulator',
  demo: 'simulator',
  sbx: 'sandbox',
  sandbox: 'sandbox',
  prueba: 'sandbox',
  test: 'sandbox',
  testing: 'sandbox',
  staging: 'sandbox',
  live: 'live',
  prod: 'live',
  production: 'live',
  produccion: 'live',
  producción: 'live',
};

export function normalizeMode(raw, fallback = 'simulator') {
  const key = String(raw || fallback).trim().toLowerCase();
  return MODE_ALIASES[key] || fallback;
}

export function modeLabel(mode) {
  if (mode === 'live') return 'Producción (live)';
  if (mode === 'sandbox') return 'Entorno prueba (sandbox)';
  return 'Simulador local';
}

function pick(primary, fallback = '') {
  const v = process.env[primary];
  if (v != null && String(v).trim() !== '') return String(v).trim();
  if (fallback && process.env[fallback] != null && String(process.env[fallback]).trim() !== '') {
    return String(process.env[fallback]).trim();
  }
  return '';
}

/** Credenciales Go para un entorno concreto (sin mirar DLOCAL_MODE). */
export function goCredentialsFor(mode) {
  const m = normalizeMode(mode);
  if (m === 'simulator') {
    return { mode: m, apiKey: '', secret: '', webhookSecret: '', remote: false, configured: true };
  }
  if (m === 'sandbox') {
    const apiKey = pick('DLOCAL_SANDBOX_API_KEY', 'DLOCAL_API_KEY');
    const secret = pick('DLOCAL_SANDBOX_SECRET_KEY', 'DLOCAL_SECRET_KEY');
    const webhookSecret =
      pick('DLOCAL_SANDBOX_WEBHOOK_SECRET', 'DLOCAL_WEBHOOK_SECRET') || secret;
    return {
      mode: m,
      apiKey,
      secret,
      webhookSecret,
      remote: true,
      configured: Boolean(apiKey && secret),
    };
  }
  const apiKey = pick('DLOCAL_LIVE_API_KEY', 'DLOCAL_API_KEY');
  const secret = pick('DLOCAL_LIVE_SECRET_KEY', 'DLOCAL_SECRET_KEY');
  const webhookSecret = pick('DLOCAL_LIVE_WEBHOOK_SECRET', 'DLOCAL_WEBHOOK_SECRET') || secret;
  return {
    mode: m,
    apiKey,
    secret,
    webhookSecret,
    remote: true,
    configured: Boolean(apiKey && secret),
  };
}

export function platformsCredentialsFor(mode) {
  const m = normalizeMode(mode, 'simulator');
  if (m === 'simulator') {
    return {
      mode: m,
      login: '',
      transKey: '',
      secret: '',
      remote: false,
      configured: true,
    };
  }
  if (m === 'sandbox') {
    const login = pick('DLOCAL_PLATFORMS_SANDBOX_LOGIN', 'DLOCAL_PLATFORMS_LOGIN');
    const transKey = pick('DLOCAL_PLATFORMS_SANDBOX_TRANS_KEY', 'DLOCAL_PLATFORMS_TRANS_KEY');
    const secret = pick('DLOCAL_PLATFORMS_SANDBOX_SECRET', 'DLOCAL_PLATFORMS_SECRET');
    return {
      mode: m,
      login,
      transKey,
      secret,
      remote: true,
      configured: Boolean(login && transKey && secret),
    };
  }
  const login = pick('DLOCAL_PLATFORMS_LIVE_LOGIN', 'DLOCAL_PLATFORMS_LOGIN');
  const transKey = pick('DLOCAL_PLATFORMS_LIVE_TRANS_KEY', 'DLOCAL_PLATFORMS_TRANS_KEY');
  const secret = pick('DLOCAL_PLATFORMS_LIVE_SECRET', 'DLOCAL_PLATFORMS_SECRET');
  return {
    mode: m,
    login,
    transKey,
    secret,
    remote: true,
    configured: Boolean(login && transKey && secret),
  };
}

export function resolveGoConfig() {
  const mode = normalizeMode(process.env.DLOCAL_MODE || 'simulator');
  const creds = goCredentialsFor(mode);
  const base =
    process.env.DLOCAL_BASE_URL
    || (mode === 'live' ? GO_BASE.live : GO_BASE.sandbox);
  return {
    ...creds,
    mode,
    base: mode === 'simulator' ? null : base,
    label: modeLabel(mode),
    isPrueba: mode === 'sandbox',
    isLive: mode === 'live',
  };
}

export function resolvePlatformsConfig() {
  const mode = normalizeMode(process.env.DLOCAL_PLATFORMS_MODE || 'simulator');
  const creds = platformsCredentialsFor(mode);
  const base =
    process.env.DLOCAL_PLATFORMS_BASE_URL
    || (mode === 'live' ? PLATFORMS_BASE.live : PLATFORMS_BASE.sandbox);
  return {
    ...creds,
    mode,
    base: mode === 'simulator' ? null : base,
    label: modeLabel(mode),
    isPrueba: mode === 'sandbox',
    isLive: mode === 'live',
    notificationUrl:
      process.env.DLOCAL_PLATFORMS_NOTIFICATION_URL
      || 'https://sicr3p.cl/api/baas/webhooks/dlocal-platforms',
  };
}

/** Estado seguro (sin secretos) de ambos entornos + activo. */
export function entornoStatus() {
  const activeGo = resolveGoConfig();
  const activePlat = resolvePlatformsConfig();
  const sandboxGo = goCredentialsFor('sandbox');
  const liveGo = goCredentialsFor('live');
  const sandboxPlat = platformsCredentialsFor('sandbox');
  const livePlat = platformsCredentialsFor('live');

  return {
    activo: {
      go: {
        mode: activeGo.mode,
        label: activeGo.label,
        base: activeGo.base,
        configured: activeGo.configured,
        remote: activeGo.remote,
        isPrueba: activeGo.isPrueba,
      },
      platforms: {
        mode: activePlat.mode,
        label: activePlat.label,
        base: activePlat.base,
        configured: activePlat.configured,
        remote: activePlat.remote,
        isPrueba: activePlat.isPrueba,
        webhook: activePlat.notificationUrl,
      },
    },
    prueba: {
      go: {
        mode: 'sandbox',
        label: modeLabel('sandbox'),
        base: GO_BASE.sandbox,
        configured: sandboxGo.configured,
        hasApiKey: Boolean(sandboxGo.apiKey),
        hasSecret: Boolean(sandboxGo.secret),
      },
      platforms: {
        mode: 'sandbox',
        label: modeLabel('sandbox'),
        base: PLATFORMS_BASE.sandbox,
        configured: sandboxPlat.configured,
        hasLogin: Boolean(sandboxPlat.login),
        hasTransKey: Boolean(sandboxPlat.transKey),
        hasSecret: Boolean(sandboxPlat.secret),
      },
    },
    produccion: {
      go: {
        mode: 'live',
        label: modeLabel('live'),
        base: GO_BASE.live,
        configured: liveGo.configured,
        hasApiKey: Boolean(liveGo.apiKey),
        hasSecret: Boolean(liveGo.secret),
      },
      platforms: {
        mode: 'live',
        label: modeLabel('live'),
        base: PLATFORMS_BASE.live,
        configured: livePlat.configured,
        hasLogin: Boolean(livePlat.login),
        hasTransKey: Boolean(livePlat.transKey),
        hasSecret: Boolean(livePlat.secret),
      },
    },
    recomendacion:
      sandboxGo.configured || sandboxPlat.configured
        ? 'Usá DLOCAL_MODE=sandbox (o prueba) con DLOCAL_SANDBOX_* antes de live.'
        : 'Cargá DLOCAL_SANDBOX_API_KEY / DLOCAL_SANDBOX_SECRET_KEY para el entorno de prueba.',
  };
}
