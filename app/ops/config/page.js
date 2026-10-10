'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BaasShell, { formatClp } from '../../components/BaasShell';
import { BAAS_LEGAL, DLOCAL_PAYOUT_COUNTRIES } from '@/lib/baas/config';

const NAV = [
  { href: '/ops', label: 'Cola' },
  { href: '/ops/lotes', label: 'Lotes' },
  { href: '/ops/pos', label: 'POS TUU' },
  { href: '/ops/terminales', label: 'Conexión y KYC' },
  { href: '/ops/open-banking', label: 'Open Banking' },
  { href: '/ops/config', label: 'Config' },
];

export default function ConfigPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/baas/dashboard').then((r) => r.json()).then(setData);
  }, []);

  return (
    <BaasShell title="Configuración" subtitle="Rail SICR3P → TUU → lote → dLocal Go. Sin Global66." nav={NAV} user={data?.usuario}>
      <div className="baas-grid-2">
        <div className="baas-panel">
          <h2>Entorno</h2>
          <table className="baas-tbl">
            <tbody>
              <tr><td>DLOCAL_MODE</td><td className="mono">{data?.dlocal?.mode || 'simulator'}</td></tr>
              <tr><td>Saldo merchant sim</td><td>{formatClp(data?.dlocal?.balance)}</td></tr>
              <tr><td>Webhook</td><td className="mono">POST /api/baas/webhooks/dlocal</td></tr>
              <tr><td>TUU</td><td className="mono">mock InterApp</td></tr>
              <tr>
                <td>HubSpot</td>
                <td className="mono">
                  {data?.hubspot?.configured ? `live · ${data.hubspot.mode}` : 'simulator (sin token)'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="baas-panel">
          <h2>Comercio</h2>
          <p className="sub">{BAAS_LEGAL.razonSocial}</p>
          <p className="sub">RUT {BAAS_LEGAL.rut}</p>
          <p className="sub"><a href={`mailto:${BAAS_LEGAL.email}`}>{BAAS_LEGAL.email}</a></p>
          <h2 style={{ marginTop: 20 }}>Corredores payout</h2>
          <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--ink-soft)', fontSize: 14 }}>
            {DLOCAL_PAYOUT_COUNTRIES.map((c) => (
              <li key={c.code}>{c.code} — {c.name} ({c.currency})</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="baas-panel">
        <h2>Documentación interna</h2>
        <p className="sub">
          Ver <code>docs/baas-architecture.md</code>, <code>docs/open-banking.md</code>,{' '}
          <code>docs/tuu-partner-checklist.md</code> y <Link href="/docs/open-banking">docs web OB</Link>.
        </p>
      </div>
    </BaasShell>
  );
}
