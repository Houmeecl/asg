'use client';

import { useState } from 'react';
import Link from 'next/link';
import SicrLogo from '../components/SicrLogo';
import SiteFooter from '../components/SiteFooter';
import '../sicr-landing.css';

export default function ContactoPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setCargando(true);
    setEstado(null);
    try {
      const res = await fetch('/api/baas/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, mensaje }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo enviar');
      setEstado({ ok: true, msg: 'Mensaje recibido. Te contactaremos a la brevedad.' });
      setNombre('');
      setEmail('');
      setMensaje('');
    } catch (err) {
      setEstado({ ok: false, msg: err.message });
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="sicr-lp min-h-screen">
      <header className="top">
        <div className="c">
          <Link href="/" className="brand-mark"><SicrLogo size="sm" contrast="dark" /></Link>
          <div className="sp" />
          <Link href="/ingresar" className="btn dark sm">Ingresar</Link>
        </div>
      </header>
      <main className="sec" style={{ paddingTop: 48 }}>
        <div className="c" style={{ maxWidth: 560 }}>
          <span className="eyebrow">Contacto</span>
          <h1 style={{ fontSize: 36, margin: '8px 0 12px' }}>Escríbenos</h1>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>
            Nombre, email y mensaje. También puedes escribir a{' '}
            <a href="mailto:contacto@sicr3p.cl">contacto@sicr3p.cl</a>.
          </p>
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: 24 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)' }}>
              Nombre
              <input required value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)' }}>
              Email
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)' }}>
              Mensaje
              <textarea required rows={5} value={mensaje} onChange={(e) => setMensaje(e.target.value)} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', resize: 'vertical' }} />
            </label>
            {estado && (
              <div style={{ padding: 10, borderRadius: 10, fontSize: 13, background: estado.ok ? '#e8f8ec' : '#fdecea', color: estado.ok ? '#067647' : '#b42318' }}>
                {estado.msg}
              </div>
            )}
            <button type="submit" disabled={cargando} className="btn lime" style={{ width: '100%' }}>
              {cargando ? 'Enviando…' : 'Enviar mensaje'}
            </button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
