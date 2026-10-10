'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import SicrLogo from '../components/SicrLogo';
import SiteFooter from '../components/SiteFooter';
import '../sicr-landing.css';

export default function AutorizarPage() {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    rut: '',
    empresa: '',
    entorno: 'prueba',
    aceptaTerminos: false,
    aceptaPrivacidad: false,
    aceptaIntegracion: false,
  });
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const listo = useMemo(
    () =>
      form.nombre.trim()
      && form.email.trim()
      && form.aceptaTerminos
      && form.aceptaPrivacidad
      && form.aceptaIntegracion,
    [form],
  );

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setCargando(true);
    setError('');
    setResultado(null);
    try {
      const res = await fetch('/api/baas/autorizacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo registrar');
      setResultado(data);
      setForm({
        nombre: '',
        email: '',
        rut: '',
        empresa: '',
        entorno: 'prueba',
        aceptaTerminos: false,
        aceptaPrivacidad: false,
        aceptaIntegracion: false,
      });
    } catch (err) {
      setError(err.message);
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
          <nav className="menu legal-nav" aria-label="Legal">
            <Link href="/terminos">Términos</Link>
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/autorizar">Autorizar</Link>
            <Link href="/soporte">Soporte</Link>
          </nav>
          <div className="sp" />
          <Link href="/ingresar" className="btn dark sm">Ingresar</Link>
        </div>
      </header>

      <section className="legal-hero">
        <div className="c">
          <span className="eyebrow">Autorización</span>
          <h1>Autorizar con términos</h1>
          <p className="legal-updated">
            Constancia de aceptación de Términos, Privacidad e integración empresarial SICR3P
            (rail completo: ops, POS, Open Banking y pagos — no solo dLocal).
            Elegí entorno de prueba o producción. SICR3P no es banco ni portal de crédito.
          </p>
        </div>
      </section>

      <main className="sec legal-body">
        <div className="c authz-layout">
          <aside className="authz-summary">
            <h2>Qué estás autorizando</h2>
            <ul>
              <li>Uso de sicr3p/ para integración y desarrollo empresarial.</li>
              <li>Tratamiento de datos según la política de privacidad.</li>
              <li>Que SICR3P SpA opere como prestadora (no como banco ni prestamista).</li>
            </ul>
            <p>
              Leé el texto completo en{' '}
              <Link href="/terminos">Términos</Link> y{' '}
              <Link href="/privacidad">Privacidad</Link>.
              ¿Dudas? <Link href="/soporte">Agente de apoyo</Link>.
            </p>
          </aside>

          <div className="authz-card">
            {resultado ? (
              <div className="authz-ok" role="status">
                <p className="eyebrow">Registrado</p>
                <h2>Código {resultado.codigo}</h2>
                <p>{resultado.mensaje}</p>
                <p className="mono">Versión términos: {resultado.terminos_version}</p>
                <p className="mono">
                  Entorno: {resultado.entorno === 'produccion' ? 'Producción' : 'Prueba (sandbox)'}
                </p>
                <div className="authz-actions">
                  <Link className="btn green" href="/soporte">Hablar con soporte</Link>
                  <button type="button" className="btn dark" onClick={() => setResultado(null)}>
                    Nueva autorización
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="contact-form authz-form">
                <label>
                  Nombre completo
                  <input required value={form.nombre} onChange={(e) => set('nombre', e.target.value)} />
                </label>
                <label>
                  Email
                  <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
                </label>
                <div className="authz-row">
                  <label>
                    RUT (opcional)
                    <input value={form.rut} onChange={(e) => set('rut', e.target.value)} />
                  </label>
                  <label>
                    Empresa (opcional)
                    <input value={form.empresa} onChange={(e) => set('empresa', e.target.value)} />
                  </label>
                </div>

                <fieldset className="authz-checks">
                  <legend>Entorno de integración</legend>
                  <label className="authz-check">
                    <input
                      type="radio"
                      name="entorno"
                      checked={form.entorno === 'prueba'}
                      onChange={() => set('entorno', 'prueba')}
                    />
                    <span>
                      <strong>Prueba (sandbox)</strong> — credenciales y webhooks de test dLocal /
                      integración sin dinero real.
                    </span>
                  </label>
                  <label className="authz-check">
                    <input
                      type="radio"
                      name="entorno"
                      checked={form.entorno === 'produccion'}
                      onChange={() => set('entorno', 'produccion')}
                    />
                    <span>
                      <strong>Producción</strong> — live, solo cuando el entorno de prueba ya validó.
                    </span>
                  </label>
                </fieldset>

                <fieldset className="authz-checks">
                  <legend>Aceptaciones obligatorias</legend>
                  <label className="authz-check">
                    <input
                      type="checkbox"
                      checked={form.aceptaTerminos}
                      onChange={(e) => set('aceptaTerminos', e.target.checked)}
                    />
                    <span>
                      Acepto los <Link href="/terminos" target="_blank">Términos y Condiciones</Link>
                    </span>
                  </label>
                  <label className="authz-check">
                    <input
                      type="checkbox"
                      checked={form.aceptaPrivacidad}
                      onChange={(e) => set('aceptaPrivacidad', e.target.checked)}
                    />
                    <span>
                      Acepto la <Link href="/privacidad" target="_blank">Política de Privacidad</Link>
                    </span>
                  </label>
                  <label className="authz-check">
                    <input
                      type="checkbox"
                      checked={form.aceptaIntegracion}
                      onChange={(e) => set('aceptaIntegracion', e.target.checked)}
                    />
                    <span>
                      Autorizo a SICR3P a prestar integración empresarial según esos términos
                      (sin constituir crédito bancario)
                    </span>
                  </label>
                </fieldset>

                {error ? <div className="form-msg err">{error}</div> : null}

                <button type="submit" className="btn green" disabled={!listo || cargando}>
                  {cargando ? 'Registrando…' : 'Autorizar y registrar'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
