import { Suspense } from 'react';
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
import ObConsoleClient from './ObConsoleClient';
import '../ob.css';

export const metadata = {
  title: 'Open Banking Console — sicr3p/',
  description: 'Portal partner AIS/PIS: clients, consentimientos, pagos y sandbox.',
};

export default async function OpenBankingConsolePage() {
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

  return (
    <Suspense
      fallback={
        <div className="ob">
          <div className="ob-shell">
            <main className="ob-main">
              <h1>Open Banking Console</h1>
              <p className="sub">Cargando…</p>
            </main>
          </div>
        </div>
      }
    >
      <ObConsoleClient initial={initial} />
    </Suspense>
  );
}
