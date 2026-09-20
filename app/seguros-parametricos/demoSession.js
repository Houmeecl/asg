'use client';

import { useSyncExternalStore } from 'react';

// Sesión DEMO, solo en el navegador (localStorage). No hay autenticación real ni servidor.
const KEY = 'sicr3p_seguros_demo';
const EVENT = 'sicr3p-demo-session';

function leer() {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function suscribir(cb) {
  window.addEventListener('storage', cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener('storage', cb);
    window.removeEventListener(EVENT, cb);
  };
}

// Devuelve { cargando, sesion }. `cargando` es true durante la hidratación, para no redirigir antes de leer.
export function useDemoSession() {
  const raw = useSyncExternalStore(suscribir, leer, () => undefined);
  if (raw === undefined) return { cargando: true, sesion: null };
  let sesion = null;
  try {
    sesion = raw ? JSON.parse(raw) : null;
  } catch {}
  return { cargando: false, sesion };
}

export function guardarSesion(sesion) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(sesion));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function cerrarSesion() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}
