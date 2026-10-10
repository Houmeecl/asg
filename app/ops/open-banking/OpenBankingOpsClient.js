'use client';

import { useState } from 'react';
import Link from 'next/link';
import BaasShell from '../../components/BaasShell';

const NAV = [
  { href: '/ops', label: 'Cola' },
  { href: '/ops/lotes', label: 'Lotes' },
  { href: '/ops/pos', label: 'POS TUU' },
  { href: '/ops/terminales', label: 'Conexión y KYC' },
  { href: '/ops/mapa', label: 'Capas y mapa' },
  { href: '/ops/open-banking', label: 'Open Banking' },
  { href: '/ops/onboarding', label: 'Onboarding' },
  { href: '/ops/config', label: 'Config' },
];

export default function OpenBankingOpsClient({ initial }) {
  const [data, setData] = useState(initial);
  const [err, setErr] = useState(null);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);

  async function load() {
    try {
      const res = await fetch('/api/baas/open-banking/clients');
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Error');
      setData(j);
      setErr(null);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function createClient() {
    setCreating(true);
    setCreated(null);
    try {
      const res = await fetch('/api/baas/open-banking/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: `Partner ${new Date().toISOString().slice(11, 19)}` }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'No se pudo crear');
      setCreated(j);
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <BaasShell
      title="Open Banking"
      subtitle="API partner AIS/PIS sobre el rail BaaS (cuentas, consentimientos, pagos)."
      nav={NAV}
      user={data?.usuario}
    >
      {err ? <p className="baas-banner warn">{err}</p> : null}

      <div className="baas-grid-2">
        <div className="baas-panel">
          <h2>Clients API</h2>
          <p className="sub">
            Docs públicas:{' '}
            <Link href="/docs/open-banking">/docs/open-banking</Link>
          </p>
          <button type="button" className="baas-btn" onClick={createClient} disabled={creating}>
            {creating ? 'Creando…' : 'Crear client (ADMIN)'}
          </button>
          {created ? (
            <pre className="baas-pre" style={{ marginTop: 12 }}>
              {JSON.stringify(created, null, 2)}
            </pre>
          ) : null}
          <table className="baas-tbl" style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>client_id</th>
                <th>Scopes</th>
              </tr>
            </thead>
            <tbody>
              {(data?.clients || []).map((c) => (
                <tr key={c.client_id}>
                  <td>{c.nombre}</td>
                  <td className="mono">{c.client_id}</td>
                  <td className="mono" style={{ fontSize: 11 }}>
                    {c.scopes_default}
                    {c.demo_secret ? (
                      <>
                        <br />
                        secret: {c.demo_secret}
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="baas-panel">
          <h2>Consentimientos</h2>
          <table className="baas-tbl">
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Scopes</th>
              </tr>
            </thead>
            <tbody>
              {(data?.consents || []).slice(0, 12).map((c) => (
                <tr key={c.consent_id}>
                  <td className="mono" style={{ fontSize: 11 }}>
                    {c.consent_id}
                  </td>
                  <td>{c.status}</td>
                  <td className="mono" style={{ fontSize: 11 }}>
                    {c.scopes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="baas-panel">
        <h2>Pagos PIS</h2>
        <table className="baas-tbl">
          <thead>
            <tr>
              <th>Payment</th>
              <th>Status</th>
              <th>Monto</th>
              <th>Ref</th>
            </tr>
          </thead>
          <tbody>
            {(data?.payments || []).slice(0, 15).map((p) => (
              <tr key={p.payment_id}>
                <td className="mono" style={{ fontSize: 11 }}>
                  {p.payment_id}
                </td>
                <td>{p.status}</td>
                <td>${Number(p.amount_clp).toLocaleString('es-CL')}</td>
                <td>{p.reference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="baas-panel">
        <h2>Audit</h2>
        <table className="baas-tbl">
          <thead>
            <tr>
              <th>Cuándo</th>
              <th>Client</th>
              <th>Acción</th>
              <th>Path</th>
            </tr>
          </thead>
          <tbody>
            {(data?.audit || []).map((a) => (
              <tr key={a.id}>
                <td>{a.creado_en}</td>
                <td className="mono" style={{ fontSize: 11 }}>
                  {a.client_id}
                </td>
                <td>{a.action}</td>
                <td className="mono">{a.path}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BaasShell>
  );
}
