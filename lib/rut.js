// lib/rut.js — utilidades de RUT chileno.

// Módulo 11. Acepta con o sin puntos y guion.
export function rutValido(rut) {
    const limpio = String(rut ?? '').replace(/[.\s-]/g, '').toUpperCase();
    if (!/^\d{7,8}[\dK]$/.test(limpio)) return false;
    const cuerpo = limpio.slice(0, -1), dv = limpio.slice(-1);
    let suma = 0, mult = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += +cuerpo[i] * mult;
        mult = mult === 7 ? 2 : mult + 1;
    }
    const resto = 11 - (suma % 11);
    return dv === (resto === 11 ? '0' : resto === 10 ? 'K' : String(resto));
}

// Sin puntos ni guion, en mayúsculas: sirve para comparar RUT escritos de distinta forma.
export const rutNormalizado = (rut) => String(rut ?? '').replace(/[.\s-]/g, '').toUpperCase();

// 12345678K -> 12.345.678-K
export function rutFormateado(rut) {
    const n = rutNormalizado(rut);
    if (n.length < 2) return n;
    return `${n.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${n.slice(-1)}`;
}
