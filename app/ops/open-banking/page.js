import { redirect } from 'next/navigation';
import { obtenerUsuarioSesion } from '@/lib/auth';
import {
  getDemoClientSecret,
  listAudit,
  listClients,
  listConsents,
  listPayments,
  seedDemoOpenBankingClient,
} from '@/lib/baas/open-banking';
import OpenBankingOpsClient from './OpenBankingOpsClient';

export default async function OpenBankingOpsPage() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario || (usuario.rol !== 'ADMIN' && usuario.rol !== 'OPERADOR')) {
    redirect('/ingresar');
  }

  seedDemoOpenBankingClient();
  const clients = listClients().map((c) => ({
    ...c,
    demo_secret: c.nombre === 'Demo Open Banking' ? getDemoClientSecret(c.client_id) : undefined,
  }));

  const initial = {
    usuario,
    clients,
    consents: listConsents(),
    payments: listPayments(),
    audit: listAudit(30),
  };

  return <OpenBankingOpsClient initial={initial} />;
}
