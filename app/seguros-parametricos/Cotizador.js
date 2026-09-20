'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { RIESGOS, ZONAS_NORTE, BASE, clp, cotizar } from './data';

export default function Cotizador({ riesgoInicial = 'helada', zonaInicial = 'Atacama', riesgos = Object.keys(RIESGOS), zonas = ZONAS_NORTE }) {
  const [riesgo, setRiesgo] = useState(riesgoInicial);
  const [zona, setZona] = useState(zonaInicial);
  const [monto, setMonto] = useState(50_000_000);
  const [meses, setMeses] = useState(6);
  const [sens, setSens] = useState(50);

  const r = RIESGOS[riesgo];
  const cot = useMemo(() => cotizar(riesgo, monto, meses, sens), [riesgo, monto, meses, sens]);

  return (
    <div className="grid lg:grid-cols-[1fr_1.05fr] gap-6">
      <div className="rounded-3xl bg-white border border-[#0f1f2e]/10 p-6 md:p-8 flex flex-col gap-5">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#0f1f2e]/60">Riesgo a cubrir</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {riesgos.map((k) => (
              <button
                type="button"
                key={k}
                onClick={() => setRiesgo(k)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  riesgo === k ? 'bg-[#0f1f2e] text-[#5ce08a] border-[#0f1f2e]' : 'border-[#0f1f2e]/15 hover:border-[#0f1f2e]'
                }`}
              >
                {RIESGOS[k].nombre}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wider text-[#0f1f2e]/60">
            Región
            <select value={zona} onChange={(e) => setZona(e.target.value)} className="rounded-xl border border-[#0f1f2e]/15 bg-transparent px-3 py-3 text-sm normal-case tracking-normal text-[#0f1f2e] font-normal">
              {zonas.map((z) => <option key={z}>{z}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wider text-[#0f1f2e]/60">
            Periodo de cobertura: {meses} meses
            <input type="range" min={1} max={12} value={meses} onChange={(e) => setMeses(+e.target.value)} className="accent-[#0f1f2e] mt-2" />
          </label>
        </div>

        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wider text-[#0f1f2e]/60">
          Monto asegurado: <span className="text-[#0f1f2e] normal-case tracking-normal text-sm">{clp(monto)}</span>
          <input type="range" min={5_000_000} max={500_000_000} step={5_000_000} value={monto} onChange={(e) => setMonto(+e.target.value)} className="accent-[#0f1f2e]" />
        </label>

        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wider text-[#0f1f2e]/60">
          Sensibilidad del disparador: {sens}%
          <input type="range" min={10} max={100} value={sens} onChange={(e) => setSens(+e.target.value)} className="accent-[#0f1f2e]" />
          <span className="normal-case tracking-normal font-normal text-[#0f1f2e]/55">Más sensible = paga con eventos más leves, pero la prima sube.</span>
        </label>

        <Link href={`${BASE}/onboarding`} className="rounded-full bg-[#0f1f2e] text-[#5ce08a] font-semibold py-3.5 text-center hover:bg-[#1a3247] transition-colors">
          Continuar con el onboarding demo
        </Link>
      </div>

      <div className="rounded-3xl bg-[#0f1f2e] text-white p-6 md:p-8 flex flex-col gap-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#5ce08a]">Cotización indicativa · {zona}</p>
          <p className="mt-3 text-5xl md:text-6xl font-semibold tracking-tight">{clp(cot.prima)}</p>
          <p className="text-white/60 text-sm mt-1">prima estimada · tasa {(cot.tasa * 100).toFixed(1)}% · probabilidad de pago ≈ {(cot.prob * 100).toFixed(0)}%</p>
        </div>

        <CurvaPago r={r} umbral={cot.umbral} monto={monto} />

        <p className="text-xs text-white/45 leading-relaxed">
          Cifras ilustrativas para explorar el producto. La prima definitiva depende de datos históricos de la estación de referencia,
          el análisis de riesgo y la aceptación del asegurador.
        </p>
      </div>
    </div>
  );
}

export function CurvaPago({ r, umbral, monto }) {
  const W = 420, H = 190, pad = 28;
  const lo = Math.min(r.umbral, r.salida), hi = Math.max(r.umbral, r.salida);
  const min = lo - (hi - lo) * 0.4, max = hi + (hi - lo) * 0.4;
  const x = (v) => pad + ((v - min) / (max - min)) * (W - pad * 2);
  const yTop = 24, yBase = H - 34;
  // Eje siempre de menor a mayor pago hacia la derecha: en riesgos "menor" se invierte el sentido del índice.
  const pts = r.dir === 'menor'
    ? [[max, yBase], [umbral, yBase], [r.salida, yTop], [min, yTop]]
    : [[min, yBase], [umbral, yBase], [r.salida, yTop], [max, yTop]];
  const d = pts.map(([v, y], i) => `${i ? 'L' : 'M'}${r.dir === 'menor' ? W - x(v) : x(v)},${y}`).join(' ');

  return (
    <div>
      <p className="text-sm text-white/70 mb-2">Pago según <b className="text-white">{r.indice.toLowerCase()}</b> ({r.unidad})</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Curva de pago del seguro">
        <line x1={pad} x2={W - pad} y1={yBase} y2={yBase} stroke="#ffffff33" />
        <path d={d} fill="none" stroke="#5ce08a" strokeWidth="3" strokeLinejoin="round" />
        <text x={pad} y={yTop - 8} fill="#ffffff99" fontSize="11">{clp(monto)}</text>
        <text x={pad} y={H - 8} fill="#ffffff99" fontSize="11">
          {r.dir === 'menor' ? `Activa bajo ${umbral.toFixed(0)} ${r.unidad}` : `Activa sobre ${umbral.toFixed(0)} ${r.unidad}`} · pago total en {r.salida} {r.unidad}
        </text>
      </svg>
    </div>
  );
}
