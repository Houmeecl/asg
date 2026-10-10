'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BaasShell, { formatClp } from '../../components/BaasShell';
import { BAAS_LEGAL, DLOCAL_PAYOUT_COUNTRIES } from '@/lib/baas/config';

const NAV = [
  { href: '/ops', label: 'Cola' },
  { href: '/ops/lotes', label: 'Lotes' },
  { href: '/ops/pos', label: 'POS TUU' },
  { href: '/ops/terminales', label: 'Conexión y KYC' },
  { href: '/ops/mapa', label: 'Capas y mapa' },
  { href: '/ops/open-banking', label: 'Open Banking' },
  { href: '/ops/onboarding', label: 'Onboarding' },
  { href: '/ops/config', label: 'Config' },
];

export default function ConfigPage() {
  const [data, setData] = useState(null);
  const [supabase, setSupabase] = useState(null);

  useEffect(() => {
    fetch('/api/baas/dashboard').then((r) => r.json()).then(setData);
    fetch('/api/supabase/health').then((r) => r.json()).then((json) => setSupabase(json.supabase || null));
  }, []);

  const mode = data?.dlocal?.mode || 'simulator';
  const modeTone = mode === 'live' ? 'ok' : mode === 'sandbox' ? 'info' : 'warn';
  const platMode = data?.platforms?.mode || 'simulator';
  const platTone = platMode === 'live' ? 'ok' : platMode === 'sandbox' ? 'info' : 'warn';
  const env = data?.entornos;
  const pruebaGoOk = env?.prueba?.go?.configured;
  const pruebaPlatOk = env?.prueba?.platforms?.configured;
  const liveGoOk = env?.produccion?.go?.configured;
  const livePlatOk = env?.produccion?.platforms?.configured;
  let supaTone = 'info';
  let supaLabel = '…';
  if (supabase) {
    if (supabase.reachable) {
      supaTone = 'ok';
      supaLabel = `Responde ${supabase.status}`;
    } else if (supabase.configured) {
      supaTone = 'warn';
      supaLabel = 'Sin respuesta';
    } else {
      supaTone = 'bad';
      supaLabel = 'No';
    }
  }
  const apiText = supabase == null ? '…' : supabase.reachable ? `Responde ${supabase.status}` : 'Sin respuesta desde este servidor';

  return (
    <BaasShell title="Configuración" subtitle="Rail SICR3P → TUU → lote → dLocal Go + Platforms. Entorno prueba (sandbox) y producción separados." nav={NAV} user={data?.usuario}>
      <div className="baas-status-grid">
        <article className="baas-panel">
          <div className="baas-panel-head">
            <div>
              <p className="eyebrow">Activo ahora</p>
              <h2>dLocal Go</h2>
            </div>
            <span className={`baas-pill ${modeTone}`}>{data?.dlocal?.label || mode}</span>
          </div>
          <div className="baas-figure">
            <span className="lbl">Saldo merchant sim</span>
            <strong>{formatClp(data?.dlocal?.balance)}</strong>
          </div>
          <dl className="baas-kv">
            <div><dt>Modo</dt><dd className="mono">{mode}</dd></div>
            <div><dt>Base URL</dt><dd className="mono">{data?.dlocal?.base || '— (simulator)'}</dd></div>
            <div><dt>Credenciales activas</dt><dd>{data?.dlocal?.configured ? 'Listas' : 'Faltan'}</dd></div>
            <div><dt>Webhook</dt><dd className="mono">POST /api/baas/webhooks/dlocal</dd></div>
            <div><dt>TUU</dt><dd className="mono">mock InterApp</dd></div>
            <div>
              <dt>HubSpot</dt>
              <dd className="mono">{data?.hubspot?.configured ? `live · ${data.hubspot.mode}` : 'simulator (sin token)'}</dd>
            </div>
          </dl>
        </article>
        <article className="baas-panel">
          <div className="baas-panel-head">
            <div>
              <p className="eyebrow">Activo ahora</p>
              <h2>dLocal Platforms</h2>
            </div>
            <span className={`baas-pill ${platTone}`}>{data?.platforms?.label || platMode}</span>
          </div>
          <dl className="baas-kv">
            <div><dt>Modo</dt><dd className="mono">{platMode}</dd></div>
            <div><dt>Base URL</dt><dd className="mono">{data?.platforms?.base || '— (simulator)'}</dd></div>
            <div><dt>Credenciales</dt><dd>{data?.platforms?.configured ? 'Listas' : 'Simulator / faltan'}</dd></div>
            <div><dt>UI</dt><dd className="mono"><Link href="/ops/onboarding">/ops/onboarding</Link></dd></div>
            <div><dt>Webhook</dt><dd className="mono">POST /api/baas/webhooks/dlocal-platforms</dd></div>
          </dl>
        </article>
      </div>
      <div className="baas-status-grid">
        <article className="baas-panel">
          <div className="baas-panel-head">
            <div>
              <p className="eyebrow">Slot</p>
              <h2>Entorno prueba</h2>
            </div>
            <span className={`baas-pill ${pruebaGoOk || pruebaPlatOk ? 'info' : 'warn'}`}>sandbox</span>
          </div>
          <p className="sub">API sandbox dLocal. Validá aquí antes de live. Vars: DLOCAL_SANDBOX_* y DLOCAL_PLATFORMS_SANDBOX_*.</p>
          <dl className="baas-kv">
            <div><dt>Go</dt><dd>{pruebaGoOk ? 'Credenciales listas' : 'Faltan DLOCAL_SANDBOX_*'}</dd></div>
            <div><dt>Go URL</dt><dd className="mono">{env?.prueba?.go?.base || 'https://api-sbx.dlocalgo.com'}</dd></div>
            <div><dt>Platforms</dt><dd>{pruebaPlatOk ? 'Credenciales listas' : 'Faltan DLOCAL_PLATFORMS_SANDBOX_*'}</dd></div>
            <div><dt>Platforms URL</dt><dd className="mono">{env?.prueba?.platforms?.base || 'https://marketplace-api.dlocal-sbox.com'}</dd></div>
            <div><dt>Activar</dt><dd className="mono">DLOCAL_MODE=sandbox · DLOCAL_PLATFORMS_MODE=sandbox</dd></div>
          </dl>
        </article>
        <article className="baas-panel">
          <div className="baas-panel-head">
            <div>
              <p className="eyebrow">Slot</p>
              <h2>Producción</h2>
            </div>
            <span className={`baas-pill ${liveGoOk || livePlatOk ? 'ok' : 'warn'}`}>live</span>
          </div>
          <p className="sub">Solo después de validar sandbox. Vars: DLOCAL_LIVE_* y DLOCAL_PLATFORMS_LIVE_*.</p>
          <dl className="baas-kv">
            <div><dt>Go</dt><dd>{liveGoOk ? 'Credenciales listas' : 'Faltan DLOCAL_LIVE_*'}</dd></div>
            <div><dt>Go URL</dt><dd className="mono">{env?.produccion?.go?.base || 'https://api.dlocalgo.com'}</dd></div>
            <div><dt>Platforms</dt><dd>{livePlatOk ? 'Credenciales listas' : 'Faltan DLOCAL_PLATFORMS_LIVE_*'}</dd></div>
            <div><dt>Platforms URL</dt><dd className="mono">{env?.produccion?.platforms?.base || 'https://marketplace-api.dlocal.com'}</dd></div>
            <div><dt>Activar</dt><dd className="mono">DLOCAL_MODE=live · DLOCAL_PLATFORMS_MODE=live</dd></div>
          </dl>
        </article>
      </div>
      {env?.recomendacion ? (
        <p className="baas-alert info" style={{ marginBottom: 16 }}>{env.recomendacion}</p>
      ) : null}
      <div className="baas-status-grid">
        <article className="baas-panel">
          <div className="baas-panel-head">
            <h2>Supabase (VPS)</h2>
            <span className={`baas-pill ${supaTone}`}>{supaLabel}</span>
          </div>
          <p className="sub">URL pública https://sicr3p.cl. Postgres solo en 127.0.0.1:5432 dentro del Cloud Server.</p>
          <dl className="baas-kv">
            <div><dt>Host</dt><dd className="mono">{supabase?.host || 'sicr3p.cl'}</dd></div>
            <div><dt>Configurado</dt><dd>{supabase == null ? '…' : supabase.configured ? 'Sí' : 'No'}</dd></div>
            <div><dt>API</dt><dd>{apiText}</dd></div>
            <div><dt>Detalle</dt><dd className="mono">{supabase?.detail || '—'}</dd></div>
          </dl>
        </article>
        <article className="baas-panel">
          <div className="baas-panel-head">
            <h2>Correo Ferozo</h2>
            <span className="baas-pill info">DNS</span>
          </div>
          <p className="sub">El A del VPS no debe borrar los MX. Casilla y webmail siguen en DonWeb.</p>
          <dl className="baas-kv">
            <div><dt>Contacto app</dt><dd className="mono">{data?.mail?.contact || BAAS_LEGAL.email}</dd></div>
            <div><dt>Teléfono</dt><dd className="mono">{data?.mail?.phone || BAAS_LEGAL.telefono}</dd></div>
            <div><dt>Webmail</dt><dd className="mono"><a href="https://ferozo.email" target="_blank" rel="noreferrer">ferozo.email</a></dd></div>
            <div><dt>Guía</dt><dd className="mono">docs/dns-vps-correo.md</dd></div>
          </dl>
        </article>
      </div>
      <div className="baas-status-grid">
        <article className="baas-panel">
          <h2>Comercio</h2>
          <p className="baas-lead">{BAAS_LEGAL.razonSocial}</p>
          <p className="sub">RUT {BAAS_LEGAL.rut}</p>
          <p className="sub"><a href={`mailto:${BAAS_LEGAL.email}`}>{BAAS_LEGAL.email}</a></p>
          <h2 className="baas-h">Corredores payout</h2>
          <ul className="baas-corridors">
            {DLOCAL_PAYOUT_COUNTRIES.map((c) => (
              <li key={c.code}>{c.code} — {c.name} ({c.currency})</li>
            ))}
          </ul>
        </article>
        <article className="baas-panel">
          <h2>Documentación interna</h2>
          <p className="sub">
            Ver <code>docs/baas-architecture.md</code>, <code>docs/dns-vps-correo.md</code>,{' '}
            <code>docs/open-banking.md</code>, <code>docs/tuu-partner-checklist.md</code> y{' '}
            <Link href="/docs/open-banking">docs web OB</Link>.
          </p>
        </article>
      </div>
    </BaasShell>
  );
}
