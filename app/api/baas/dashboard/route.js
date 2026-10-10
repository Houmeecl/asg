import { NextResponse } from 'next/server';
import { exigirUsuarioSesion } from '@/lib/auth';
import { dashboardStats, listOperaciones, listLotes } from '@/lib/baas/operations';
import { listWallets } from '@/lib/baas/wallet';
import { getSimulatorState, getDlocalMode, dlocalConfigured } from '@/lib/baas/dlocal';
import { platformsMode } from '@/lib/baas/platforms';
import { BAAS_LEGAL } from '@/lib/baas/config';
import { getHubspotStatus, getHubspotSimulatorState } from '@/lib/baas/hubspot';

export async function GET() {
  const usuario = await exigirUsuarioSesion();
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  return NextResponse.json({
    stats: dashboardStats(),
    operaciones: listOperaciones({ limit: 40 }),
    lotes: listLotes(),
    wallets: listWallets(),
    dlocal: { mode: getDlocalMode(), ...getSimulatorState(), ...dlocalConfigured() },
    platforms: {
      mode: platformsMode(),
      webhook: '/api/baas/webhooks/dlocal-platforms',
      onboarding: '/ops/onboarding',
      configured: platformsMode() === 'simulator'
        || Boolean(process.env.DLOCAL_PLATFORMS_LOGIN && process.env.DLOCAL_PLATFORMS_SECRET),
    },
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
