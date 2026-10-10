import { NextResponse } from 'next/server';
import { exigirUsuarioSesion } from '@/lib/auth';
import { entornoStatus } from '@/lib/baas/dlocal-env';
import { getDlocalEnv } from '@/lib/baas/dlocal';
import { platformsEnv } from '@/lib/baas/platforms';

/**
 * Estado del entorno dLocal (prueba vs producción) sin filtrar secretos.
 * GET público reducido: solo label + mode activo.
 * Con sesión ops/admin: detalle de ambos slots (sandbox + live).
 */
export async function GET() {
  const usuario = await exigirUsuarioSesion();
  const go = getDlocalEnv();
  const platforms = platformsEnv();

  if (!usuario) {
    return NextResponse.json({
      ok: true,
      activo: {
        go: { mode: go.mode, label: go.label, isPrueba: go.isPrueba },
        platforms: { mode: platforms.mode, label: platforms.label, isPrueba: platforms.isPrueba },
      },
    });
  }

  return NextResponse.json({
    ok: true,
    ...entornoStatus(),
    usuario: { email: usuario.email, rol: usuario.rol },
  });
}
