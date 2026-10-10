import { NextResponse } from 'next/server';
import { exigirUsuarioSesion } from '@/lib/auth';
import { dashboardStats, listOperaciones, listLotes } from '@/lib/baas/operations';
import { listWallets } from '@/lib/baas/wallet';
import { getSimulatorState, getDlocalMode } from '@/lib/baas/dlocal';
import { getHubspotStatus, getHubspotSimulatorState } from '@/lib/baas/hubspot';

export async function GET() {
  const usuario = await exigirUsuarioSesion();
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  return NextResponse.json({
    stats: dashboardStats(),
    operaciones: listOperaciones({ limit: 40 }),
    lotes: listLotes(),
    wallets: listWallets(),
    dlocal: { mode: getDlocalMode(), ...getSimulatorState() },
    hubspot: { ...getHubspotStatus(), ...getHubspotSimulatorState() },
    usuario,
  });
}
