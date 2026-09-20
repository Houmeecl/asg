'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { RIESGOS, SECTORES, ZONAS_NORTE, clp, cotizar, sectorPorSlug } from '../data';
import { CurvaPago } from '../Cotizador';

const PASOS = ['Cliente', 'Cobertura paramétrica', 'Producto en Nico', 'Revisar y enviar'];

const inputCls = 'rounded-xl border border-[#0f1f2e]/15 bg-white px-3 py-2.5 text-sm w-full';
const labelCls = 'text-xs font-semibold uppercase tracking-wider text-[#0f1f2e]/60 flex flex-col gap-1.5';
const btn = 'rounded-full bg-[#0f1f2e] text-[#5ce08a] px-5 py-2.5 text-sm font-semibold hover:bg-[#1a3247] disabled:opacity-40';

const nombreDe = (it) => { const a = { ...(it.attributes ?? {}), ...it }; return a.name ?? a.label ?? a.business_name ?? `#${a.id}`; };
const listaDe = (json) => (Array.isArray(json?.data) ? json.data : []).map((it) => ({ id: (it.attributes ?? it).id ?? it.id, nombre: nombreDe(it) }));

async function cargar(recurso, extra = '') {
  const r = await fetch(`/api/seguros/admin/nico/${recurso}?display_length=100${extra}`);
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(j?.error ?? 'Error al consultar Nico.');
  return listaDe(j);
}

const VACIO = {
  nombre: '', rut: '', tipo: 'legal', industryId: '', direccion: '', contactoNombre: '', correo: '', telefono: '',
  sector: 'agricultura', zona: 'Arica y Parinacota', localidad: '', riesgo: 'calorMax', monto: 50_000_000, meses: 6, sens: 50,
  categoriaId: '', currency: 'uf', prima: '', requested: false, notas: '',
};

export default function NuevoClienteNico({ onListo }) {
  const [paso, setPaso] = useState(0);
  const [f, setF] = useState(VACIO);
  const [catalogos, setCatalogos] = useState(null); // { rubros, ramos } | { error }
  const [simular, setSimular] = useState(true);
  const [confirmo, setConfirmo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null); // { ok?, simulado?, error?, ... }
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let vigente = true;
    Promise.all([cargar('rubros'), cargar('ramos')])
      .then(([rubros, ramos]) => vigente && setCatalogos({ rubros, ramos }))
      .catch((e) => vigente && setCatalogos({ error: e.message }));
    return () => { vigente = false; };
  }, []);

  const sector = sectorPorSlug(f.sector);
  const r = RIESGOS[f.riesgo];
  const cot = useMemo(() => cotizar(f.riesgo, f.monto, f.meses, f.sens), [f.riesgo, f.monto, f.meses, f.sens]);

  function elegirSector(slug) {
    const s = sectorPorSlug(slug);
    setF((p) => ({ ...p, sector: slug, zona: s.zonaDefault, riesgo: s.riesgoDefault }));
  }

  const validoPaso = [
    f.nombre.trim().length > 1 && f.rut.trim().length > 6 && f.direccion.trim().length > 4 && /@/.test(f.correo) && (f.tipo === 'natural' || f.industryId),
    f.localidad.trim().length > 1,
    Boolean(f.categoriaId),
    !simular ? confirmo : true,
  ][paso];

  const cuerpo = () => ({
    simular,
    cliente: {
      nombre: f.nombre, rut: f.rut, tipo: f.tipo, industryId: f.tipo === 'legal' ? Number(f.industryId) : undefined,
      direccion: f.direccion, contactoNombre: f.contactoNombre, correo: f.correo, telefono: f.telefono,
    },
    cobertura: { sector: f.sector, zona: f.zona, localidad: f.localidad, riesgo: f.riesgo, monto: f.monto, meses: f.meses, sens: f.sens },
    nico: {
      insuranceCategoryId: Number(f.categoriaId), currency: f.currency, requested: f.requested, notas: f.notas,
      estimatedNetPrime: f.prima === '' ? undefined : Number(f.prima),
    },
  });

  async function enviar() {
    setEnviando(true);
    setResultado(null);
    try {
      const res = await fetch('/api/seguros/admin/nico-onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo()) });
      const j = await res.json().catch(() => null);
      setResultado(res.ok ? j : { error: typeof j?.error === 'string' ? j.error : 'No se pudo completar.', ...j });
      if (res.ok && !j.simulado) onListo?.();
    } catch {
      setResultado({ error: 'No hay conexión con el servidor.' });
    } finally {
      setEnviando(false);
    }
  }

  function reiniciar() { setF(VACIO); setPaso(0); setResultado(null); setConfirmo(false); setSimular(true); }

  return (
    <div className="max-w-3xl flex flex-col gap-5">
      <div>
        <p className="text-xs uppercase tracking-widest font-semibold text-[#0f1f2e]/50">Paso {paso + 1} de {PASOS.length}</p>
        <h2 className="text-2xl font-semibold tracking-tight">{PASOS[paso]}</h2>
        <div className="mt-3 flex gap-1.5" aria-hidden>{PASOS.map((p, i) => <span key={p} className={`h-1.5 flex-1 rounded-full ${i <= paso ? 'bg-[#0f1f2e]' : 'bg-[#0f1f2e]/10'}`} />)}</div>
      </div>

      {catalogos?.error && <p role="alert" className="text-sm text-red-700 rounded-xl bg-red-50 px-4 py-3">{catalogos.error} (revisa la pestaña Conexión)</p>}

      <div className="rounded-3xl bg-white border border-[#0f1f2e]/10 p-6 grid sm:grid-cols-2 gap-4">
        {paso === 0 && (<>
          <label className={`${labelCls} sm:col-span-2`}>Nombre o razón social<input className={inputCls} value={f.nombre} onChange={(e) => set('nombre', e.target.value)} /></label>
          <label className={labelCls}>RUT<input className={inputCls} placeholder="12.345.678-5" value={f.rut} onChange={(e) => set('rut', e.target.value)} /></label>
          <label className={labelCls}>Tipo
            <select className={inputCls} value={f.tipo} onChange={(e) => set('tipo', e.target.value)}><option value="legal">Empresa (jurídica)</option><option value="natural">Persona natural</option></select>
          </label>
          {f.tipo === 'legal' && (
            <label className={`${labelCls} sm:col-span-2`}>Rubro (Nico)
              <select className={inputCls} value={f.industryId} onChange={(e) => set('industryId', e.target.value)}>
                <option value="">Elegir…</option>{catalogos?.rubros?.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
              </select>
            </label>
          )}
          <label className={`${labelCls} sm:col-span-2`}>Dirección (calle, número, comuna y ciudad)<input className={inputCls} value={f.direccion} onChange={(e) => set('direccion', e.target.value)} /></label>
          <label className={labelCls}>Contacto<input className={inputCls} placeholder="Igual al nombre si se deja vacío" value={f.contactoNombre} onChange={(e) => set('contactoNombre', e.target.value)} /></label>
          <label className={labelCls}>Correo del contacto<input type="email" className={inputCls} value={f.correo} onChange={(e) => set('correo', e.target.value)} /></label>
          <label className={labelCls}>Teléfono (opcional)<input className={inputCls} placeholder="+56 9 1234 5678" value={f.telefono} onChange={(e) => set('telefono', e.target.value)} /></label>
        </>)}

        {paso === 1 && (<>
          <label className={labelCls}>Sector
            <select className={inputCls} value={f.sector} onChange={(e) => elegirSector(e.target.value)}>{SECTORES.map((s) => <option key={s.slug} value={s.slug}>{s.nombre}</option>)}</select>
          </label>
          <label className={labelCls}>Riesgo
            <select className={inputCls} value={f.riesgo} onChange={(e) => set('riesgo', e.target.value)}>{sector.riesgos.map((k) => <option key={k} value={k}>{RIESGOS[k].nombre}</option>)}</select>
          </label>
          <label className={labelCls}>Región
            <select className={inputCls} value={f.zona} onChange={(e) => set('zona', e.target.value)}>{ZONAS_NORTE.map((z) => <option key={z}>{z}</option>)}</select>
          </label>
          <label className={labelCls}>Localidad, faena o predio<input className={inputCls} value={f.localidad} onChange={(e) => set('localidad', e.target.value)} /></label>
          <label className={labelCls}>Monto asegurado: {clp(f.monto)}<input type="range" min={5_000_000} max={500_000_000} step={5_000_000} value={f.monto} onChange={(e) => set('monto', +e.target.value)} className="accent-[#0f1f2e]" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>Meses: {f.meses}<input type="range" min={1} max={12} value={f.meses} onChange={(e) => set('meses', +e.target.value)} className="accent-[#0f1f2e]" /></label>
            <label className={labelCls}>Sensib.: {f.sens}%<input type="range" min={10} max={100} value={f.sens} onChange={(e) => set('sens', +e.target.value)} className="accent-[#0f1f2e]" /></label>
          </div>
          <div className="sm:col-span-2 rounded-2xl bg-[#0f1f2e] text-white p-4">
            <p className="text-xs text-[#5ce08a] uppercase tracking-widest">Prima indicativa SICR3P</p>
            <p className="text-2xl font-semibold">{clp(cot.prima)}</p>
            <CurvaPago r={r} umbral={cot.umbral} monto={f.monto} />
          </div>
        </>)}

        {paso === 2 && (<>
          <label className={`${labelCls} sm:col-span-2`}>Ramo (Nico)
            <select className={inputCls} value={f.categoriaId} onChange={(e) => set('categoriaId', e.target.value)}>
              <option value="">Elegir…</option>{catalogos?.ramos?.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
            </select>
            <span className="normal-case tracking-normal font-normal text-[#0f1f2e]/55">No hay un ramo «paramétrico» fijo en la API: usa la pestaña Catálogos para ver qué ramo y compañía aplican.</span>
          </label>
          <label className={labelCls}>Moneda
            <select className={inputCls} value={f.currency} onChange={(e) => set('currency', e.target.value)}><option value="uf">UF</option><option value="usd">USD</option></select>
          </label>
          <label className={labelCls}>Prima neta estimada (opcional, en la moneda elegida)<input type="number" min="0" step="any" className={inputCls} value={f.prima} onChange={(e) => set('prima', e.target.value)} /></label>
          <label className={`${labelCls} sm:col-span-2`}>Notas para el corredor / compañía objetivo (opcional)<input className={inputCls} maxLength={300} value={f.notas} onChange={(e) => set('notas', e.target.value)} /></label>
          <label className="sm:col-span-2 flex items-start gap-2 text-sm">
            <input type="checkbox" checked={f.requested} onChange={(e) => set('requested', e.target.checked)} className="mt-1 accent-[#0f1f2e]" />
            <span>Solicitar cotización a las aseguradoras ahora. <span className="text-[#0f1f2e]/55">Si no, solo se guarda como oportunidad.</span></span>
          </label>
        </>)}

        {paso === 3 && (<div className="sm:col-span-2 flex flex-col gap-4">
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {[['Cliente', `${f.nombre} (${f.rut})`], ['Tipo', f.tipo === 'legal' ? 'Empresa' : 'Persona natural'], ['Contacto', `${f.contactoNombre || f.nombre} · ${f.correo}`], ['Dirección', f.direccion],
              ['Cobertura', `${r.nombre} · ${sector.nombre}`], ['Ubicación', `${f.localidad}, ${f.zona}`], ['Monto / periodo', `${clp(f.monto)} · ${f.meses} meses`], ['Ramo Nico', catalogos?.ramos?.find((x) => String(x.id) === String(f.categoriaId))?.nombre ?? f.categoriaId]]
              .map(([k, v]) => <div key={k}><dt className="text-xs uppercase tracking-wider text-[#0f1f2e]/50 font-semibold">{k}</dt><dd>{v}</dd></div>)}
          </dl>

          <label className="flex items-start gap-2 text-sm rounded-xl bg-[#5ce08a]/25 px-4 py-3">
            <input type="checkbox" checked={simular} onChange={(e) => { setSimular(e.target.checked); setConfirmo(false); setResultado(null); }} className="mt-1 accent-[#0f1f2e]" />
            <span><b>Simular (no envía nada a Nico).</b> Muestra exactamente lo que se crearía. Desmárcalo solo cuando quieras escribir de verdad.</span>
          </label>
          {!simular && (
            <label className="flex items-start gap-2 text-sm rounded-xl bg-red-50 text-red-900 px-4 py-3">
              <input type="checkbox" checked={confirmo} onChange={(e) => setConfirmo(e.target.checked)} className="mt-1" />
              <span>Entiendo que esto <b>crea una cuenta y una oportunidad reales en Nico</b>{f.requested ? ' y solicita cotización a las aseguradoras' : ''}.</span>
            </label>
          )}

          <button type="button" onClick={enviar} disabled={enviando || !validoPaso} className={`${btn} self-start flex items-center gap-2`}>
            <Send size={15} /> {enviando ? 'Procesando…' : simular ? 'Simular envío' : 'Crear en Nico'}
          </button>

          {resultado?.error && (
            <div role="alert" className="text-sm text-red-800 rounded-xl bg-red-50 px-4 py-3">
              <p>{resultado.error}</p>
              {resultado.reintentable && <p className="mt-1">La cuenta ya existe en Nico (id {resultado.cuentaId}); al volver a enviar se reutiliza, no se duplica.</p>}
            </div>
          )}
          {resultado?.simulado && (
            <div className="text-sm rounded-xl bg-[#0f1f2e]/5 px-4 py-3">
              <p className="font-semibold">Simulación registrada (#{resultado.operacionId}). No se envió nada.</p>
              <p className="mt-1 text-[#0f1f2e]/65">Se buscaría una cuenta con RUT {f.rut}; si no existe, se crearía. Luego se crearía la oportunidad.</p>
              <pre className="mt-2 text-xs bg-[#0f1f2e] text-[#5ce08a] rounded-xl p-3 overflow-x-auto max-h-72">{JSON.stringify({ cuenta: resultado.cuenta, lead: resultado.lead }, null, 2)}</pre>
            </div>
          )}
          {resultado?.ok && (
            <div role="status" className="text-sm rounded-xl bg-[#5ce08a]/40 px-4 py-3">
              <p className="font-semibold">Creado en Nico.</p>
              <p>Cuenta {resultado.cuentaId}{resultado.cuentaReutilizada ? ' (ya existía, se reutilizó)' : ''} · Oportunidad {resultado.leadId ?? 'sin id'}.</p>
              <button type="button" onClick={reiniciar} className="mt-2 underline font-semibold">Crear otro cliente</button>
            </div>
          )}
        </div>)}
      </div>

      <div className="flex justify-between">
        <button type="button" onClick={() => setPaso((p) => p - 1)} disabled={paso === 0} className="flex items-center gap-2 rounded-full border border-[#0f1f2e]/30 px-5 py-2.5 text-sm font-semibold disabled:opacity-30"><ArrowLeft size={15} /> Atrás</button>
        {paso < PASOS.length - 1 && <button type="button" onClick={() => setPaso((p) => p + 1)} disabled={!validoPaso} className={`${btn} flex items-center gap-2`}>Siguiente <ArrowRight size={15} /></button>}
      </div>
    </div>
  );
}
