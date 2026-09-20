// lib/nicoApi.js
// Cliente SERVER-SIDE de la API de Nico Seguros (https://api.nicoseguros.com/api-docs/index.html).
// Las credenciales viven en variables de entorno y nunca llegan al navegador.
//
//   NICO_API_EMAIL, NICO_API_PASSWORD  credenciales del usuario corredor/admin en Nico
//   NICO_API_URL                       opcional, por defecto https://api.nicoseguros.com

const TIMEOUT_MS = 15_000;
// La documentación no indica la vigencia del token: se reutiliza un tiempo acotado
// y, además, se renueva automáticamente ante cualquier 401.
const TOKEN_TTL_MS = 20 * 60 * 1000;

const g = globalThis;
const cache = (g.__nicoTokenCache ??= { token: null, hasta: 0, pendiente: null });

export class NicoError extends Error {
    constructor(mensaje, { status = 502, codigo = 'NICO_ERROR' } = {}) {
        super(mensaje);
        this.status = status;
        this.codigo = codigo;
    }
}

const baseUrl = () => (process.env.NICO_API_URL || 'https://api.nicoseguros.com').replace(/\/+$/, '');

export const nicoConfigurado = () => Boolean(process.env.NICO_API_EMAIL && process.env.NICO_API_PASSWORD);
export const nicoBase = baseUrl;

async function pedirToken() {
    if (!nicoConfigurado()) {
        throw new NicoError('Faltan NICO_API_EMAIL y NICO_API_PASSWORD en el entorno del servidor.', { status: 503, codigo: 'NO_CONFIGURADO' });
    }
    let res;
    try {
        res = await fetch(`${baseUrl()}/api/v1/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ user: { email: process.env.NICO_API_EMAIL, password: process.env.NICO_API_PASSWORD } }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
            cache: 'no-store',
        });
    } catch {
        throw new NicoError('No se pudo contactar a la API de Nico.', { status: 504, codigo: 'SIN_CONEXION' });
    }
    if (res.status === 401) {
        throw new NicoError('Nico rechazó las credenciales configuradas.', { status: 502, codigo: 'CREDENCIALES' });
    }
    if (!res.ok) {
        throw new NicoError(`Nico respondió ${res.status} al iniciar sesión.`, { status: 502, codigo: 'LOGIN_FALLO' });
    }
    const cabecera = res.headers.get('authorization');
    if (!cabecera) {
        throw new NicoError('Nico no devolvió token de autenticación.', { status: 502, codigo: 'SIN_TOKEN' });
    }
    return /^Bearer /i.test(cabecera) ? cabecera : `Bearer ${cabecera}`;
}

async function obtenerToken(forzar = false) {
    if (!forzar && cache.token && cache.hasta > Date.now()) return cache.token;
    // Una sola autenticación en vuelo aunque lleguen varias solicitudes a la vez.
    cache.pendiente ??= pedirToken()
        .then((t) => { cache.token = t; cache.hasta = Date.now() + TOKEN_TTL_MS; return t; })
        .finally(() => { cache.pendiente = null; });
    return cache.pendiente;
}

export function olvidarToken() {
    cache.token = null;
    cache.hasta = 0;
}

// Devuelve { status, data } con el JSON de Nico. Lanza NicoError si no hay conexión o credenciales.
export async function nicoFetch(ruta, { method = 'GET', query, body } = {}) {
    const url = new URL(`${baseUrl()}${ruta}`);
    for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, String(v));

    const enviar = (token) => fetch(url, {
        method,
        headers: {
            Authorization: token,
            Accept: 'application/json',
            ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: 'no-store',
    });

    try {
        let res = await enviar(await obtenerToken());
        if (res.status === 401) res = await enviar(await obtenerToken(true));
        const texto = await res.text();
        let data = null;
        try { data = texto ? JSON.parse(texto) : null; } catch { data = { raw: texto.slice(0, 500) }; }
        return { status: res.status, data };
    } catch (e) {
        if (e instanceof NicoError) throw e;
        throw new NicoError('No se pudo contactar a la API de Nico.', { status: 504, codigo: 'SIN_CONEXION' });
    }
}

// Prueba de conexión: solo intenta autenticarse (sin exponer el token).
export async function nicoProbarConexion() {
    olvidarToken();
    await obtenerToken(true);
    return true;
}
