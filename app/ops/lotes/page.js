'use client';

import { useCallback, useEffect, useState } from 'react';
import BaasShell, { formatClp, StatusPill } from '../../components/BaasShell';

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

export default function LotesPage() {
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(() => {
    fetch('/api/baas/dashboard').then((r) => r.json()).then(setData);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function action(body) {
    setMsg(null);
    const res = await fetch('/api/baas/operaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) setMsg({ ok: false, text: json.error });
    else setMsg({ ok: true, text: body.action === 'cerrar_lote' ? `Lote ${json.lote?.referencia}` : `Liberado · ${json.results?.length || 0} payouts` });
    load();
  }

  return (
    <BaasShell title="Lotes" subtitle="Cierre de operaciones COBRADA → fondeo merchant → liberar FIFO con dLocal Go." nav={NAV} user={data?.usuario}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button type="button" className="baas-btn dark" onClick={() => action({ action: 'cerrar_lote' })}>Cerrar lote</button>
      </div>
      {msg && <div className={`baas-alert ${msg.ok ? 'ok' : 'err'}`} style={{ marginBottom: 12 }}>{msg.text}</div>}
      <div className="baas-panel">
        <h2>Lotes</h2>
        <table className="baas-tbl">
          <thead>
            <tr>
              <th>Referencia</th>
              <th className="right">Monto</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(data?.lotes || []).map((l) => (
              <tr key={l.id}>
                <td className="mono">{l.referencia}</td>
                <td className="right">{formatClp(l.monto_esperado)}</td>
                <td><StatusPill estado={l.estado} /></td>
                <td>
                  {(l.estado === 'CERRADO' || l.estado === 'FONDEADO') && (
                    <button type="button" className="baas-btn sm" onClick={() => action({ action: 'liberar_lote', loteId: l.id })}>
                      Liberar dLocal
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="baas-panel">
        <h2>Simulador dLocal</h2>
        <p className="sub">Balance: {formatClp(data?.dlocal?.balance)} · modo {data?.dlocal?.mode}</p>
        <table className="baas-tbl">
          <thead><tr><th>Payout</th><th>Monto</th><th>Status</th></tr></thead>
          <tbody>
            {(data?.dlocal?.payouts || []).slice(0, 8).map((p) => (
              <tr key={p.payout_id}>
                <td className="mono">{p.payout_id}</td>
                <td>{p.amount}</td>
                <td><StatusPill estado={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BaasShell>
  );
}
