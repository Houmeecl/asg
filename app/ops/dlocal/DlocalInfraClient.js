'use client';

import { useState } from 'react';
import Link from 'next/link';
import BaasShell from '../../components/BaasShell';
import { OPS_NAV } from '@/lib/baas/ops-nav';

export default function DlocalInfraClient({ initial }) {
  const [data, setData] = useState(initial);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const discovery = data?.discovery || {};
  const entornos = data?.entornos || {};
  const checklist = data?.checklist || [];
  const goMode = entornos?.activo?.go?.mode || 'simulator';
  const platMode = entornos?.activo?.platforms?.mode || 'simulator';
  const goTone = goMode === 'live' ? 'ok' : goMode === 'sandbox' ? 'info' : 'warn';
  const platTone = platMode === 'live' ? 'ok' : platMode === 'sandbox' ? 'info' : 'warn';

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch('/api/baas/dlocal/infra');
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Error');
      setData({ ...j, usuario: data.usuario });
      setErr(null);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <BaasShell
      title="dLocal — infraestructura"
      subtitle="Go + Platforms · discovery, entornos, webhooks y checklist Chile."
      nav={OPS_NAV}
      user={data?.usuario}
    >
      {err ? <p className="baas-alert bad">{err}</p> : null}

      <div className="baas-status-grid">
        <article className="baas-panel">
          <div className="baas-panel-head">
            <div>
              <p className="eyebrow">Activo</p>
              <h2>dLocal Go</h2>
            </div>
            <span className={`baas-pill ${goTone}`}>{entornos?.activo?.go?.label || goMode}</span>
          </div>
          <dl className="baas-kv">
            <div><dt>Modo</dt><dd className="mono">{goMode}</dd></div>
            <div><dt>Base</dt><dd className="mono">{entornos?.activo?.go?.base || '— (simulator)'}</dd></div>
            <div><dt>Credenciales</dt><dd>{entornos?.activo?.go?.configured ? 'Listas' : 'Simulator / faltan'}</dd></div>
            <div><dt>Webhook</dt><dd className="mono">{discovery?.publicUrls?.webhookGo}</dd></div>
          </dl>
        </article>
        <article className="baas-panel">
          <div className="baas-panel-head">
            <div>
              <p className="eyebrow">Activo</p>
              <h2>Platforms</h2>
            </div>
            <span className={`baas-pill ${platTone}`}>{entornos?.activo?.platforms?.label || platMode}</span>
          </div>
          <dl className="baas-kv">
            <div><dt>Modo</dt><dd className="mono">{platMode}</dd></div>
            <div><dt>Base</dt><dd className="mono">{entornos?.activo?.platforms?.base || '— (simulator)'}</dd></div>
            <div><dt>Credenciales</dt><dd>{entornos?.activo?.platforms?.configured ? 'Listas' : 'Simulator / faltan'}</dd></div>
            <div><dt>Webhook</dt><dd className="mono">{discovery?.publicUrls?.webhookPlatforms}</dd></div>
            <div><dt>UI</dt><dd className="mono"><Link href="/ops/onboarding">/ops/onboarding</Link></dd></div>
          </dl>
        </article>
      </div>

      <div className="baas-status-grid">
        <article className="baas-panel">
          <div className="baas-panel-head">
            <h2>Checklist</h2>
            <button type="button" className="baas-btn ghost" onClick={refresh} disabled={loading}>
              {loading ? '…' : 'Actualizar'}
            </button>
          </div>
          <ul className="baas-corridors">
            {checklist.map((c) => (
              <li key={c.id}>
                <span className={`baas-pill ${c.ok ? 'ok' : 'warn'}`} style={{ marginRight: 8 }}>
                  {c.ok ? 'OK' : 'Pendiente'}
                </span>
                <strong>{c.label}</strong>
                <div className="sub mono">{c.detail}</div>
              </li>
            ))}
          </ul>
        </article>
        <article className="baas-panel">
          <h2>Discovery</h2>
          <p className="sub">Público sin secretos. Misma forma que Open Banking discovery.</p>
          <dl className="baas-kv">
            <div><dt>API</dt><dd className="mono">GET /api/baas/dlocal/infra</dd></div>
            <div><dt>Entorno</dt><dd className="mono">GET /api/baas/dlocal/entorno</dd></div>
            <div><dt>Docs</dt><dd className="mono"><Link href="/docs/dlocal">/docs/dlocal</Link></dd></div>
            <div><dt>Autorizar</dt><dd className="mono"><Link href="/autorizar">/autorizar</Link></dd></div>
            <div><dt>Go docs</dt><dd className="mono"><a href={discovery?.goApi?.docs} target="_blank" rel="noreferrer">dlocalgo.com</a></dd></div>
          </dl>
          <h2 className="baas-h">Chile payout</h2>
          <dl className="baas-kv">
            <div><dt>País / moneda</dt><dd className="mono">{discovery?.chile?.country} / {discovery?.chile?.currency}</dd></div>
            <div><dt>Método</dt><dd className="mono">{discovery?.chile?.payment_method_id}</dd></div>
            <div><dt>Documento</dt><dd className="mono">{discovery?.chile?.document_type}</dd></div>
          </dl>
        </article>
      </div>

      <div className="baas-status-grid">
        <article className="baas-panel">
          <h2>Slot prueba</h2>
          <dl className="baas-kv">
            <div><dt>Go</dt><dd>{entornos?.prueba?.go?.configured ? 'Listo' : 'Falta DLOCAL_SANDBOX_*'}</dd></div>
            <div><dt>Platforms</dt><dd>{entornos?.prueba?.platforms?.configured ? 'Listo' : 'Falta DLOCAL_PLATFORMS_SANDBOX_*'}</dd></div>
            <div><dt>Activar</dt><dd className="mono">DLOCAL_MODE=sandbox</dd></div>
          </dl>
        </article>
        <article className="baas-panel">
          <h2>Slot producción</h2>
          <dl className="baas-kv">
            <div><dt>Go</dt><dd>{entornos?.produccion?.go?.configured ? 'Listo' : 'Falta DLOCAL_LIVE_*'}</dd></div>
            <div><dt>Platforms</dt><dd>{entornos?.produccion?.platforms?.configured ? 'Listo' : 'Falta DLOCAL_PLATFORMS_LIVE_*'}</dd></div>
            <div><dt>Activar</dt><dd className="mono">DLOCAL_MODE=live</dd></div>
          </dl>
        </article>
      </div>

      {entornos?.recomendacion ? (
        <p className="baas-alert info">{entornos.recomendacion}</p>
      ) : null}
    </BaasShell>
  );
}
