'use client';

import { useCallback, useEffect, useState } from 'react';
import { clp } from '../data';
import { AVISO_SIMULADO } from '../producto';

const inputCls = 'rounded-xl border border-[#0f1f2e]/15 bg-white px-3 py-2.5 text-sm w-full';
const labelCls = 'text-xs font-semibold uppercase tracking-wider text-[#0f1f2e]/60 flex flex-col gap-1.5';
const btn = 'rounded-full bg-[#0f1f2e] text-[#5ce08a] px-5 py-2.5 text-sm font-semibold hover:bg-[#1a3247] disabled:opacity-40';
const btnLight = 'rounded-full border border-[#0f1f2e]/30 px-4 py-1.5 text-xs font-semibold hover:bg-[#f4f7fa] disabled:opacity-40';
const SUB = [['contratos', 'Contratos'], ['liquidaciones', 'Liquidaciones'], ['oraculo', 'Oráculo y sensores']];

const badge = (estado) => ({
  ACEPTADA: 'bg-[#5ce08a]/50', CALCULADA: 'bg-[#5ce08a]/50', VIGENTE: 'bg-[#5ce08a]/50', PAGADA_EXTERNA: 'bg-[#5ce08a]/50',
  RECHAZADA: 'bg-red-100 text-red-800', EN_DISPUTA: 'bg-amber-100 text-amber-900', SIN_DATOS: 'bg-[#0f1f2e]/10',
}[estado] ?? 'bg-[#0f1f2e]/10');

async function llamar(cuerpo) {
  const r = await fetch('/api/seguros/admin/contratos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
  const j = await r.json().catch(() => null);
  return { ok: r.ok, j };
}

export default function ContratosPiloto() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [sub, setSub] = useState('contratos');

  const [version, setVersion] = useState(0);
  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let vigente = true;
    fetch('/api/seguros/admin/contratos')
      .then(async (r) => ({ ok: r.ok, j: await r.json().catch(() => null) }))
      .then(({ ok, j }) => {
        if (!vigente) return;
        if (ok) { setDatos(j); setError(''); } else setError(j?.error ?? 'Error al cargar.');
      })
      .catch(() => vigente && setError('No hay conexión con el servidor.'));
    return () => { vigente = false; };
  }, [version]);

  if (error) return <p role="alert" className="text-sm text-red-700 rounded-xl bg-red-50 px-4 py-3">{error}</p>;
  if (!datos) return <p className="text-sm text-[#0f1f2e]/60">Cargando…</p>;

  const { reserva } = datos;
  const real = Boolean(reserva.opinionLegalRef);

  return (
    <div className="flex flex-col gap-6">
      <div className={`rounded-2xl px-5 py-4 text-sm ${real ? 'bg-[#5ce08a]/30' : 'bg-amber-50 text-amber-950'}`}>
        <p className="font-semibold">{real ? `Modo REAL habilitado · opinión legal: ${reserva.opinionLegalRef}` : 'Solo modo SIMULACIÓN'}</p>
        <p className="mt-1">
          {real
            ? `Reserva declarada ${clp(reserva.declarada)} · exposición máxima de contratos reales ${clp(reserva.exposicionReal)} (${reserva.declarada ? Math.round((reserva.exposicionReal / reserva.declarada) * 100) : 0}%).`
            : 'Para crear contratos reales el servidor necesita OPINION_LEGAL_REF (referencia de la opinión legal escrita) y RESERVA_CLP. Sin eso, todo contrato se mide y liquida en simulación.'}
        </p>
      </div>

      <div className="flex gap-2" role="tablist">
        {SUB.map(([k, n]) => (
          <button key={k} role="tab" aria-selected={sub === k} onClick={() => setSub(k)}
            className={`px-4 py-2 rounded-full text-sm font-medium border ${sub === k ? 'bg-[#0f1f2e] text-[#5ce08a] border-[#0f1f2e]' : 'border-[#0f1f2e]/15 hover:border-[#0f1f2e]'}`}>{n}</button>
        ))}
      </div>

      {sub === 'contratos' && <Contratos datos={datos} real={real} recargar={recargar} />}
      {sub === 'liquidaciones' && <Liquidaciones datos={datos} recargar={recargar} />}
      {sub === 'oraculo' && <Oraculo datos={datos} recargar={recargar} />}
    </div>
  );
}

function Contratos({ datos, real, recargar }) {
  const ids = Object.keys(datos.indices);
  const [f, setF] = useState({ pyme: '', rut: '', exposicion: '', indiceId: ids[0], umbral: datos.indices[ids[0]].umbral, salida: datos.indices[ids[0]].salida, montoMax: 40_000_000, cargoMensual: 0, inicio: '', fin: '', modo: 'SIMULADO' });
  const [msg, setMsg] = useState(null); // { ok, texto }
  const [sug, setSug] = useState(null);
  const [liq, setLiq] = useState({});
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const indice = datos.indices[f.indiceId];

  function elegirIndice(id) {
    const i = datos.indices[id];
    setF((p) => ({ ...p, indiceId: id, umbral: i.umbral, salida: i.salida }));
    setSug(null);
  }

  async function sugerir() {
    const { ok, j } = await llamar({ accion: 'sugerir', indiceId: f.indiceId, umbral: Number(f.umbral), salida: Number(f.salida), montoMax: Number(f.montoMax) });
    setSug(ok ? j : { error: j?.error ?? 'No se pudo calcular.' });
  }

  async function crear(e) {
    e.preventDefault();
    setMsg(null);
    const { ok, j } = await llamar({ accion: 'crear', ...f, umbral: Number(f.umbral), salida: Number(f.salida), montoMax: Number(f.montoMax), cargoMensual: Number(f.cargoMensual) });
    setMsg({ ok, texto: ok ? `Contrato #${j.id} creado (${j.modo}).` : j?.error ?? 'No se pudo crear.' });
    if (ok) recargar();
  }

  async function liquidar(id) {
    const { ok, j } = await llamar({ accion: 'liquidar', contratoId: id, periodo: liq[id] });
    setMsg({ ok, texto: ok ? `Periodo ${j.periodo}: ${j.estado}${j.estado === 'CALCULADA' ? ` · valor ${j.valor} · ${clp(j.monto)}${j.simulado ? ' (simulado)' : ''}` : ''}` : j?.error ?? 'No se pudo liquidar.' });
    if (ok) recargar();
  }

  return (
    <div className="flex flex-col gap-6">
      {msg && <p role={msg.ok ? 'status' : 'alert'} className={`text-sm rounded-xl px-4 py-3 ${msg.ok ? 'bg-[#5ce08a]/40' : 'bg-red-50 text-red-800'}`}>{msg.texto}</p>}

      <div className="overflow-x-auto rounded-2xl border border-[#0f1f2e]/10 bg-white">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wider text-[#0f1f2e]/50">{['#', 'PYME', 'Índice', 'Umbral → pago total', 'Máx.', 'Cargo', 'Vigencia', 'Modo', ''].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {datos.contratos.length === 0 && <tr><td colSpan={9} className="px-4 py-6 text-[#0f1f2e]/50">Aún no hay contratos.</td></tr>}
            {datos.contratos.map((c) => (
              <tr key={c.id} className="border-t border-[#0f1f2e]/10 align-top">
                <td className="px-4 py-3">{c.id}</td>
                <td className="px-4 py-3">{c.pyme}<span className="block text-xs text-[#0f1f2e]/50">{c.rut}</span></td>
                <td className="px-4 py-3">{datos.indices[c.indice_id]?.nombre ?? c.indice_id}</td>
                <td className="px-4 py-3 whitespace-nowrap">{c.umbral} → {c.salida}</td>
                <td className="px-4 py-3 whitespace-nowrap">{clp(c.monto_max)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{clp(c.cargo_mensual)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{c.inicio} → {c.fin}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.modo === 'REAL' ? 'bg-red-100 text-red-800' : 'bg-[#0f1f2e]/10'}`}>{c.modo}</span></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={`/seguros-parametricos/contratos/${c.id}`} target="_blank" rel="noreferrer" className={btnLight}>Borrador</a>
                    <input placeholder="AAAA-MM" value={liq[c.id] ?? ''} onChange={(e) => setLiq((p) => ({ ...p, [c.id]: e.target.value }))} className="rounded-lg border border-[#0f1f2e]/15 px-2 py-1 text-xs w-24" />
                    <button onClick={() => liquidar(c.id)} disabled={!/^\d{4}-\d{2}$/.test(liq[c.id] ?? '')} className={btnLight}>Liquidar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={crear} className="rounded-3xl bg-white border border-[#0f1f2e]/10 p-6 grid sm:grid-cols-2 gap-4 max-w-4xl">
        <h2 className="sm:col-span-2 text-lg font-semibold">Nuevo contrato</h2>
        <label className={labelCls}>PYME<input required className={inputCls} value={f.pyme} onChange={(e) => set('pyme', e.target.value)} /></label>
        <label className={labelCls}>RUT<input required className={inputCls} placeholder="76.123.456-0" value={f.rut} onChange={(e) => set('rut', e.target.value)} /></label>
        <label className={`${labelCls} sm:col-span-2`}>Exposición operacional que se cubre (interés real)
          <textarea required minLength={20} rows={2} className={inputCls} placeholder="Ej.: proveedor de mantención de flota; 60 % de mis ingresos depende de la actividad de la faena." value={f.exposicion} onChange={(e) => set('exposicion', e.target.value)} />
        </label>
        <label className={`${labelCls} sm:col-span-2`}>Índice
          <select className={inputCls} value={f.indiceId} onChange={(e) => elegirIndice(e.target.value)}>{ids.map((id) => <option key={id} value={id}>{datos.indices[id].nombre}{datos.indices[id].verificado ? '' : ' (fuente por verificar)'}</option>)}</select>
          <span className="normal-case tracking-normal font-normal text-[#0f1f2e]/55">{indice.fuente}</span>
        </label>
        <label className={labelCls}>Umbral ({indice.unidad}, paga {indice.dir === 'menor' ? 'por debajo' : 'por encima'})<input type="number" step="any" className={inputCls} value={f.umbral} onChange={(e) => set('umbral', e.target.value)} /></label>
        <label className={labelCls}>Pago total en ({indice.unidad})<input type="number" step="any" className={inputCls} value={f.salida} onChange={(e) => set('salida', e.target.value)} /></label>
        <label className={labelCls}>Monto máximo por periodo (CLP)<input type="number" className={inputCls} value={f.montoMax} onChange={(e) => set('montoMax', e.target.value)} /></label>
        <label className={labelCls}>Cargo mensual (CLP)
          <span className="flex gap-2"><input type="number" className={inputCls} value={f.cargoMensual} onChange={(e) => set('cargoMensual', e.target.value)} /><button type="button" onClick={sugerir} className={`${btnLight} whitespace-nowrap`}>Sugerir</button></span>
        </label>
        {sug && (
          <div className="sm:col-span-2 rounded-2xl bg-[#f4f7fa] p-4 text-sm">
            {sug.error ? <p className="text-red-700">{sug.error}</p> : sug.n === 0 ? <p>No hay serie histórica cargada para este índice (pestaña Oráculo).</p> : (
              <>
                <p><b>Con {sug.n} periodos históricos:</b> se habría activado {sug.activaciones} veces ({Math.round(sug.frecuencia * 100)} %); pago esperado {clp(sug.pagoEsperadoMensual)}/mes; peor periodo {sug.peorPeriodo.periodo} ({clp(sug.peorPeriodo.monto)}).</p>
                <p className="mt-1">Cargo sugerido: <b>{clp(sug.cargoSugeridoMensual)}</b>/mes <button type="button" className="underline font-semibold" onClick={() => set('cargoMensual', sug.cargoSugeridoMensual)}>usar</button></p>
                {!sug.confiable && <p className="mt-1 text-amber-800">Menos de 36 periodos: la estimación es frágil.</p>}
              </>
            )}
          </div>
        )}
        <label className={labelCls}>Inicio<input required type="date" className={inputCls} value={f.inicio} onChange={(e) => set('inicio', e.target.value)} /></label>
        <label className={labelCls}>Fin<input required type="date" className={inputCls} value={f.fin} onChange={(e) => set('fin', e.target.value)} /></label>
        <label className={`${labelCls} sm:col-span-2`}>Modo
          <select className={inputCls} value={f.modo} onChange={(e) => set('modo', e.target.value)}>
            <option value="SIMULADO">SIMULADO — no genera obligaciones de pago</option>
            <option value="REAL" disabled={!real}>REAL — compromete dinero{real ? '' : ' (requiere OPINION_LEGAL_REF)'}</option>
          </select>
          {f.modo === 'SIMULADO' && <span className="normal-case tracking-normal font-normal text-[#0f1f2e]/55">{AVISO_SIMULADO}</span>}
        </label>
        <div className="sm:col-span-2"><button className={btn}>Crear contrato</button></div>
      </form>
    </div>
  );
}

function Liquidaciones({ datos, recargar }) {
  const [msg, setMsg] = useState(null);
  const modoDe = (id) => datos.contratos.find((c) => c.id === id)?.modo;

  async function cambiar(id, estado) {
    const { ok, j } = await llamar({ accion: 'estado_liquidacion', id, estado });
    setMsg(ok ? null : j?.error ?? 'No se pudo actualizar.');
    if (ok) recargar();
  }

  if (datos.liquidaciones.length === 0) return <p className="text-sm text-[#0f1f2e]/60">Aún no hay liquidaciones. Liquida un periodo desde la pestaña Contratos.</p>;
  return (
    <div className="flex flex-col gap-3">
      {msg && <p role="alert" className="text-sm text-red-700">{msg}</p>}
      <div className="overflow-x-auto rounded-2xl border border-[#0f1f2e]/10 bg-white">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wider text-[#0f1f2e]/50">{['Contrato', 'Periodo', 'Valor', 'Pago', 'Monto', 'Estado', 'Evidencia', ''].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {datos.liquidaciones.map((l) => {
              const ev = JSON.parse(l.evidencia);
              return (
                <tr key={l.id} className="border-t border-[#0f1f2e]/10 align-top">
                  <td className="px-4 py-3">#{l.contrato_id} <span className="text-xs text-[#0f1f2e]/50">{modoDe(l.contrato_id)}</span></td>
                  <td className="px-4 py-3">{l.periodo}</td>
                  <td className="px-4 py-3">{l.valor ?? '—'}</td>
                  <td className="px-4 py-3">{Math.round((l.fraccion ?? 0) * 100)}%</td>
                  <td className="px-4 py-3 whitespace-nowrap">{clp(l.monto)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge(l.estado)}`}>{l.estado}</span></td>
                  <td className="px-4 py-3 text-xs text-[#0f1f2e]/60">{ev.base ?? '—'} · {ev.lecturas.length} lectura(s){ev.motivo && <span className="block text-amber-800">{ev.motivo}</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {l.estado === 'CALCULADA' && <button onClick={() => cambiar(l.id, 'EN_DISPUTA')} className={btnLight}>Disputar</button>}
                      {l.estado === 'EN_DISPUTA' && <button onClick={() => cambiar(l.id, 'CALCULADA')} className={btnLight}>Reabrir</button>}
                      {l.estado === 'CALCULADA' && l.monto > 0 && modoDe(l.contrato_id) === 'REAL' && <button onClick={() => cambiar(l.id, 'PAGADA_EXTERNA')} className={btnLight}>Marcar pagada</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Oraculo({ datos, recargar }) {
  const ids = Object.keys(datos.indices);
  const [disp, setDisp] = useState({ nombre: '', indiceId: ids[0] });
  const [nuevo, setNuevo] = useState(null); // { id, secreto }
  const [ofi, setOfi] = useState({ indiceId: ids[0], fuente: '', csv: '' });
  const [msg, setMsg] = useState(null);

  async function crearDispositivo(e) {
    e.preventDefault();
    const { ok, j } = await llamar({ accion: 'nuevo_dispositivo', ...disp });
    if (ok) { setNuevo(j); setDisp({ ...disp, nombre: '' }); recargar(); } else setMsg({ ok: false, texto: j?.error ?? 'Error.' });
  }

  async function cargarOficial(e) {
    e.preventDefault();
    const { ok, j } = await llamar({ accion: 'cargar_oficial', ...ofi });
    setMsg({ ok, texto: ok ? `Serie cargada: ${j.aceptadas} aceptadas, ${j.duplicadas} duplicadas, ${j.enDisputa} en disputa, ${j.rechazadas} rechazadas.` : j?.error ?? 'Error.' });
    if (ok) recargar();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className={`rounded-2xl px-5 py-3 text-sm ${datos.cadena.ok ? 'bg-[#5ce08a]/30' : 'bg-red-50 text-red-800'}`}>
        {datos.cadena.ok ? `Cadena de hashes íntegra (${datos.cadena.total} lecturas).` : `¡Cadena ROTA en la lectura ${datos.cadena.rompeEn}! Alguien alteró datos: no se debe liquidar hasta investigar.`}
      </div>
      {msg && <p role={msg.ok ? 'status' : 'alert'} className={`text-sm rounded-xl px-4 py-3 ${msg.ok ? 'bg-[#5ce08a]/40' : 'bg-red-50 text-red-800'}`}>{msg.texto}</p>}

      <div className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={cargarOficial} className="rounded-3xl bg-white border border-[#0f1f2e]/10 p-6 flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Cargar serie oficial</h2>
          <label className={labelCls}>Índice<select className={inputCls} value={ofi.indiceId} onChange={(e) => setOfi({ ...ofi, indiceId: e.target.value })}>{ids.map((id) => <option key={id} value={id}>{datos.indices[id].nombre}</option>)}</select></label>
          <label className={labelCls}>Fuente (nombre y publicación)<input required className={inputCls} value={ofi.fuente} onChange={(e) => setOfi({ ...ofi, fuente: e.target.value })} placeholder="Ej.: Boletín X, publicación de mayo 2026" /></label>
          <label className={labelCls}>Serie (fecha;valor, una por línea)<textarea required rows={5} className={`${inputCls} font-mono`} placeholder={'2025-01;101,3\n2025-02;98,7'} value={ofi.csv} onChange={(e) => setOfi({ ...ofi, csv: e.target.value })} /></label>
          <button className={`${btn} self-start`}>Cargar</button>
        </form>

        <div className="rounded-3xl bg-white border border-[#0f1f2e]/10 p-6 flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Sensores IoT</h2>
          <form onSubmit={crearDispositivo} className="flex flex-wrap gap-2 items-end">
            <label className={`${labelCls} flex-1 min-w-[140px]`}>Nombre<input required className={inputCls} value={disp.nombre} onChange={(e) => setDisp({ ...disp, nombre: e.target.value })} /></label>
            <label className={`${labelCls} flex-1 min-w-[140px]`}>Índice<select className={inputCls} value={disp.indiceId} onChange={(e) => setDisp({ ...disp, indiceId: e.target.value })}>{ids.map((id) => <option key={id} value={id}>{datos.indices[id].nombre}</option>)}</select></label>
            <button className={btn}>Registrar</button>
          </form>
          {nuevo && (
            <div role="status" className="rounded-xl bg-amber-50 text-amber-950 p-3 text-xs break-all">
              <b>Dispositivo #{nuevo.id}. Copia el secreto ahora: no se vuelve a mostrar.</b>
              <code className="block mt-1">{nuevo.secreto}</code>
            </div>
          )}
          <ul className="text-sm flex flex-col gap-1">
            {datos.dispositivos.length === 0 && <li className="text-[#0f1f2e]/50">Sin sensores registrados.</li>}
            {datos.dispositivos.map((d) => <li key={d.id}>#{d.id} · {d.nombre} <span className="text-xs text-[#0f1f2e]/50">({datos.indices[d.indice_id]?.nombre}) · último envío {d.ultimo_ts ? new Date(d.ultimo_ts).toLocaleString('es-CL') : 'nunca'}</span></li>)}
          </ul>
          <p className="text-xs text-[#0f1f2e]/55">Envío firmado: <code>node scripts/simular-sensor.mjs {'<url> <id> <secreto> <valor>'}</code></p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Últimas lecturas</h2>
        <div className="overflow-x-auto rounded-2xl border border-[#0f1f2e]/10 bg-white">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wider text-[#0f1f2e]/50">{['#', 'Índice', 'Fuente', 'Fecha', 'Valor', 'Estado'].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {datos.lecturas.map((l) => (
                <tr key={l.id} className="border-t border-[#0f1f2e]/10 align-top">
                  <td className="px-4 py-2">{l.id}</td><td className="px-4 py-2">{datos.indices[l.indice_id]?.nombre ?? l.indice_id}</td>
                  <td className="px-4 py-2">{l.fuente}</td><td className="px-4 py-2 whitespace-nowrap">{l.fecha_obs.slice(0, 19).replace('T', ' ')}</td><td className="px-4 py-2">{l.valor}</td>
                  <td className="px-4 py-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge(l.estado)}`}>{l.estado}</span>{l.motivo && <span className="block text-xs text-[#0f1f2e]/55 mt-1">{l.motivo}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
