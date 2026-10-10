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
    <BaasShell title="Configuración" subtitle="Rail SICR3P → TUU → lote → dLocal Go. Sin Global66." nav={NAV} user={data?.usuario}>
      <div className="baas-status-grid">
        <article className="baas-panel">
          <div className="baas-panel-head">
            <div>
              <p className="eyebrow">Entorno</p>
              <h2>dLocal</h2>
            </div>
            <span className={`baas-pill ${modeTone}`}>{mode}</span>
          </div>
          <div className="baas-figure">
            <span className="lbl">Saldo merchant sim</span>
            <strong>{formatClp(data?.dlocal?.balance)}</strong>
          </div>
          <dl className="baas-kv">
            <div><dt>DLOCAL_MODE</dt><dd className="mono">{mode}</dd></div>
            <div><dt>Webhook</dt><dd className="mono">POST /api/baas/webhooks/dlocal</dd></div>
            <div><dt>Onboarding Platforms</dt><dd className="mono">/ops/onboarding · POST /api/baas/webhooks/dlocal-platforms</dd></div>
            <div><dt>TUU</dt><dd className="mono">mock InterApp</dd></div>
            <div>
              <dt>HubSpot</dt>
              <dd className="mono">{data?.hubspot?.configured ? `live · ${data.hubspot.mode}` : 'simulator (sin token)'}</dd>
            </div>
          </dl>
        </article>
        <article className="baas-panel">
          <div className="baas-panel-head">
            <h2>Supabase</h2>
            <span className={`baas-pill ${supaTone}`}>{supaLabel}</span>
          </div>
          <p className="sub">Studio en {supabase?.host || 'vps-6495918-x.dattaweb.com'}. La app usa la URL https y la anon key. Postgres en 127.0.0.1:5432 queda dentro del VPS.</p>
          <dl className="baas-kv">
            <div><dt>Configurado</dt><dd>{supabase == null ? '…' : supabase.configured ? 'Sí' : 'No'}</dd></div>
            <div><dt>API</dt><dd>{apiText}</dd></div>
            <div><dt>Detalle</dt><dd className="mono">{supabase?.detail || '—'}</dd></div>
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
            Ver <code>docs/baas-architecture.md</code>, <code>docs/open-banking.md</code>,{' '}
            <code>docs/tuu-partner-checklist.md</code> y <Link href="/docs/open-banking">docs web OB</Link>.
          </p>
        </article>
      </div>
    </BaasShell>
  );
}
