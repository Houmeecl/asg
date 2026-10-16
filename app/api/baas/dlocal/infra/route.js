import { NextResponse } from 'next/server';
import { exigirUsuarioSesion } from '@/lib/auth';
import { dlocalDiscovery, dlocalInfraStatus } from '@/lib/baas/dlocal-infra';

/**
 * Infraestructura dLocal — discovery público + detalle ops.
 * GET sin sesión: mapa de endpoints/bases/Chile.
 * GET con sesión: + entornos + checklist (sin secretos).
 */
export async function GET() {
  const usuario = await exigirUsuarioSesion();
  if (!usuario) {
    return NextResponse.json({
      ok: true,
      ...dlocalDiscovery(),
    });
  }

  const detail =
    usuario.rol === 'ADMIN' || usuario.rol === 'OPERADOR'
      ? dlocalInfraStatus()
      : { ok: true, ...dlocalDiscovery(), note: 'Detalle ops solo para OPERADOR/ADMIN' };

  return NextResponse.json({
    ...detail,
    usuario: { email: usuario.email, rol: usuario.rol },
  });
}
