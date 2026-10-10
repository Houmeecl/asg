'use client';

import { useState } from 'react';
import Link from 'next/link';
import BaasShell, { formatClp, StatusPill } from '../components/BaasShell';

const NAV = [
  { href: '/portal', label: 'Inicio' },
  { href: '/portal/solicitud', label: 'Nueva solicitud' },
  { href: '/portal/beneficiarios', label: 'Beneficiarios' },
  { href: '/portal/tarjetas', label: 'Cuenta / tarjeta' },
];

export default function PortalHomeClient({ initial }) {
  const [data, setData] = useState(initial);

  async function refresh() {
    const r = await fetch('/api/baas/dashboard');
    const j = await r.json();
    if (r.ok) setData(j);
  }

  const stats = data?.stats || {};
  const ops = data?.operaciones || [];

  return (
    <BaasShell
      title="Portal empresa"
      subtitle="Saldo merchant / operativo dLocal Go · instrucciones de pago (no cuenta bancaria de clientes)."
      nav={NAV}
      user={data?.usuario}
    >
      <div className="baas-kpis">
        <div className="baas-kpi">
          <div className="lbl">Operaciones</div>
          <div className="val">{stats.total ?? '—'}</div>
          <div className="hint">Total registradas</div>
        </div>
        <div className="baas-kpi">
          <div className="lbl">Monto operativo</div>
          <div className="val">{formatClp(stats.montoMes)}</div>
          <div className="hint">Suma de operaciones</div>
        </div>
        <div className="baas-kpi">
          <div className="lbl">Pendientes</div>
          <div className="val">{stats.pendientes ?? '—'}</div>
          <div className="hint">Registro / cobro / lote</div>
        </div>
        <div className="baas-kpi">
          <div className="lbl">Saldo merchant (sim)</div>
          <div className="val">{formatClp(stats.dlocal?.balance)}</div>
          <div className="hint">
            dLocal Go · {stats.dlocal?.mode || 'simulator'}{' '}
            <button type="button" className="baas-btn sm" style={{ marginLeft: 8 }} onClick={refresh}>
              Actualizar
            </button>
          </div>
        </div>
      </div>

      <div className="baas-grid-2">
        <div className="baas-panel">
          <h2>Últimas operaciones</h2>
          {!ops.length ? (
            <p className="sub">Aún no hay operaciones. Crea una solicitud.</p>
          ) : (
            <table className="baas-tbl">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Modo</th>
                  <th>País</th>
                  <th className="right">Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {ops.slice(0, 10).map((o) => (
                  <tr key={o.id}>
                    <td className="mono">{o.codigo}</td>
                    <td>{o.modo}</td>
                    <td>{o.pais_destino}</td>
                    <td className="right">{formatClp(o.monto_clp)}</td>
                    <td>
                      <StatusPill estado={o.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="baas-panel">
          <h2>Nueva solicitud</h2>
          <p className="sub" style={{ marginBottom: 16 }}>
            Genera un código para cobrar en POS TUU. Si el RUT no está registrado, el POS muestra QR de
            KYC y wallet virtual.
          </p>
          <Link href="/portal/solicitud" className="baas-btn full">
            Crear solicitud
          </Link>
        </div>
      </div>
    </BaasShell>
  );
}
