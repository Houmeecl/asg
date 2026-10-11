'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import SicrLogo from '../components/SicrLogo';
import SiteFooter from '../components/SiteFooter';
import '../sicr-landing.css';

export default function SoportePage() {
  const [sessionId, setSessionId] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [msgs, setMsgs] = useState([
    {
      rol: 'assistant',
      contenido:
        'Hola. Soy SICR3P Apoyo. Puedo ayudarte con términos, autorización, correo y el rail. ¿En qué te ayudo?',
    },
  ]);
  const [cargando, setCargando] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    fetch('/api/baas/soporte')
      .then((r) => r.json())
      .then((d) => setSugerencias(d.sugerencias || []))
      .catch(() => null);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, cargando]);

  async function enviar(texto) {
    const content = (texto ?? mensaje).trim();
    if (!content || cargando) return;
    setMensaje('');
    setMsgs((m) => [...m, { rol: 'user', contenido: content }]);
    setCargando(true);
    try {
      const res = await fetch('/api/baas/soporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: content, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error de soporte');
      if (data.sessionId) setSessionId(data.sessionId);
      setMsgs((m) => [...m, { rol: 'assistant', contenido: data.reply }]);
      if (data.sugerencias) setSugerencias(data.sugerencias);
    } catch (err) {
      setMsgs((m) => [...m, { rol: 'assistant', contenido: `No pude responder: ${err.message}` }]);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="sicr-lp min-h-screen">
      <header className="top">
        <div className="c">
          <Link href="/" className="brand-mark" aria-label="sicr3p/ inicio">
            <SicrLogo size="sm" contrast="dark" />
          </Link>
          <nav className="menu legal-nav" aria-label="Soporte">
            <Link href="/terminos">Términos</Link>
            <Link href="/autorizar">Autorizar</Link>
            <Link href="/soporte">Soporte</Link>
            <Link href="/contacto">Contacto</Link>
          </nav>
          <div className="sp" />
          <Link href="/ingresar" className="btn dark sm">Ingresar</Link>
        </div>
      </header>

      <section className="legal-hero">
        <div className="c">
          <span className="eyebrow">Agente de apoyo</span>
          <h1>SICR3P Apoyo</h1>
          <p className="legal-updated">
            Bot de ayuda para términos, autorización y configuración. No reemplaza asesoría legal.
          </p>
        </div>
      </section>

      <main className="sec legal-body">
        <div className="c support-shell">
          <div className="support-chat" role="log" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={`${m.rol}-${i}`} className={`support-bubble ${m.rol}`}>
                <span className="support-who">{m.rol === 'user' ? 'Vos' : 'SICR3P Apoyo'}</span>
                <p>{m.contenido}</p>
              </div>
            ))}
            {cargando ? <div className="support-bubble assistant"><p>…</p></div> : null}
            <div ref={endRef} />
          </div>

          <div className="support-chips">
            {sugerencias.map((s) => (
              <button key={s} type="button" className="support-chip" onClick={() => enviar(s)}>
                {s}
              </button>
            ))}
          </div>

          <form
            className="support-compose"
            onSubmit={(e) => {
              e.preventDefault();
              enviar();
            }}
          >
            <input
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Preguntá por términos, autorización, correo…"
              aria-label="Mensaje"
            />
            <button type="submit" className="btn green" disabled={cargando || !mensaje.trim()}>
              Enviar
            </button>
          </form>

          <p className="support-foot">
            Para dejar constancia formal usá <Link href="/autorizar">/autorizar</Link>.
            Email humano: <a href="mailto:contacto@sicr3p.cl">contacto@sicr3p.cl</a>.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
