'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import SicrLogo from '../../components/SicrLogo';
import '../../sicr-landing.css';

export default function RegistroKycPage() {
  const { token } = useParams();
  const [persona, setPersona] = useState(null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [done, setDone] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/baas/registro?token=${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.persona) {
          setPersona(d.persona);
          if (d.persona.nombre && d.persona.nombre !== 'Por registrar') setNombre(d.persona.nombre);
        } else setError(d.error || 'Enlace inválido');
      });
  }, [token]);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/baas/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, nombre, email, telefono }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setDone(data);
  }

  return (
    <div className="sicr-lp min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="top">
        <div className="c">
          <Link href="/" className="brand-mark"><SicrLogo size="sm" contrast="dark" /></Link>
        </div>
      </header>
      <main className="c" style={{ maxWidth: 480, padding: '48px 0' }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Registro KYC</h1>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 20, fontSize: 14 }}>
          Completa tus datos para asociar una wallet virtual operativa (no es tarjeta prepago emitida por sicr3p/).
        </p>
        {error && <div style={{ background: '#fdecea', color: '#b42318', padding: 12, borderRadius: 10, marginBottom: 12 }}>{error}</div>}
        {done ? (
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 24 }}>
            <p style={{ color: '#067647', fontWeight: 700 }}>Registro aprobado</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>Wallet: <code>{done.wallet.wallet_id}</code></p>
            <p style={{ fontSize: 14 }}>Tarjeta virtual: <code>{done.wallet.tarjeta_virtual_id}</code></p>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 12 }}>Ya puedes continuar el cobro en el POS.</p>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 24 }}>
            {persona && <p style={{ fontSize: 13 }}>RUT: <strong>{persona.rut}</strong></p>}
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)' }}>
              Nombre completo
              <input required value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ display: 'block', width: '100%', marginTop: 6, border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px' }} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)' }}>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ display: 'block', width: '100%', marginTop: 6, border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px' }} />
            </label>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)' }}>
              Teléfono
              <input value={telefono} onChange={(e) => setTelefono(e.target.value)} style={{ display: 'block', width: '100%', marginTop: 6, border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px' }} />
            </label>
            <button type="submit" className="btn lime">Crear wallet virtual</button>
          </form>
        )}
      </main>
    </div>
  );
}
