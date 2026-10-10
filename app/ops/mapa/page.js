'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import BaasShell, { formatClp, StatusPill } from '../../components/BaasShell';

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

const CIUDADES = [
  { nombre: 'Antofagasta', lat: -23.65, lng: -70.4 },
  { nombre: 'Mejillones', lat: -23.1, lng: -70.45 },
  { nombre: 'Calama', lat: -22.46, lng: -68.93 },
];

const COLOR = { POS: '#7ac943', GPS: '#8ec5ff', IOT: '#f0b429' };

function project(lat, lng, bounds) {
  const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * 1000;
  const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * 640;
  return { x, y };
}

function radios(cerca, bounds) {
  const mLng = 111320 * Math.cos((cerca.lat * Math.PI) / 180);
  const dLng = cerca.radio_m / mLng;
  const dLat = cerca.radio_m / 111320;
  return {
    rx: (dLng / (bounds.east - bounds.west)) * 1000,
    ry: (dLat / (bounds.north - bounds.south)) * 640,
  };
}

export default function MapaCapasPage() {
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState(null);
  const [sel, setSel] = useState(null);
  const [vivo, setVivo] = useState(true);
  const [capas, setCapas] = useState({
    pos: true, gps: true, iot: true, geocercas: true, recorridos: true, cobros: true,
  });
  const [alta, setAlta] = useState({ tipo: 'GPS', alias: '', serial: '', lat: '-23.60', lng: '-70.35' });
  const [lectura, setLectura] = useState({ metrica: 'temperatura_c', valor: '' });

  const load = useCallback(() => {
    fetch('/api/baas/mapa').then((r) => r.json()).then(setData);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!vivo) return undefined;
    const id = setInterval(() => {
      fetch('/api/baas/mapa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'tick' }),
      }).then((r) => r.json()).then((json) => {
        if (json.unidades) setData((prev) => ({ ...prev, ...json, usuario: prev?.usuario }));
      });
    }, 7000);
    return () => clearInterval(id);
  }, [vivo]);

  async function act(body) {
    setMsg(null);
    const res = await fetch('/api/baas/mapa', {
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
    setMsg({ ok: true, text: 'Listo' });
  }

  const bounds = data?.bounds;
  const unidades = data?.unidades || [];
  const visible = unidades.filter((u) => {
    if (u.tipo === 'POS') return capas.pos;
    if (u.tipo === 'GPS') return capas.gps;
    return capas.iot;
  });
  const elegida = unidades.find((u) => u.id === sel) || null;
  const analisis = data?.analisis || {};
  const porTipo = Object.fromEntries((analisis.porTipo || []).map((r) => [r.tipo, r]));
  const kyc = Object.fromEntries((analisis.kyc || []).map((r) => [r.kyc_estado, r.n]));
  const montoCobros = (analisis.cobros || []).reduce((n, r) => n + r.monto, 0);

  const ciudades = useMemo(() => (bounds ? CIUDADES.map((c) => ({ ...c, ...project(c.lat, c.lng, bounds) })) : []), [bounds]);

  function toggle(id) {
    setCapas((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <BaasShell
      title="Capas territoriales"
      subtitle="Análisis de POS, usuarios y cobros sobre la red M2M: terminales, GPS e IoT en el mismo mapa, con recorridos y geocercas."
      nav={NAV}
      user={data?.usuario}
    >
      <div className="baas-kpis">
        <div className="baas-kpi"><div className="lbl">POS en red</div><div className="val">{porTipo.POS?.n || 0}</div><div className="hint">{porTipo.POS?.conectadas || 0} conectados</div></div>
        <div className="baas-kpi"><div className="lbl">GPS</div><div className="val">{porTipo.GPS?.n || 0}</div><div className="hint">{porTipo.GPS?.alertas || 0} en alerta</div></div>
        <div className="baas-kpi"><div className="lbl">Sensores IoT</div><div className="val">{porTipo.IOT?.n || 0}</div><div className="hint">{analisis.lecturas || 0} lecturas</div></div>
        <div className="baas-kpi"><div className="lbl">KYC aprobados</div><div className="val">{kyc.APROBADO || 0}</div><div className="hint">{formatClp(montoCobros)} en cobros</div></div>
      </div>
      {msg ? <p className="sub" style={{ color: msg.ok ? '#067647' : '#b42318' }}>{msg.text}</p> : null}

      <div className="baas-capas">
        <div className="baas-panel">
          <h2>Capas</h2>
          {[
            ['pos', 'POS M2M'],
            ['gps', 'GPS'],
            ['iot', 'Sensores IoT'],
            ['geocercas', 'Geocercas'],
            ['recorridos', 'Recorridos'],
            ['cobros', 'Cobros y KYC'],
          ].map(([id, label]) => (
            <label key={id} className="baas-layer">
              <input type="checkbox" checked={capas[id]} onChange={() => toggle(id)} />
              {label}
            </label>
          ))}
          <label className="baas-layer">
            <input type="checkbox" checked={vivo} onChange={() => setVivo((v) => !v)} />
            Red en vivo
          </label>
          <h2 style={{ marginTop: 18 }}>Mensajes</h2>
          {(data?.mensajes || []).slice(0, 6).map((m) => (
            <div key={m.id} className="baas-msg">
              <strong>{m.alias}</strong>
              <div className="sub">{m.tipo} · {m.metrica} {m.valor} {m.detalle ? `· ${m.detalle}` : ''}</div>
            </div>
          ))}
          {!data?.mensajes?.length ? <p className="sub">La red aún no emite lecturas. Activá “Red en vivo”.</p> : null}
        </div>

        <div>
          <div className="baas-map" aria-label="Mapa territorial del norte grande">
            {bounds ? (
              <svg viewBox="0 0 1000 640" role="img">
                <rect width="1000" height="640" fill="#0e2430" />
                {Array.from({ length: 8 }).map((_, i) => (
                  <line key={`v${i}`} x1={i * 125} y1="0" x2={i * 125} y2="640" stroke="#1c3c4d" strokeWidth="1" />
                ))}
                {Array.from({ length: 6 }).map((_, i) => (
                  <line key={`h${i}`} x1="0" y1={i * 106} x2="1000" y2={i * 106} stroke="#1c3c4d" strokeWidth="1" />
                ))}
                {capas.geocercas ? (data?.geocercas || []).map((g) => {
                  const p = project(g.lat, g.lng, bounds);
                  const r = radios(g, bounds);
                  return (
                    <ellipse key={g.id} cx={p.x} cy={p.y} rx={r.rx} ry={r.ry} fill={g.color} fillOpacity="0.13" stroke={g.color} strokeWidth="1.5" />
                  );
                }) : null}
                {capas.recorridos ? Object.entries(data?.recorridos || {}).map(([id, pts]) => {
                  if (!capas.gps || pts.length < 2) return null;
                  const d = pts.map((p, i) => {
                    const q = project(p.lat, p.lng, bounds);
                    return `${i === 0 ? 'M' : 'L'}${q.x.toFixed(1)},${q.y.toFixed(1)}`;
                  }).join(' ');
                  return <path key={id} d={d} fill="none" stroke="#8ec5ff" strokeWidth="2" strokeOpacity="0.85" />;
                }) : null}
                {ciudades.map((c) => (
                  <text key={c.nombre} x={c.x + 8} y={c.y - 8} fill="#c5d7e0" fontSize="13">{c.nombre}</text>
                ))}
                {visible.map((u) => {
                  const p = project(u.lat, u.lng, bounds);
                  const fill = u.estado === 'ALERTA' ? '#ff6b6b' : COLOR[u.tipo];
                  const activo = sel === u.id;
                  return (
                    <g key={u.id} transform={`translate(${p.x},${p.y})`} style={{ cursor: 'pointer' }} onClick={() => setSel(u.id)}>
                      <title>{`${u.alias} · ${u.estado}`}</title>
                      {u.tipo === 'GPS' ? (
                        <polygon points="0,-12 6,7 -6,7" fill={fill} transform={`rotate(${u.rumbo || 0})`} stroke={activo ? '#fff' : 'none'} strokeWidth="1.5" />
                      ) : (
                        <circle r={activo ? 10 : 7} fill={fill} stroke={activo ? '#fff' : '#0e2430'} strokeWidth="2" />
                      )}
                      {activo ? (
                        <text y={-16} textAnchor="middle" fill="#fff" fontSize="13">{u.alias}</text>
                      ) : null}
                    </g>
                  );
                })}
              </svg>
            ) : <p className="sub" style={{ padding: 20 }}>Cargando red…</p>}
          </div>
          <div className="baas-legend">
            <span><i style={{ background: '#7ac943' }} />POS</span>
            <span><i style={{ background: '#8ec5ff' }} />GPS</span>
            <span><i style={{ background: '#f0b429' }} />IoT</span>
            <span><i style={{ background: '#ff6b6b' }} />Alerta</span>
          </div>
          {capas.cobros ? (
            <div className="baas-panel" style={{ marginTop: 12 }}>
              <h2>Capa cobros y KYC</h2>
              <p className="sub">Cobros y KYC de la operación, leídos junto a los POS que están en la red.</p>
              <table className="baas-tbl">
                <thead><tr><th>Estado cobro</th><th>Cantidad</th><th>Monto</th></tr></thead>
                <tbody>
                  {(analisis.cobros || []).map((r) => (
                    <tr key={r.estado}><td>{r.estado}</td><td>{r.n}</td><td>{formatClp(r.monto)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        <div>
          <div className="baas-panel">
            <h2>{elegida ? elegida.alias : 'Unidad'}</h2>
            {elegida ? (
              <>
                <p><StatusPill estado={elegida.estado} /> <span className="sub">{elegida.tipo} · {elegida.serial}</span></p>
                <p className="sub">{elegida.lat.toFixed(4)}, {elegida.lng.toFixed(4)}</p>
                <p className="sub">Batería {elegida.bateria ?? '—'}% · señal {elegida.senal ?? '—'}%</p>
                {elegida.tipo === 'GPS' ? <p className="sub">{elegida.velocidad_kmh} km/h · rumbo {Math.round(elegida.rumbo)}°</p> : null}
                <p className="sub">{elegida.metrica}: <strong>{elegida.valor}</strong></p>
                <span style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {elegida.estado === 'DESCONECTADO' ? (
                    <button type="button" className="baas-btn sm" onClick={() => act({ action: 'conectar', id: elegida.id })}>Conectar</button>
                  ) : (
                    <button type="button" className="baas-btn ghost sm" onClick={() => act({ action: 'desconectar', id: elegida.id })}>Desconectar</button>
                  )}
                </span>
                {elegida.tipo === 'IOT' ? (
                  <form
                    className="baas-form"
                    style={{ marginTop: 14 }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      act({ action: 'capturar', id: elegida.id, ...lectura });
                    }}
                  >
                    <h2>Capturar IoT</h2>
                    <div className="baas-field">
                      <label>Métrica</label>
                      <select value={lectura.metrica} onChange={(e) => setLectura({ ...lectura, metrica: e.target.value })}>
                        <option value="temperatura_c">Temperatura °C</option>
                        <option value="humedad_pct">Humedad %</option>
                        <option value="voltaje">Voltaje</option>
                      </select>
                    </div>
                    <div className="baas-field">
                      <label>Valor</label>
                      <input required value={lectura.valor} onChange={(e) => setLectura({ ...lectura, valor: e.target.value })} />
                    </div>
                    <button className="baas-btn sm" type="submit">Guardar lectura</button>
                  </form>
                ) : null}
              </>
            ) : <p className="sub">Elegí un POS, un GPS o un sensor en el mapa.</p>}
          </div>
          <form
            className="baas-panel baas-form"
            onSubmit={(e) => {
              e.preventDefault();
              act({ action: 'registrar', ...alta });
            }}
          >
            <h2>Agregar M2M</h2>
            <div className="baas-field">
              <label>Tipo</label>
              <select value={alta.tipo} onChange={(e) => setAlta({ ...alta, tipo: e.target.value })}>
                <option value="POS">POS</option>
                <option value="GPS">GPS</option>
                <option value="IOT">IoT</option>
              </select>
            </div>
            <div className="baas-field"><label>Alias</label><input required value={alta.alias} onChange={(e) => setAlta({ ...alta, alias: e.target.value })} /></div>
            <div className="baas-field"><label>Serial</label><input required value={alta.serial} onChange={(e) => setAlta({ ...alta, serial: e.target.value })} /></div>
            <div className="baas-field"><label>Latitud</label><input required value={alta.lat} onChange={(e) => setAlta({ ...alta, lat: e.target.value })} /></div>
            <div className="baas-field"><label>Longitud</label><input required value={alta.lng} onChange={(e) => setAlta({ ...alta, lng: e.target.value })} /></div>
            <button className="baas-btn" type="submit">Sumar a la red</button>
          </form>
        </div>
      </div>
    </BaasShell>
  );
}
