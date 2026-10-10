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
    <div className="sicr-lp framer min-h-screen">
      <div className="grain" aria-hidden="true" />
      <header className="top">
        <div className="c">
          <Link href="/" className="brand-mark"><SicrLogo size="sm" contrast="dark" /></Link>
          <nav className="menu legal-nav" aria-label="Legal">
            <Link href="/terminos">Términos</Link>
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/legal">Datos PJ</Link>
          </nav>
          <div className="sp" />
          <Link href="/ingresar" className="btn dark sm">Ingresar</Link>
        </div>
      </header>

      <section className="legal-hero">
        <div className="c">
          <span className="eyebrow">Contacto</span>
          <h1>Escríbenos</h1>
          <p className="legal-updated">
            Nombre, email y mensaje. También{' '}
            <a href="mailto:contacto@sicr3p.cl">contacto@sicr3p.cl</a>.
          </p>
        </div>
      </section>

      <main className="sec legal-body">
        <div className="c" style={{ maxWidth: 520 }}>
          <form onSubmit={onSubmit} className="contact-form">
            <label>
              Nombre
              <input required value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </label>
            <label>
              Email
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>
              Mensaje
              <textarea required rows={5} value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
            </label>
            {estado && (
              <div className={`form-msg ${estado.ok ? 'ok' : 'err'}`}>{estado.msg}</div>
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
