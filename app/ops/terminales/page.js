'use client';

import { useCallback, useEffect, useState } from 'react';
import BaasShell, { formatClp, StatusPill } from '../../components/BaasShell';

const NAV = [
  { href: '/ops', label: 'Cola' },
  { href: '/ops/lotes', label: 'Lotes' },
  { href: '/ops/pos', label: 'POS TUU' },
  { href: '/ops/terminales', label: 'Conexión y KYC' },
  { href: '/ops/mapa', label: 'Capas y mapa' },
  { href: '/ops/open-banking', label: 'Open Banking' },
  { href: '/ops/config', label: 'Config' },
];

function mensajeAccion(body, json) {
  if (body.action === 'iniciar_preregistro') {
    if (json.registro?.registroPath) return `Enlace de preregistro: ${json.registro.registroPath}`;
    if (json.registro?.status === 'READY') return 'Ese RUT ya tiene wallet aprobada.';
  }
  if (body.action === 'crear_usuario') {
    return json.existed ? 'El usuario ya existía y quedó aprobado con wallet.' : 'Usuario creado, aprobado y con wallet virtual.';
  }
  if (body.action === 'aprobar') return `KYC aprobado · ${json.wallet?.wallet_id || 'wallet lista'}`;
  if (body.action === 'rechazar') return 'Preregistro rechazado.';
  if (body.action === 'registrar_terminal') return `Terminal ${json.terminal?.alias || ''} registrada.`;
  if (body.action === 'conectar') return 'Terminal conectada.';
  if (body.action === 'desconectar') return 'Terminal desconectada.';
  if (body.action === 'prueba') return 'Terminal en prueba.';
  return 'Listo';
}

const TABS = [
  { id: 'conexion', label: 'Conexión POS' },
  { id: 'analisis', label: 'Análisis' },
  { id: 'kyc', label: 'Preregistro y KYC' },
];

export default function TerminalesPage() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('conexion');
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState({ alias: '', serial: '', modelo: 'SUNMI', comercioRut: '' });
  const [usuario, setUsuario] = useState({ rut: '', nombre: '', email: '', telefono: '' });
  const [prereg, setPrereg] = useState({ rut: '', nombre: '' });

  const load = useCallback(() => {
    fetch('/api/baas/pos-portal').then((r) => r.json()).then(setData);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function act(body) {
    setMsg(null);
    const res = await fetch('/api/baas/pos-portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      setMsg({ ok: false, text: json.error || 'No se pudo completar' });
      return;
    }
    setData((prev) => ({ ...prev, ...json, usuario: prev?.usuario }));
    const text = mensajeAccion(body, json);
    setMsg({ ok: true, text });
    if (body.action === 'crear_usuario') setUsuario({ rut: '', nombre: '', email: '', telefono: '' });
    if (body.action === 'iniciar_preregistro' && json.registro?.registroPath) setPrereg({ rut: '', nombre: '' });
  }

  const analisis = data?.analisis || {};
  const kycMap = Object.fromEntries((analisis.kyc || []).map((r) => [r.kyc_estado, r.n]));

  return (
    <BaasShell
      title="Portal POS"
      subtitle="Conexión de terminales, análisis de cobros y aprobación de preregistro KYC."
      nav={NAV}
      user={data?.usuario}
    >
      <div className="baas-tabs" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`baas-btn ${tab === t.id ? '' : 'ghost'}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {msg ? <p className="sub" style={{ color: msg.ok ? '#067647' : '#b42318' }}>{msg.text}</p> : null}

      {tab === 'conexion' ? (
        <div className="baas-grid-pos">
          <form
            className="baas-panel baas-form"
            onSubmit={(e) => {
              e.preventDefault();
              act({ action: 'registrar_terminal', ...form });
            }}
          >
            <h2>Registrar terminal</h2>
            <div className="baas-field">
              <label>Alias</label>
              <input required value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })} placeholder="Caja Antofagasta 1" />
            </div>
            <div className="baas-field">
              <label>Serial</label>
              <input required value={form.serial} onChange={(e) => setForm({ ...form, serial: e.target.value })} placeholder="SUNMI-P2-001" />
            </div>
            <div className="baas-field">
              <label>Modelo</label>
              <select value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })}>
                <option>SUNMI</option>
                <option>KOZEN</option>
              </select>
            </div>
            <div className="baas-field">
              <label>RUT comercio</label>
              <input value={form.comercioRut} onChange={(e) => setForm({ ...form, comercioRut: e.target.value })} />
            </div>
            <button className="baas-btn" type="submit">Guardar terminal</button>
          </form>
          <div className="baas-panel">
            <h2>Terminales</h2>
            <table className="baas-tbl">
              <thead>
                <tr><th>Alias</th><th>Serial</th><th>Estado</th><th></th></tr>
              </thead>
              <tbody>
                {(data?.terminales || []).map((t) => (
                  <tr key={t.id}>
                    <td>{t.alias}<div className="sub">{t.modelo}</div></td>
                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>{t.serial}</td>
                    <td><StatusPill estado={t.estado} /></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {t.estado === 'CONECTADO' ? (
                          <button type="button" className="baas-btn ghost sm" onClick={() => act({ action: 'desconectar', id: t.id })}>Desconectar</button>
                        ) : (
                          <button type="button" className="baas-btn sm" onClick={() => act({ action: 'conectar', id: t.id })}>Conectar</button>
                        )}
                        {t.estado !== 'EN_PRUEBA' ? (
                          <button type="button" className="baas-btn ghost sm" onClick={() => act({ action: 'prueba', id: t.id })}>Prueba</button>
                        ) : null}
                      </span>
                    </td>
                  </tr>
                ))}
                {!data?.terminales?.length ? <tr><td colSpan={4}>Aún no hay terminales.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === 'analisis' ? (
        <>
          <div className="baas-kpis">
            <div className="baas-kpi"><div className="lbl">POS conectados</div><div className="val">{analisis.terminalesConectadas ?? 0}/{analisis.terminalesTotal ?? 0}</div></div>
            <div className="baas-kpi"><div className="lbl">KYC en revisión</div><div className="val">{analisis.pendientesKyc ?? 0}</div></div>
            <div className="baas-kpi"><div className="lbl">Aprobados</div><div className="val">{kycMap.APROBADO || 0}</div></div>
            <div className="baas-kpi"><div className="lbl">Rechazados</div><div className="val">{kycMap.RECHAZADO || 0}</div></div>
          </div>
          <div className="baas-grid-analisis">
            <div className="baas-panel">
              <h2>Actividad reciente</h2>
              <table className="baas-tbl">
                <thead><tr><th>Código</th><th>Usuario</th><th>KYC</th><th>Monto</th></tr></thead>
                <tbody>
                  {(analisis.recientes || []).map((r) => (
                    <tr key={r.codigo}>
                      <td className="mono" style={{ whiteSpace: 'nowrap' }}>{r.codigo}</td>
                      <td>{r.nombre || '—'}<div className="sub">{r.rut}</div></td>
                      <td>{r.kyc_estado || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatClp(r.monto_clp)}</td>
                    </tr>
                  ))}
                  {!analisis.recientes?.length ? <tr><td colSpan={4}>Sin cobros todavía.</td></tr> : null}
                </tbody>
              </table>
            </div>
            <div className="baas-panel">
              <h2>Cobros por estado</h2>
              <table className="baas-tbl">
                <thead><tr><th>Estado</th><th>Cantidad</th><th>Monto</th></tr></thead>
                <tbody>
                  {(analisis.operaciones || []).map((r) => (
                    <tr key={r.estado}><td>{r.estado}</td><td>{r.n}</td><td>{formatClp(r.monto)}</td></tr>
                  ))}
                  {!analisis.operaciones?.length ? <tr><td colSpan={3}>Sin cobros todavía.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {tab === 'kyc' ? (
        <>
          <div className="baas-grid-2">
            <form
              className="baas-panel baas-form"
              onSubmit={(e) => {
                e.preventDefault();
                act({ action: 'crear_usuario', ...usuario });
              }}
            >
              <h2>Crear usuario</h2>
              <p className="sub">Alta directa del operador: queda aprobado y con wallet virtual. No es tarjeta prepago ni custodia de fondos.</p>
              <div className="baas-field"><label>RUT</label><input required value={usuario.rut} onChange={(e) => setUsuario({ ...usuario, rut: e.target.value })} placeholder="12.345.678-5" /></div>
              <div className="baas-field"><label>Nombre</label><input required value={usuario.nombre} onChange={(e) => setUsuario({ ...usuario, nombre: e.target.value })} /></div>
              <div className="baas-field"><label>Email</label><input type="email" value={usuario.email} onChange={(e) => setUsuario({ ...usuario, email: e.target.value })} /></div>
              <div className="baas-field"><label>Teléfono</label><input value={usuario.telefono} onChange={(e) => setUsuario({ ...usuario, telefono: e.target.value })} /></div>
              <button className="baas-btn" type="submit">Crear y aprobar</button>
            </form>
            <form
              className="baas-panel baas-form"
              onSubmit={(e) => {
                e.preventDefault();
                act({ action: 'iniciar_preregistro', ...prereg });
              }}
            >
              <h2>Abrir preregistro</h2>
              <p className="sub">Genera el enlace KYC. El titular lo envía y queda en revisión hasta que un operador aprueba o rechaza.</p>
              <div className="baas-field"><label>RUT</label><input required value={prereg.rut} onChange={(e) => setPrereg({ ...prereg, rut: e.target.value })} placeholder="16.789.012-3" /></div>
              <div className="baas-field"><label>Nombre (opcional)</label><input value={prereg.nombre} onChange={(e) => setPrereg({ ...prereg, nombre: e.target.value })} /></div>
              <button className="baas-btn dark" type="submit">Generar enlace</button>
            </form>
          </div>
          <div className="baas-panel" style={{ marginTop: 16 }}>
            <h2>Preregistros y usuarios</h2>
            <table className="baas-tbl">
              <thead><tr><th>Persona</th><th>Estado</th><th>Enlace o wallet</th></tr></thead>
              <tbody>
                {(data?.personas || []).map((p) => (
                  <tr key={p.id}>
                    <td>{p.nombre}<div className="sub">{p.rut} · {p.email || 'sin email'}</div></td>
                    <td><StatusPill estado={p.kyc_estado} /></td>
                    <td>
                      {p.kyc_estado === 'PENDIENTE' || p.kyc_estado === 'EN_REVISION' ? (
                        <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          {p.registro_token ? <span className="mono sub" style={{ wordBreak: 'break-all' }}>/registro/{p.registro_token}</span> : null}
                          <button type="button" className="baas-btn sm" onClick={() => act({ action: 'aprobar', personaId: p.id })}>Aprobar</button>
                          <button type="button" className="baas-btn ghost sm" onClick={() => act({ action: 'rechazar', personaId: p.id })}>Rechazar</button>
                        </span>
                      ) : (
                        <span className="mono">{p.wallet_id || '—'}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!data?.personas?.length ? <tr><td colSpan={3}>Aún no hay personas.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </BaasShell>
  );
}
