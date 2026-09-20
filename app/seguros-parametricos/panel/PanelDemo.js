'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BASE, RIESGOS, clp, pagoFraccion, sectorPorSlug } from '../data';
import { cerrarSesion, useDemoSession } from '../demoSession';

export default function PanelDemo() {
  const router = useRouter();
  const { cargando, sesion } = useDemoSession();
  const [valor, setValor] = useState(null);

  useEffect(() => {
    if (!cargando && !sesion) router.replace(`${BASE}/ingresar`);
  }, [cargando, sesion, router]);

  if (cargando || !sesion) return <p className="text-sm text-[#0b1a12]/60">Cargando…</p>;

  const p = sesion.poliza;
  if (!p) {
    return (
      <div className="rounded-3xl bg-white border border-[#0b1a12]/10 p-10 text-center">
        <h1 className="text-2xl font-semibold">Aún no tienes pólizas</h1>
        <p className="mt-2 text-sm text-[#0b1a12]/65">Completa el onboarding demo para cotizar y activar tu primera cobertura.</p>
        <Link href={`${BASE}/onboarding`} className="inline-block mt-6 rounded-full bg-[#0b1a12] text-[#d7ff3f] font-semibold px-6 py-3">Iniciar onboarding</Link>
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold text-[#0b1a12]/50">Panel demo</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{p.empresa}</h1>
          <p className="text-sm text-[#0b1a12]/60">{sesion.email} · {sector.nombre} · {p.localidad}, {p.zona}</p>
        </div>
        <button onClick={() => { cerrarSesion(); router.push(BASE); }} className="rounded-full border border-[#0b1a12]/30 px-5 py-2.5 text-sm font-semibold hover:bg-white">Cerrar sesión</button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[['Monto asegurado', clp(p.monto)], ['Prima (indicativa)', clp(p.prima)], ['Periodo', `${p.meses} meses`]].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-white border border-[#0b1a12]/10 p-5">
            <p className="text-xs uppercase tracking-wider font-semibold text-[#0b1a12]/50">{k}</p>
            <p className="mt-2 text-2xl font-semibold">{v}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-[#0b1a12] text-white p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">Simula un evento: {r.nombre.toLowerCase()}</h2>
          <span className="text-xs rounded-full bg-[#d7ff3f] text-[#0b1a12] px-3 py-1 font-semibold">Póliza activa (demo)</span>
        </div>
        <p className="mt-1 text-sm text-white/60">Mueve el valor observado ({r.indice.toLowerCase()}) y mira cuándo se dispara el pago.</p>

        <input
          type="range" aria-label={r.indice}
          min={rango[0]} max={rango[1]} step={(rango[1] - rango[0]) / 200}
          value={actual} onChange={(e) => setValor(+e.target.value)}
          className="mt-6 w-full accent-[#d7ff3f]"
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
          <div className="rounded-2xl bg-[#d7ff3f] text-[#0b1a12] p-5">
            <p className="text-xs uppercase tracking-wider font-semibold">Pago calculado</p>
            <p className="mt-1 text-3xl font-semibold">{clp(pago)}</p>
            <p className="text-xs">{(frac * 100).toFixed(0)}% del monto asegurado</p>
          </div>
        </div>
      </div>
    </div>
  );
}
