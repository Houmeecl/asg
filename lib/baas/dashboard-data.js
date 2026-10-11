import { dashboardStats, listOperaciones, listLotes } from './operations.js';
import { listWallets } from './wallet.js';
import { getSimulatorState, getDlocalMode } from './dlocal.js';
import { getHubspotStatus, getHubspotSimulatorState } from './hubspot.js';

export function buildDashboardPayload(usuario) {
  return {
    stats: dashboardStats(),
    operaciones: listOperaciones({ limit: 40 }),
    lotes: listLotes(),
    wallets: listWallets(),
    dlocal: { mode: getDlocalMode(), ...getSimulatorState() },
    hubspot: { ...getHubspotStatus(), ...getHubspotSimulatorState() },
    usuario,
  };
}
