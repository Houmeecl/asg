'use client';

import { useCallback, useEffect, useState } from 'react';
import BaasShell, { StatusPill } from '../../components/BaasShell';

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

const ROLES = [
  ['vendedor', 'Vendedor'],
  ['prestador', 'Prestador'],
  ['contratista', 'Contratista'],
  ['submerchant', 'Submerchant'],
];

const EMPTY = {
  rol: 'vendedor',
  tax_category: 'individual',
  account_name: '',
  account_email: '',
  tax_id: '',
  document_number: '',
  phone: '',
  city: 'Antofagasta',
  address: '',
  zip_code: '1240000',
  is_pep: false,
  is_so: false,
  consent_data: false,
  consent_terms: false,
  consent_contract: false,
  consent_funds: false,
  registered_name: '',
  date_of_incorporation: '',
  rep_name: '',
  ubo_name: '',
  ownership_percentage: '100',
  pricing_level: 'type_1',
  settlement_period: '7',
};

function Field({ label, children }) {
  return (
    <div className="baas-field">
      <label>{label}</label>
      {children}
    </div>
  );
}

export default function OnboardingPage() {
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [platformForm, setPlatformForm] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [kycName, setKycName] = useState('copy_of_id_front');
  const [fileLabel, setFileLabel] = useState('');
  const [settings, setSettings] = useState({ pricing_level: 'type_1', settlement_period: '7' });

  const load = useCallback(() => {
    fetch('/api/baas/onboarding').then((r) => r.json()).then((json) => {
      setData(json);
      setPlatformForm((prev) => prev || (json.platform ? {
        account_id: json.platform.account_id,
        platform_type: json.platform.platform_type,
        legal_name: json.platform.legal_name,
        country: json.platform.country,
        pricing_level: json.platform.pricing_level,
        settlement_period: String(json.platform.settlement_period),
      } : null));
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const cuentas = data?.cuentas || [];
  const selected = cuentas.find((c) => c.id === selectedId) || cuentas[0] || null;
  const enRevision = selected?.status_detail === 'compliance_review' || selected?.status_detail === 'pending_compliance_review';

  useEffect(() => {
    if (!selected) return;
    setSettings({
      pricing_level: selected.pricing_level || 'type_1',
      settlement_period: String(selected.settlement_period || 7),
    });
    if (selected.requeridos?.length && !selected.requeridos.includes(kycName) && !selected.files.some((f) => f.file_name === kycName)) {
      setKycName(selected.requeridos[0]);
    }
  }, [selected?.id]);

  async function post(body, okText) {
    setErr(null);
    setMsg(null);
    const res = await fetch('/api/baas/onboarding', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      setErr(json.error || 'No se pudo completar');
      return null;
    }
    setData(json);
    setMsg(okText);
    return json;
  }

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function crear(event) {
    event.preventDefault();
    const json = await post({ action: 'crear', ...form }, 'User account creada. Sigue en documentation hasta cargar el KYC.');
    if (json?.cuenta) setSelectedId(json.cuenta.id);
  }

  return (
    <BaasShell
      title="Onboarding dLocal"
      subtitle="Cuenta Platform de SICR3P y user accounts. El cobro y el payout se habilitan recién con status APPROVED."
      nav={NAV}
      user={data?.usuario}
    >
      <div className="baas-steps">
        {(data?.pasos || []).map((paso) => (
          <div className="baas-step" key={paso.n}>
            <b><span className="n">{paso.n}</span>{paso.titulo}</b>
            <span>{paso.detalle}</span>
          </div>
        ))}
      </div>

      {msg ? <div className="baas-alert ok">{msg}</div> : null}
      {err ? <div className="baas-alert err">{err}</div> : null}

      <div className="baas-panel">
        <div className="baas-panel-head">
          <h2>Cuenta Platform · {data?.platform?.country || 'CL'}</h2>
          <span className={`baas-pill ${data?.mode === 'live' ? 'ok' : data?.mode === 'sandbox' ? 'info' : 'warn'}`}>{data?.mode || 'simulator'}</span>
        </div>
        <p className="sub">La abre dLocal con la entidad. Este registro guarda el account ID y el platform type que después heredan las user accounts. Modo {data?.mode || 'simulator'}.</p>
        {platformForm ? (
          <form
            className="baas-form"
            onSubmit={(event) => {
              event.preventDefault();
              post({ action: 'guardar_platform', ...platformForm }, 'Cuenta Platform actualizada.');
            }}
          >
            <div className="baas-fields">
              <Field label="Account ID">
                <input value={platformForm.account_id} onChange={(e) => setPlatformForm({ ...platformForm, account_id: e.target.value })} />
              </Field>
              <Field label="Platform type">
                <input value={platformForm.platform_type} onChange={(e) => setPlatformForm({ ...platformForm, platform_type: e.target.value })} />
              </Field>
              <Field label="Razón social">
                <input value={platformForm.legal_name} onChange={(e) => setPlatformForm({ ...platformForm, legal_name: e.target.value })} />
              </Field>
              <Field label="País">
                <input value={platformForm.country} onChange={(e) => setPlatformForm({ ...platformForm, country: e.target.value })} maxLength={2} />
              </Field>
              <Field label="Pricing level">
                <input value={platformForm.pricing_level} onChange={(e) => setPlatformForm({ ...platformForm, pricing_level: e.target.value })} />
              </Field>
              <Field label="Liquidación (días)">
                <input value={platformForm.settlement_period} onChange={(e) => setPlatformForm({ ...platformForm, settlement_period: e.target.value })} />
              </Field>
            </div>
            <div className="baas-notes">
              <p className="sub">{data?.platform?.fee_note}</p>
              <p className="sub">Webhook de estados: {data?.notification_url}</p>
            </div>
            <div className="baas-form-actions">
              <button className="baas-btn sm" type="submit">Guardar cuenta Platform</button>
            </div>
          </form>
        ) : null}
      </div>

      <div className="baas-split">
        <form className="baas-panel baas-form" onSubmit={crear}>
          <h2>Nueva user account</h2>
          <div className="baas-fields">
            <Field label="Rol en la plataforma">
              <select value={form.rol} onChange={(e) => set('rol', e.target.value)}>
                {ROLES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </select>
            </Field>
            <Field label="Tipo">
              <select value={form.tax_category} onChange={(e) => set('tax_category', e.target.value)}>
                <option value="individual">Persona natural</option>
                <option value="company">Empresa</option>
              </select>
            </Field>
            <Field label="Nombre de la cuenta">
              <input value={form.account_name} onChange={(e) => set('account_name', e.target.value)} required />
            </Field>
            <Field label="Email">
              <input type="email" value={form.account_email} onChange={(e) => set('account_email', e.target.value)} required />
            </Field>
            <Field label="RUT">
              <input value={form.tax_id} onChange={(e) => set('tax_id', e.target.value)} required />
            </Field>
            <Field label="Número de documento">
              <input value={form.document_number} onChange={(e) => set('document_number', e.target.value)} placeholder="Si es el mismo RUT, se usa ese" />
            </Field>
            <Field label="Teléfono">
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+56912345678" required />
            </Field>
            <Field label="Ciudad">
              <input value={form.city} onChange={(e) => set('city', e.target.value)} required />
            </Field>
            <div className="baas-span">
              <Field label="Dirección">
                <input value={form.address} onChange={(e) => set('address', e.target.value)} required />
              </Field>
            </div>
          </div>
          <div className="baas-choices">
            <label className="baas-choice"><input type="checkbox" checked={form.is_pep} onChange={(e) => set('is_pep', e.target.checked)} /> PEP</label>
            <label className="baas-choice"><input type="checkbox" checked={form.is_so} onChange={(e) => set('is_so', e.target.checked)} /> Sujeto obligado</label>
          </div>
          {form.tax_category === 'company' ? (
            <div className="baas-fields">
              <div className="baas-span">
                <Field label="Razón social">
                  <input value={form.registered_name} onChange={(e) => set('registered_name', e.target.value)} />
                </Field>
              </div>
              <Field label="Constitución">
                <input type="date" value={form.date_of_incorporation} onChange={(e) => set('date_of_incorporation', e.target.value)} />
              </Field>
              <Field label="Representante legal">
                <input value={form.rep_name} onChange={(e) => set('rep_name', e.target.value)} />
              </Field>
              <Field label="UBO">
                <input value={form.ubo_name} onChange={(e) => set('ubo_name', e.target.value)} />
              </Field>
              <Field label="% propiedad UBO">
                <input value={form.ownership_percentage} onChange={(e) => set('ownership_percentage', e.target.value)} />
              </Field>
            </div>
          ) : null}
          <div className="baas-choices">
            <label className="baas-choice"><input type="checkbox" checked={form.consent_data} onChange={(e) => set('consent_data', e.target.checked)} /> Acepta recolección de datos</label>
            <label className="baas-choice"><input type="checkbox" checked={form.consent_terms} onChange={(e) => set('consent_terms', e.target.checked)} /> Acepta términos</label>
            {form.tax_category === 'company' ? (
              <>
                <label className="baas-choice"><input type="checkbox" checked={form.consent_contract} onChange={(e) => set('consent_contract', e.target.checked)} /> Efectos contractuales</label>
                <label className="baas-choice"><input type="checkbox" checked={form.consent_funds} onChange={(e) => set('consent_funds', e.target.checked)} /> Declaración de fondos</label>
              </>
            ) : null}
          </div>
          <div className="baas-form-actions">
            <button className="baas-btn" type="submit">Crear user account</button>
          </div>
        </form>

        <div className="baas-panel baas-sticky">
          <div className="baas-panel-head">
            <h2>Cuentas · {cuentas.length}</h2>
          </div>
          <p className="sub">Aprobadas para operar: {data?.operables || 0}</p>
          <div className="baas-scroll">
            <table className="baas-tbl">
              <thead>
                <tr><th>Nombre</th><th>Rol</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {cuentas.map((cuenta) => (
                  <tr
                    key={cuenta.id}
                    onClick={() => setSelectedId(cuenta.id)}
                    className={selected?.id === cuenta.id ? 'is-selected' : undefined}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{cuenta.account_name}<div className="sub">{cuenta.tax_id}</div></td>
                    <td>{cuenta.rol}</td>
                    <td><StatusPill estado={cuenta.status} /></td>
                  </tr>
                ))}
                {!cuentas.length ? <tr><td colSpan={3}>Todavía no hay user accounts.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected ? (
        <div className="baas-panel">
          <div className="baas-panel-head">
            <h2>{selected.account_name}</h2>
            <StatusPill estado={selected.status} />
          </div>
          <p className="baas-meta-line">
            {selected.account_id} · {selected.status_detail} ({selected.status_code}) · ref {selected.external_reference}
          </p>
          <ul className="baas-caps">
            <li><span>Pay-ins</span><b className={selected.capacidades.payins ? 'is-on' : 'is-off'}>{selected.capacidades.payins ? 'Habilitado' : 'Bloqueado'}</b></li>
            <li><span>Payouts</span><b className={selected.capacidades.payouts ? 'is-on' : 'is-off'}>{selected.capacidades.payouts ? 'Habilitado' : 'Bloqueado'}</b></li>
            <li><span>Liquidación</span><b className={selected.capacidades.settlements ? 'is-on' : 'is-off'}>{selected.capacidades.settlements ? 'Habilitada' : 'Bloqueada'}</b></li>
            <li><span>Reembolsos</span><b className={selected.capacidades.refunds ? 'is-on' : 'is-off'}>{selected.capacidades.refunds ? 'Habilitados' : 'Bloqueados'}</b></li>
          </ul>
          {!selected.capacidades.operable ? (
            <div className="baas-alert info">Esta cuenta todavía no puede cobrar ni pagar. dLocal pide status APPROVED.</div>
          ) : (
            <div className="baas-alert ok">APPROVED. Ya puede cobrar, pagar, liquidar y reembolsar.</div>
          )}

          <h2>Documentos</h2>
          <ul className="baas-docs">
            {selected.requeridos.map((name) => {
              const loaded = selected.files.some((f) => f.file_name === name);
              return (
                <li key={name}>
                  <span className="mono">{name}</span>
                  <span className={`baas-pill ${loaded ? 'ok' : 'warn'}`}>{loaded ? 'Cargado' : 'Falta'}</span>
                </li>
              );
            })}
          </ul>
          <form
            className="baas-form"
            onSubmit={async (event) => {
              event.preventDefault();
              const json = await post({
                action: 'subir_kyc',
                id: selected.id,
                file_name: kycName,
                original_name: fileLabel,
              }, 'Documento registrado.');
              if (json?.cuenta) setSelectedId(json.cuenta.id);
              setFileLabel('');
            }}
          >
            <div className="baas-fields">
              <Field label="Archivo dLocal">
                <select value={kycName} onChange={(e) => setKycName(e.target.value)}>
                  {[...new Set([...(selected.requeridos || []), ...selected.files.map((f) => f.file_name), 'proof_of_address', 'tax_id'])].map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Nombre original">
                <input value={fileLabel} onChange={(e) => setFileLabel(e.target.value)} placeholder="cedula-frente.pdf" />
              </Field>
            </div>
            <div className="baas-form-actions">
              <button className="baas-btn sm" type="submit" disabled={!selected.puede_actualizar}>Subir documento</button>
            </div>
          </form>

          <h2 className="baas-h">Configuración de la cuenta</h2>
          <form
            className="baas-form"
            onSubmit={async (event) => {
              event.preventDefault();
              await post({ action: 'settings', id: selected.id, ...settings }, 'Pricing y plazo actualizados.');
            }}
          >
            <div className="baas-fields">
              <Field label="Pricing level">
                <input value={settings.pricing_level} onChange={(e) => setSettings({ ...settings, pricing_level: e.target.value })} />
              </Field>
              <Field label="Liquidación (días)">
                <input value={settings.settlement_period} onChange={(e) => setSettings({ ...settings, settlement_period: e.target.value })} />
              </Field>
            </div>
            <div className="baas-form-actions">
              <button className="baas-btn sm ghost" type="submit" disabled={!selected.puede_actualizar}>Guardar configuración</button>
            </div>
          </form>

          {data?.mode === 'simulator' ? (
            <div className="baas-toolbar">
              <button className="baas-btn sm" type="button" disabled={!enRevision} onClick={() => post({ action: 'revisar', id: selected.id, decision: 'aprobar' }, 'dLocal aprobó la cuenta.')}>Simular aprobación</button>
              <button className="baas-btn sm ghost" type="button" disabled={!enRevision} onClick={() => post({ action: 'revisar', id: selected.id, decision: 'pedir_documentos' }, 'dLocal pidió más documentos.')}>Pedir documentos</button>
              <button className="baas-btn sm danger" type="button" disabled={!enRevision} onClick={() => post({ action: 'revisar', id: selected.id, decision: 'rechazar' }, 'dLocal rechazó la cuenta.')}>Rechazar</button>
              <button className="baas-btn sm danger" type="button" disabled={selected.status === 'CANCELED' || selected.status === 'REJECTED'} onClick={() => post({ action: 'bloquear', id: selected.id }, 'Cuenta bloqueada.')}>Bloquear</button>
            </div>
          ) : null}

          <h2 className="baas-h">Notificaciones</h2>
          <div className="baas-scroll">
            <table className="baas-tbl">
              <thead><tr><th>Tipo</th><th>Estado</th><th>Detalle</th></tr></thead>
              <tbody>
                {(data?.eventos || []).filter((e) => e.account_row_id === selected.id).map((e) => (
                  <tr key={e.id}>
                    <td>{e.tipo}</td>
                    <td>{e.status}</td>
                    <td>{e.detalle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </BaasShell>
  );
}
