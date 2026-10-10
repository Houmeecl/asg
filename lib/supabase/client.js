/**
 * Cliente mínimo del API de Supabase (Auth + REST) con la anon key.
 * Misma forma de uso que supabase-js: createClient(url, key).
 * La conexión directa postgres://…@127.0.0.1:5432 solo existe dentro del VPS.
 */

function envPair() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return { url, key };
}

export function supabaseConfig() {
  const { url, key } = envPair();
  let host = '';
  try {
    host = url ? new URL(url).host : '';
  } catch {
    host = '';
  }
  return { url, host, configured: Boolean(url && key) };
}

export function createClient(url, key) {
  const base = String(url || '').replace(/\/$/, '');
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };

  async function request(path, init = {}) {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: { ...headers, ...(init.headers || {}) },
      signal: init.signal || AbortSignal.timeout(8000),
    });
    const text = await res.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    return { ok: res.ok, status: res.status, body };
  }

  return {
    auth: {
      health: () => request('/auth/v1/health'),
    },
    from(table) {
      const name = encodeURIComponent(table);
      return {
        select(columns = '*') {
          return request(`/rest/v1/${name}?select=${encodeURIComponent(columns)}`);
        },
      };
    },
  };
}

export function createSupabase() {
  const { url, key } = envPair();
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function probeSupabase() {
  const config = supabaseConfig();
  if (!config.configured) {
    return {
      configured: false,
      reachable: false,
      host: config.host,
      detail: 'Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY',
    };
  }
  try {
    const client = createSupabase();
    const health = await client.auth.health();
    return {
      configured: true,
      reachable: health.ok,
      status: health.status,
      host: config.host,
      detail: typeof health.body === 'string' ? health.body.slice(0, 180) : JSON.stringify(health.body).slice(0, 180),
    };
  } catch (err) {
    const code = err.cause?.code || err.code || '';
    const blocked = code === 'ECONNRESET' || code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'UND_ERR_CONNECT_TIMEOUT';
    return {
      configured: true,
      reachable: false,
      host: config.host,
      detail: blocked
        ? 'Este servidor no completa TLS hacia el Studio. Desde tu red el sitio sí abre.'
        : (code ? `${code}: ${err.message}` : err.message),
    };
  }
}
