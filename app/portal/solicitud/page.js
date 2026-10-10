'use client';

import { useEffect, useState } from 'react';
import BaasShell, { formatClp, StatusPill } from '../../components/BaasShell';
import { DLOCAL_PAYOUT_COUNTRIES } from '@/lib/baas/config';

const NAV = [
  { href: '/portal', label: 'Inicio' },
  { href: '/portal/solicitud', label: 'Nueva solicitud' },
  { href: '/portal/beneficiarios', label: 'Beneficiarios' },
  { href: '/portal/tarjetas', label: 'Cuenta / tarjeta' },
];

export default function SolicitudPage() {
  const [user, setUser] = useState(null);
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [monto, setMonto] = useState('25000');
  const [pais, setPais] = useState('PE');
  const [rutEmisor, setRutEmisor] = useState('11.111.111-1');
  const [beneficiarioId, setBeneficiarioId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    fetch('/api/baas/dashboard').then((r) => r.json()).then((d) => setUser(d.usuario));
    fetch('/api/baas/beneficiarios').then((r) => r.json()).then((d) => setBeneficiarios(d.beneficiarios || []));
  }, []);

  const moneda = DLOCAL_PAYOUT_COUNTRIES.find((c) => c.code === pais)?.currency || 'PEN';

  async function crear(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/baas/operaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'crear_envio',
          montoClp: Number(monto),
          paisDestino: pais,
          monedaDestino: moneda,
          rutEmisor,
          beneficiarioId: beneficiarioId ? Number(beneficiarioId) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <BaasShell title="Nueva solicitud" subtitle="Código para cobrar en POS TUU + instrucción de payout dLocal Go." nav={NAV} user={user}>
      <div className="baas-grid-2">
        <form className="baas-panel baas-form" onSubmit={crear}>
          <div className="baas-field">
            <label>Monto CLP</label>
            <input type="number" min="100" step="1" value={monto} onChange={(e) => setMonto(e.target.value)} required />
          </div>
          <div className="baas-field">
            <label>País destino (payouts dLocal Go)</label>
            <select value={pais} onChange={(e) => setPais(e.target.value)}>
              {DLOCAL_PAYOUT_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name} ({c.currency})</option>
              ))}
            </select>
          </div>
          <div className="baas-field">
            <label>RUT emisor (pagador en POS)</label>
            <input value={rutEmisor} onChange={(e) => setRutEmisor(e.target.value)} required />
          </div>
          <div className="baas-field">
            <label>Beneficiario (opcional)</label>
            <select value={beneficiarioId} onChange={(e) => setBeneficiarioId(e.target.value)}>
              <option value="">— Sin asignar —</option>
              {beneficiarios.map((b) => (
                <option key={b.id} value={b.id}>{b.nombre} · {b.documento}</option>
              ))}
            </select>
          </div>
          {error && <div className="baas-alert err">{error}</div>}
          <button className="baas-btn" type="submit" disabled={cargando}>
            {cargando ? 'Creando…' : 'Generar código'}
          </button>
        </form>

        <div className="baas-panel">
          <h2>Código POS</h2>
          {!result ? (
            <p className="sub">Al crear la solicitud verás el código para el terminal TUU.</p>
          ) : (
            <>
              <div className="baas-code">{result.operacion.codigo}</div>
              <p className="sub" style={{ marginTop: 12 }}>
                {formatClp(result.operacion.monto_clp)} → {result.operacion.pais_destino} ·{' '}
                <StatusPill estado={result.operacion.estado} />
              </p>
              {result.registro?.status === 'NEEDS_KYC' && (
                <div className="baas-alert warn" style={{ marginTop: 12 }}>
                  RUT sin KYC. En POS mostrar QR:{' '}
                  <a href={result.registro.registroPath} style={{ fontWeight: 700 }}>{result.registro.registroPath}</a>
                </div>
              )}
              {result.registro?.status === 'READY' && (
                <div className="baas-alert ok" style={{ marginTop: 12 }}>
                  Wallet lista: {result.registro.wallet?.tarjeta_virtual_id}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </BaasShell>
  );
}
