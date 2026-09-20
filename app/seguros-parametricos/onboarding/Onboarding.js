'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { BASE, RIESGOS, SECTORES, ZONAS_NORTE, clp, cotizar, sectorPorSlug } from '../data';
import { CurvaPago } from '../Cotizador';

const PASOS = ['Tu empresa', 'Ubicación', 'Cobertura', 'Resultado'];

const input = 'rounded-xl border border-[#0f1f2e]/15 bg-white px-4 py-3 text-sm w-full';
const label = 'flex flex-col gap-2 text-xs font-semibold uppercase tracking-wider text-[#0f1f2e]/60';

export default function Onboarding() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [paso, setPaso] = useState(0);
  const [f, setF] = useState({
    empresa: '', sector: 'mineria', zona: 'Antofagasta', localidad: '',
    riesgo: 'lluvia', monto: 50_000_000, meses: 6, sens: 50,
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const sector = sectorPorSlug(f.sector);
  const cot = useMemo(() => cotizar(f.riesgo, f.monto, f.meses, f.sens), [f.riesgo, f.monto, f.meses, f.sens]);
  const r = RIESGOS[f.riesgo];

  function elegirSector(slug) {
    const s = sectorPorSlug(slug);
    setF((p) => ({ ...p, sector: slug, zona: s.zonaDefault, riesgo: s.riesgoDefault }));
  }

  const puedeAvanzar = paso === 0 ? f.empresa.trim().length > 1 : paso === 1 ? f.localidad.trim().length > 1 : true;

  async function activar() {
    setGuardando(true);
    setError('');
    try {
      const res = await fetch('/api/seguros/polizas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      });
      if (res.status === 401) return router.push(`${BASE}/ingresar?desde=onboarding`);
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? 'No se pudo guardar la póliza.');
      router.push(`${BASE}/panel`);
    } catch {
      setError('No hay conexión con el servidor.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-widest font-semibold text-[#0f1f2e]/50">Onboarding demo · paso {paso + 1} de {PASOS.length}</p>
      <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">{PASOS[paso]}</h1>
      <div className="mt-5 flex gap-1.5" aria-hidden>
        {PASOS.map((p, i) => <span key={p} className={`h-1.5 flex-1 rounded-full ${i <= paso ? 'bg-[#0f1f2e]' : 'bg-[#0f1f2e]/10'}`} />)}
      </div>

      <div className="mt-8 rounded-3xl bg-white border border-[#0f1f2e]/10 p-6 md:p-8 flex flex-col gap-5">
        {paso === 0 && (
          <>
            <label className={label}>Nombre de la empresa
              <input className={input} value={f.empresa} onChange={(e) => set('empresa', e.target.value)} placeholder="Ej. Servicios Mineros del Norte SpA" />
            </label>
            <div>
              <p className={label}>Sector</p>
              <div className="mt-2 grid sm:grid-cols-2 gap-2">
                {SECTORES.map((s) => (
                  <button type="button" key={s.slug} onClick={() => elegirSector(s.slug)} className={`text-left rounded-xl border px-4 py-3 ${f.sector === s.slug ? 'border-[#0f1f2e] bg-[#5ce08a]/50' : 'border-[#0f1f2e]/15 hover:border-[#0f1f2e]'}`}>
                    <span className="font-medium text-sm">{s.nombre}</span>
                    <span className="block text-xs text-[#0f1f2e]/55 mt-0.5">{s.corto}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {paso === 1 && (
          <>
            <label className={label}>Región
              <select className={input} value={f.zona} onChange={(e) => set('zona', e.target.value)}>
                {ZONAS_NORTE.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
            </label>
            <label className={label}>Localidad, faena o predio
              <input className={input} value={f.localidad} onChange={(e) => set('localidad', e.target.value)} placeholder="Ej. Valle de Azapa, Sierra Gorda, Caleta Chanavayita" />
            </label>
            <p className="text-xs text-[#0f1f2e]/55">En la versión real asignamos aquí la estación meteorológica de referencia más cercana a tu ubicación.</p>
          </>
        )}

        {paso === 2 && (
          <>
            <div>
              <p className={label}>Riesgo a cubrir</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sector.riesgos.map((k) => (
                  <button type="button" key={k} onClick={() => set('riesgo', k)} className={`px-4 py-2 rounded-full text-sm font-medium border ${f.riesgo === k ? 'bg-[#0f1f2e] text-[#5ce08a] border-[#0f1f2e]' : 'border-[#0f1f2e]/15 hover:border-[#0f1f2e]'}`}>
                    {RIESGOS[k].nombre}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-[#0f1f2e]/55">{sector.riesgoDetalle[f.riesgo]}</p>
            </div>
            <label className={label}>Monto asegurado: <span className="normal-case tracking-normal text-sm text-[#0f1f2e]">{clp(f.monto)}</span>
              <input type="range" min={5_000_000} max={500_000_000} step={5_000_000} value={f.monto} onChange={(e) => set('monto', +e.target.value)} className="accent-[#0f1f2e]" />
            </label>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className={label}>Periodo: {f.meses} meses
                <input type="range" min={1} max={12} value={f.meses} onChange={(e) => set('meses', +e.target.value)} className="accent-[#0f1f2e]" />
              </label>
              <label className={label}>Sensibilidad: {f.sens}%
                <input type="range" min={10} max={100} value={f.sens} onChange={(e) => set('sens', +e.target.value)} className="accent-[#0f1f2e]" />
              </label>
            </div>
          </>
        )}

        {paso === 3 && (
          <>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[['Empresa', f.empresa], ['Sector', sector.nombre], ['Ubicación', `${f.localidad}, ${f.zona}`], ['Riesgo', r.nombre], ['Monto asegurado', clp(f.monto)], ['Periodo', `${f.meses} meses`]].map(([k, v]) => (
                <div key={k}><dt className="text-xs uppercase tracking-wider text-[#0f1f2e]/50 font-semibold">{k}</dt><dd className="mt-0.5">{v}</dd></div>
              ))}
            </dl>
            <div className="rounded-2xl bg-[#0f1f2e] text-white p-6">
              <p className="text-xs uppercase tracking-widest text-[#5ce08a]">Prima indicativa</p>
              <p className="mt-2 text-4xl font-semibold">{clp(cot.prima)}</p>
              <p className="text-white/60 text-sm">tasa {(cot.tasa * 100).toFixed(1)}% · probabilidad de pago ≈ {(cot.prob * 100).toFixed(0)}%</p>
              <div className="mt-4"><CurvaPago r={r} umbral={cot.umbral} monto={f.monto} /></div>
            </div>
          </>
        )}
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-6 flex justify-between">
        <button type="button" onClick={() => setPaso((p) => p - 1)} disabled={paso === 0} className="flex items-center gap-2 rounded-full border border-[#0f1f2e]/30 px-5 py-3 text-sm font-semibold disabled:opacity-30">
          <ArrowLeft size={16} /> Atrás
        </button>
        {paso < PASOS.length - 1 ? (
          <button type="button" onClick={() => setPaso((p) => p + 1)} disabled={!puedeAvanzar} className="flex items-center gap-2 rounded-full bg-[#0f1f2e] text-[#5ce08a] px-6 py-3 text-sm font-semibold disabled:opacity-40">
            Siguiente <ArrowRight size={16} />
          </button>
        ) : (
          <button type="button" onClick={activar} disabled={guardando} className="flex items-center gap-2 disabled:opacity-50 rounded-full bg-[#5ce08a] text-[#0f1f2e] px-6 py-3 text-sm font-semibold border border-[#0f1f2e]">
            <Check size={16} /> {guardando ? 'Guardando…' : 'Activar póliza demo'}
          </button>
        )}
      </div>
    </div>
  );
}
