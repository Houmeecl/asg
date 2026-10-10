'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ObShell from '../../components/ObShell';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'clients', label: 'Clients' },
  { id: 'consents', label: 'Consents' },
  { id: 'payments', label: 'Payments' },
  { id: 'sandbox', label: 'Sandbox' },
];

export default function ObConsoleClient({ initial }) {
  const search = useSearchParams();
  const router = useRouter();
  const tab = search.get('tab') || 'overview';
  const [data, setData] = useState(initial);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sandbox, setSandbox] = useState({
    client_id: initial?.clients?.[0]?.client_id || '',
    client_secret: initial?.clients?.[0]?.demo_secret || '',
    consent_id: '',
    token: '',
    output: '',
  });

  const kpis = useMemo(
    () => ({
      clients: data?.clients?.length || 0,
      consents: data?.consents?.length || 0,
      payments: data?.payments?.length || 0,
      audit: data?.audit?.length || 0,
    }),
    [data],
  );

  function setTab(id) {
    router.replace(id === 'overview' ? '/open-banking/console' : `/open-banking/console?tab=${id}`);
  }

  async function refresh() {
    const res = await fetch('/api/baas/open-banking/clients');
    const j = await res.json();
    if (res.ok) setData(j);
  }

  async function createClient() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/baas/open-banking/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: `Partner ${new Date().toISOString().slice(11, 19)}` }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'No se pudo crear');
      setMsg({ ok: true, text: `Client creado · secret (una vez): ${j.client_secret}` });
      setSandbox((s) => ({ ...s, client_id: j.client_id, client_secret: j.client_secret }));
      await refresh();
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  }

  async function runSandbox(step) {
    setBusy(true);
    setMsg(null);
    try {
      if (step === 'token') {
        const res = await fetch('/api/open-banking/v1/auth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: sandbox.client_id,
            client_secret: sandbox.client_secret,
            consent_id: sandbox.consent_id || undefined,
          }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || j.error_description || JSON.stringify(j));
        setSandbox((s) => ({ ...s, token: j.access_token, output: JSON.stringify(j, null, 2) }));
        setMsg({ ok: true, text: sandbox.consent_id ? 'Token con consentimiento' : 'Token emitido' });
        return;
      }
      if (step === 'consent') {
        const res = await fetch('/api/open-banking/v1/consents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sandbox.token}`,
          },
          body: JSON.stringify({
            scopes: ['accounts:read', 'transactions:read', 'payments:write'],
          }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || JSON.stringify(j));
        setSandbox((s) => ({
          ...s,
          consent_id: j.consent_id || j.Data?.ConsentId || j.consentId || s.consent_id,
          output: JSON.stringify(j, null, 2),
        }));
        setMsg({ ok: true, text: 'Consentimiento creado (AWAITING_AUTHORISATION)' });
        await refresh();
        return;
      }
      if (step === 'authorise') {
        if (!sandbox.consent_id) throw new Error('Falta consent_id');
        const res = await fetch(`/api/open-banking/v1/consents/${sandbox.consent_id}/authorise`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${sandbox.token}` },
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || j.error_description || JSON.stringify(j));
        setSandbox((s) => ({ ...s, output: JSON.stringify(j, null, 2) }));
        setMsg({ ok: true, text: 'Consentimiento AUTHORISED · vuelve a pedir token con consent_id' });
        await refresh();
        return;
      }
      if (step === 'accounts') {
        const res = await fetch('/api/open-banking/v1/accounts', {
          headers: { Authorization: `Bearer ${sandbox.token}` },
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || JSON.stringify(j));
        setSandbox((s) => ({ ...s, output: JSON.stringify(j, null, 2) }));
        setMsg({ ok: true, text: 'AIS accounts OK' });
        return;
      }
      if (step === 'payment') {
        const res = await fetch('/api/open-banking/v1/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sandbox.token}`,
          },
          body: JSON.stringify({
            amount: 1500,
            currency: 'CLP',
            creditorName: 'Beneficiario Demo',
            creditorAccount: '12345678',
            bankCode: '1',
            reference: `OB-SANDBOX-${Date.now()}`,
          }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || j.error_description || JSON.stringify(j));
        setSandbox((s) => ({ ...s, output: JSON.stringify(j, null, 2) }));
        setMsg({ ok: true, text: 'PIS payment iniciado' });
        await refresh();
      }
    } catch (e) {
      setMsg({ ok: false, text: e.message });
      setSandbox((s) => ({ ...s, output: e.message }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ObShell
      title="Open Banking Console"
      subtitle="Portal partner nuevo · AIS/PIS · no usa el panel ops legado."
      user={data?.usuario}
      activeTab={tab}
    >
      <div className="ob-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'on' : ''}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg ? <div className={`ob-alert ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</div> : null}

      {tab === 'overview' ? (
        <>
          <div className="ob-kpis">
            <div className="ob-kpi">
              <div className="lbl">Clients</div>
              <div className="val">{kpis.clients}</div>
            </div>
            <div className="ob-kpi">
              <div className="lbl">Consents</div>
              <div className="val">{kpis.consents}</div>
            </div>
            <div className="ob-kpi">
              <div className="lbl">Payments</div>
              <div className="val">{kpis.payments}</div>
            </div>
            <div className="ob-kpi">
              <div className="lbl">Audit</div>
              <div className="val">{kpis.audit}</div>
            </div>
          </div>
          <div className="ob-panel">
            <h2>Producto</h2>
            <p className="sub" style={{ marginBottom: 0 }}>
              Esta console es la base nueva de Open Banking. El antiguo{' '}
              <span className="ob-mono">/ops/open-banking</span> redirige aquí. API en{' '}
              <span className="ob-mono">/api/open-banking/v1</span>.
            </p>
          </div>
          <div className="ob-panel">
            <h2>Última auditoría</h2>
            <table className="ob-tbl">
              <thead>
                <tr>
                  <th>Acción</th>
                  <th>Client</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {(data?.audit || []).slice(0, 8).map((a) => (
                  <tr key={a.id}>
                    <td className="ob-mono">{a.action}</td>
                    <td className="ob-mono">{a.client_id || '—'}</td>
                    <td className="ob-mono">{a.detail || a.path || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {tab === 'clients' ? (
        <div className="ob-panel">
          <h2>API clients</h2>
          <button type="button" className="ob-btn primary sm" onClick={createClient} disabled={busy}>
            {busy ? 'Creando…' : 'Crear client'}
          </button>
          <table className="ob-tbl" style={{ marginTop: 14 }}>
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
                  <td className="ob-mono">{c.client_id}</td>
                  <td className="ob-mono">
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
      ) : null}

      {tab === 'consents' ? (
        <div className="ob-panel">
          <h2>Consentimientos</h2>
          <table className="ob-tbl">
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Scopes</th>
              </tr>
            </thead>
            <tbody>
              {(data?.consents || []).map((c) => (
                <tr key={c.consent_id}>
                  <td className="ob-mono">{c.consent_id}</td>
                  <td>
                    <span className={`ob-pill ${c.status === 'AUTHORISED' ? 'ok' : 'warn'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="ob-mono">{c.scopes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'payments' ? (
        <div className="ob-panel">
          <h2>Pagos PIS</h2>
          <table className="ob-tbl">
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {(data?.payments || []).map((p) => (
                <tr key={p.payment_id || p.id}>
                  <td className="ob-mono">{p.payment_id || p.id}</td>
                  <td>
                    <span className="ob-pill">{p.status}</span>
                  </td>
                  <td className="ob-mono">
                    {p.amount_clp ?? p.amount} {p.currency || 'CLP'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'sandbox' ? (
        <div className="ob-panel ob-playground">
          <h2>Sandbox playground</h2>
          <div className="row">
            <div>
              <label>client_id</label>
              <input
                value={sandbox.client_id}
                onChange={(e) => setSandbox((s) => ({ ...s, client_id: e.target.value }))}
              />
            </div>
            <div>
              <label>client_secret</label>
              <input
                value={sandbox.client_secret}
                onChange={(e) => setSandbox((s) => ({ ...s, client_secret: e.target.value }))}
              />
            </div>
          </div>
          <label>consent_id (opcional para token scoped)</label>
          <input
            value={sandbox.consent_id}
            onChange={(e) => setSandbox((s) => ({ ...s, consent_id: e.target.value }))}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <button type="button" className="ob-btn primary sm" disabled={busy} onClick={() => runSandbox('token')}>
              1. Token
            </button>
            <button type="button" className="ob-btn ghost sm" disabled={busy || !sandbox.token} onClick={() => runSandbox('consent')}>
              2. Consent
            </button>
            <button type="button" className="ob-btn ghost sm" disabled={busy || !sandbox.token || !sandbox.consent_id} onClick={() => runSandbox('authorise')}>
              3. Authorise
            </button>
            <button type="button" className="ob-btn ghost sm" disabled={busy || !sandbox.client_id} onClick={() => runSandbox('token')}>
              4. Token + consent
            </button>
            <button type="button" className="ob-btn ghost sm" disabled={busy || !sandbox.token} onClick={() => runSandbox('accounts')}>
              5. AIS Accounts
            </button>
            <button type="button" className="ob-btn ghost sm" disabled={busy || !sandbox.token} onClick={() => runSandbox('payment')}>
              6. PIS Payment
            </button>
          </div>
          <label>Respuesta</label>
          <pre className="ob-pre">{sandbox.output || '// Ejecuta un paso del playground'}</pre>
        </div>
      ) : null}
    </ObShell>
  );
}
