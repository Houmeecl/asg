'use client';

import { useState } from 'react';
import BaasShell, { formatClp, StatusPill } from '../components/BaasShell';

const NAV = [
  { href: '/ops', label: 'Cola' },
  { href: '/ops/lotes', label: 'Lotes' },
  { href: '/ops/pos', label: 'POS TUU' },
  { href: '/ops/open-banking', label: 'Open Banking' },
  { href: '/ops/config', label: 'Config' },
];

export default function OpsColaClient({ initial }) {
  const [data, setData] = useState(initial);
  const [msg, setMsg] = useState(null);

  async function load() {
    const r = await fetch('/api/baas/dashboard');
    const j = await r.json();
    if (r.ok) setData(j);
  }

  async function cobrar(operacionId) {
    setMsg(null);
    const res = await fetch('/api/baas/operaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cobrar_tuu', operacionId }),
    });
    const json = await res.json();
    if (!res.ok) setMsg({ ok: false, text: json.error });
    else {
      setMsg({
        ok: true,
        text: json.ok
          ? `Cobrado · seq ${json.result?.sequenceNumber}`
          : json.result?.errorMessage,
      });
    }
    await load();
  }

  const ops = data?.operaciones || [];
  const stats = data?.stats || {};

  return (
    <BaasShell
      title="Cola de pagos"
      subtitle="Operaciones pendientes de cobro TUU o en curso hacia payout dLocal."
      nav={NAV}
      user={data?.usuario}
    >
      <div className="baas-kpis">
        <div className="baas-kpi">
          <div className="lbl">Pendientes</div>
          <div className="val">{stats.pendientes ?? '—'}</div>
        </div>
        <div className="baas-kpi">
          <div className="lbl">Cobradas</div>
          <div className="val">{stats.cobradas ?? '—'}</div>
        </div>
        <div className="baas-kpi">
          <div className="lbl">Enviadas</div>
          <div className="val">{stats.enviadas ?? '—'}</div>
        </div>
        <div className="baas-kpi">
          <div className="lbl">Merchant sim</div>
          <div className="val">{formatClp(stats.dlocal?.balance)}</div>
        </div>
      </div>
      {msg ? (
        <div className={`baas-alert ${msg.ok ? 'ok' : 'err'}`} style={{ marginBottom: 12 }}>
          {msg.text}
        </div>
      ) : null}
      <div className="baas-panel">
        <h2>Cola</h2>
        <table className="baas-tbl">
          <thead>
            <tr>
              <th>Código</th>
              <th>Modo</th>
              <th>RUT</th>
              <th className="right">Monto</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ops.map((o) => (
              <tr key={o.id}>
                <td className="mono">{o.codigo}</td>
                <td>{o.modo}</td>
                <td className="mono">{o.persona_rut || '—'}</td>
                <td className="right">{formatClp(o.monto_clp)}</td>
                <td>
                  <StatusPill estado={o.estado} />
                </td>
                <td>
                  {o.modo === 'ENVIO' && o.estado === 'PENDIENTE_COBRO' ? (
                    <button type="button" className="baas-btn sm" onClick={() => cobrar(o.id)}>
                      Cobrar TUU (mock)
                    </button>
                  ) : null}
                  {o.estado === 'PENDIENTE_REGISTRO' ? <span className="sub">Esperando KYC</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BaasShell>
  );
}
