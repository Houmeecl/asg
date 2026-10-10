import { NextResponse } from 'next/server';
import { exigirUsuarioSesion } from '@/lib/auth';
import { dashboardStats, listOperaciones, listLotes } from '@/lib/baas/operations';
import { listWallets } from '@/lib/baas/wallet';
import { getSimulatorState, getDlocalMode, dlocalConfigured, getDlocalEnv } from '@/lib/baas/dlocal';
import { platformsEnv } from '@/lib/baas/platforms';
import { entornoStatus } from '@/lib/baas/dlocal-env';
import { BAAS_LEGAL } from '@/lib/baas/config';
import { getHubspotStatus, getHubspotSimulatorState } from '@/lib/baas/hubspot';

export async function GET() {
  const usuario = await exigirUsuarioSesion();
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const plat = platformsEnv();
  const go = getDlocalEnv();

  return NextResponse.json({
    stats: dashboardStats(),
    operaciones: listOperaciones({ limit: 40 }),
    lotes: listLotes(),
    wallets: listWallets(),
    dlocal: {
      mode: getDlocalMode(),
      ...getSimulatorState(),
      ...dlocalConfigured(),
      ...go,
    },
    platforms: {
      mode: plat.mode,
      label: plat.label,
      base: plat.base,
      isPrueba: plat.isPrueba,
      webhook: plat.webhook || '/api/baas/webhooks/dlocal-platforms',
      onboarding: '/ops/onboarding',
      configured: plat.configured,
    },
    entornos: entornoStatus(),
    mail: {
      contact: BAAS_LEGAL.email,
      phone: BAAS_LEGAL.telefono,
      dnsDoc: 'docs/dns-vps-correo.md',
      webmail: 'https://ferozo.email',
    },
    hubspot: { ...getHubspotStatus(), ...getHubspotSimulatorState() },
    usuario,
  });
}
