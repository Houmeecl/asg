'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BASE, RIESGOS, clp, pagoFraccion, sectorPorSlug } from '../data';

export default function PanelDemo({ usuario, polizas }) {
  const router = useRouter();
  const [idSel, setIdSel] = useState(polizas[0]?.id);
  const [valor, setValor] = useState(null);

  async function salir() {
    await fetch('/api/seguros/logout', { method: 'POST' });
    router.push(BASE);
    router.refresh();
  }

  const cabecera = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-widest font-semibold text-[#0f1f2e]/50">Mi panel</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Hola, {usuario.nombre}</h1>
        <p className="text-sm text-[#0f1f2e]/60">{usuario.email}</p>
      </div>
      <div className="flex gap-2">
        <Link href={`${BASE}/onboarding`} className="rounded-full bg-[#0f1f2e] text-[#5ce08a] px-5 py-2.5 text-sm font-semibold hover:bg-[#1a3247]">Nueva cobertura</Link>
        <button onClick={salir} className="rounded-full border border-[#0f1f2e]/30 px-5 py-2.5 text-sm font-semibold hover:bg-white">Cerrar sesión</button>
      </div>
    </div>
  );

  const p = polizas.find((x) => x.id === idSel);
  if (!p) {
    return (
      <div className="flex flex-col gap-6">
        {cabecera}
        <div className="rounded-3xl bg-white border border-[#0f1f2e]/10 p-10 text-center">
          <h2 className="text-2xl font-semibold">Aún no tienes coberturas</h2>
          <p className="mt-2 text-sm text-[#0f1f2e]/65">Cotiza y guarda tu primera cobertura con el onboarding.</p>
          <Link href={`${BASE}/onboarding`} className="inline-block mt-6 rounded-full bg-[#0f1f2e] text-[#5ce08a] font-semibold px-6 py-3">Iniciar onboarding</Link>
        </div>
      </div>
    );
  }

  const r = RIESGOS[p.riesgo];
  const sector = sectorPorSlug(p.sector);
  const minimo = Math.min(r.umbral, r.salida), maximo = Math.max(r.umbral, r.salida);
  const holgura = (maximo - minimo) * 0.4;
  const rango = [minimo - holgura, maximo + holgura];
  // Punto de partida: el extremo "normal" del rango, lejos del umbral de activación.
  const normal = r.dir === 'menor' ? rango[1] : rango[0];
  const actual = valor ?? normal;
  const frac = pagoFraccion(p.riesgo, p.umbral, actual);
  const pago = p.monto * frac;

  return (
    <div className="flex flex-col gap-6">
      {cabecera}

      {polizas.length > 1 && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Mis coberturas">
          {polizas.map((x) => (
            <button
              key={x.id} role="tab" aria-selected={x.id === p.id}
              onClick={() => { setIdSel(x.id); setValor(null); }}
              className={`px-4 py-2 rounded-full text-sm font-medium border ${x.id === p.id ? 'bg-[#0f1f2e] text-[#5ce08a] border-[#0f1f2e]' : 'border-[#0f1f2e]/15 hover:border-[#0f1f2e]'}`}
            >
              {x.empresa} · {RIESGOS[x.riesgo].nombre}
            </button>
          ))}
        </div>
      )}

      <p className="text-sm text-[#0f1f2e]/60">{p.empresa} · {sector.nombre} · {p.localidad}, {p.zona}</p>

      <div className="grid md:grid-cols-3 gap-4">
        {[['Monto asegurado', clp(p.monto)], ['Prima (indicativa)', clp(p.prima)], ['Periodo', `${p.meses} meses`]].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-white border border-[#0f1f2e]/10 p-5">
            <p className="text-xs uppercase tracking-wider font-semibold text-[#0f1f2e]/50">{k}</p>
            <p className="mt-2 text-2xl font-semibold">{v}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-[#0f1f2e] text-white p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">Simula un evento: {r.nombre.toLowerCase()}</h2>
          <span className="text-xs rounded-full bg-[#5ce08a] text-[#0f1f2e] px-3 py-1 font-semibold">Póliza demo</span>
        </div>
        <p className="mt-1 text-sm text-white/60">Mueve el valor observado ({r.indice.toLowerCase()}) y mira cuándo se dispara el pago.</p>

        <input
          type="range" aria-label={r.indice}
          min={rango[0]} max={rango[1]} step={(rango[1] - rango[0]) / 200}
          value={actual} onChange={(e) => setValor(+e.target.value)}
          className="mt-6 w-full accent-[#5ce08a]"
        />
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-white/55">
          <span>Observado: <b className="text-white">{actual.toFixed(r.unidad === 'm' || r.unidad === '°C' ? 1 : 0)} {r.unidad}</b></span>
          <span>Umbral: {p.umbral.toFixed(0)} {r.unidad} · pago total en {r.salida} {r.unidad}</span>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white/5 p-5">
            <p className="text-xs uppercase tracking-wider text-white/50">Estado</p>
            <p className="mt-1 text-lg font-semibold">{frac > 0 ? 'Umbral cruzado: pago activado' : 'Sin evento: bajo el umbral'}</p>
          </div>
          <div className="rounded-2xl bg-[#5ce08a] text-[#0f1f2e] p-5">
            <p className="text-xs uppercase tracking-wider font-semibold">Pago calculado</p>
            <p className="mt-1 text-3xl font-semibold">{clp(pago)}</p>
            <p className="text-xs">{(frac * 100).toFixed(0)}% del monto asegurado</p>
          </div>
        </div>
      </div>
    </div>
  );
}
