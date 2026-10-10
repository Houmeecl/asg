'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import SicrLogo from '../../components/SicrLogo';
import '../../sicr-landing.css';

export default function PagarTuristaPage() {
  const { token } = useParams();
  const [estado, setEstado] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  async function pagar() {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch('/api/baas/operaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cobrar_turista', token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setEstado(data.operacion);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="sicr-lp min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="top">
        <div className="c">
          <Link href="/" className="brand-mark"><SicrLogo size="sm" contrast="dark" /></Link>
        </div>
      </header>
      <main className="c" style={{ maxWidth: 420, padding: '56px 0', textAlign: 'center' }}>
        <div className="brand-hero" style={{ fontSize: 40, color: 'var(--navy)', marginBottom: 12 }}>
          sicr<span style={{ color: 'var(--lime)' }}>3</span>p/
        </div>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Pago turista</h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 24 }}>
          Simulación de pay-in (dLocal Go). En producción redirige al checkout.
        </p>
        {error && <div style={{ background: '#fdecea', color: '#b42318', padding: 12, borderRadius: 10, marginBottom: 12 }}>{error}</div>}
        {estado ? (
          <div style={{ background: '#e8f8ec', color: '#067647', padding: 20, borderRadius: 14 }}>
            Pago registrado · {estado.codigo}
            <div style={{ fontSize: 13, marginTop: 8 }}>Estado: {estado.estado}</div>
          </div>
        ) : (
          <button type="button" className="btn lime" onClick={pagar} disabled={cargando}>
            {cargando ? 'Procesando…' : 'Pagar ahora (simulado)'}
          </button>
        )}
      </main>
    </div>
  );
}
