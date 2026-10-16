'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import BaasShell, { formatClp } from '../../components/BaasShell';
import { buildTuuPaymentPayload, TUU_PACKAGES } from '@/lib/baas/tuu';
import { OPS_NAV } from '@/lib/baas/ops-nav';

export default function PosPage() {
  const [user, setUser] = useState(null);
  const [monto, setMonto] = useState('15000');
  const [nota, setNota] = useState('Pago turista');
  const [turista, setTurista] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [payloadPreview, setPayloadPreview] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetch('/api/baas/dashboard').then((r) => r.json()).then((d) => setUser(d.usuario));
    setPayloadPreview(
      buildTuuPaymentPayload({
        amount: 20000,
        operationId: 'S3-DEMO',
        commerceRut: '76XXXXXXX',
      }),
    );
  }, []);

  async function crearTurista(e) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch('/api/baas/operaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'crear_turista', montoClp: Number(monto), nota }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg({ ok: false, text: data.error });
      return;
    }
    setTurista(data);
    const origin = window.location.origin;
    const url = `${origin}${data.payPath}`;
    setQrDataUrl(await QRCode.toDataURL(url, { width: 220, margin: 1 }));
    setMsg({ ok: true, text: `QR listo · ${data.operacion.codigo}` });
  }

  return (
    <BaasShell title="POS TUU" subtitle="Modo tarjeta InterApp (mock) y modo turista con QR de pago." nav={OPS_NAV} user={user}>
      <div className="baas-grid-2">
        <div className="baas-panel">
          <h2>InterApp TUU (contrato)</h2>
          <p className="sub">
            Packages: <span className="mono">{TUU_PACKAGES.dev}</span> / <span className="mono">{TUU_PACKAGES.prod}</span>.
            En Cloud Agent usamos mock (`DLOCAL_MODE=simulator` + cobro mock). Validar con TUU Demo en dispositivo real.
          </p>
          <pre style={{ fontSize: 11, background: 'var(--bg)', padding: 12, borderRadius: 10, overflow: 'auto' }}>
            {JSON.stringify(payloadPreview, null, 2)}
          </pre>
          <p className="sub" style={{ marginTop: 10 }}>
            Montos terminados en 13 → rechazo simulado; en 66 → cancelado. Cobro real desde la cola con “Cobrar TUU (mock)”.
          </p>
        </div>

        <form className="baas-panel baas-form" onSubmit={crearTurista}>
          <h2>Modo turista (QR)</h2>
          <p className="sub">Sin tarjeta en el momento: genera link/QR de pay-in (simulado dLocal).</p>
          <div className="baas-field">
            <label>Monto CLP</label>
            <input type="number" min="100" value={monto} onChange={(e) => setMonto(e.target.value)} required />
          </div>
          <div className="baas-field">
            <label>Nota</label>
            <input value={nota} onChange={(e) => setNota(e.target.value)} />
          </div>
          {msg && <div className={`baas-alert ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</div>}
          <button className="baas-btn" type="submit">Generar QR turista</button>
          {turista && (
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              {qrDataUrl ? <img src={qrDataUrl} alt="QR pago turista" width={220} height={220} /> : null}
              <p className="mono" style={{ marginTop: 8 }}>{turista.payPath}</p>
              <p className="sub">{formatClp(turista.operacion.monto_clp)} · {turista.operacion.codigo}</p>
              <a className="baas-btn ghost sm" href={turista.payPath} target="_blank" rel="noreferrer">Abrir página de pago</a>
            </div>
          )}
        </form>
      </div>
    </BaasShell>
  );
}
