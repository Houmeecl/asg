'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

// Parámetros ilustrativos por tipo de riesgo. `dir` indica si el pago se activa
// cuando el índice cae por debajo ('menor') o sube por encima ('mayor') del umbral.
const RIESGOS = {
  helada: { nombre: 'Helada', indice: 'Temperatura mínima', unidad: '°C', dir: 'menor', umbral: -2, salida: -6, base: 0.09 },
  sequia: { nombre: 'Sequía', indice: 'Precipitación acumulada', unidad: 'mm', dir: 'menor', umbral: 120, salida: 40, base: 0.12 },
  lluvia: { nombre: 'Lluvia intensa', indice: 'Precipitación en 24 h', unidad: 'mm', dir: 'mayor', umbral: 40, salida: 90, base: 0.07 },
  viento: { nombre: 'Viento', indice: 'Ráfaga máxima', unidad: 'km/h', dir: 'mayor', umbral: 70, salida: 130, base: 0.06 },
  calor: { nombre: 'Ola de calor', indice: 'Días sobre 35 °C', unidad: 'días', dir: 'mayor', umbral: 5, salida: 20, base: 0.1 },
};

const ZONAS = ['Arica y Parinacota', 'Antofagasta', 'Coquimbo', 'Valparaíso', 'Maule', 'Ñuble', 'Biobío', 'Los Lagos'];

const clp = (n) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

export default function Cotizador() {
  const [riesgo, setRiesgo] = useState('helada');
  const [zona, setZona] = useState('Maule');
  const [monto, setMonto] = useState(50_000_000);
  const [meses, setMeses] = useState(6);
  const [sens, setSens] = useState(50);

  const r = RIESGOS[riesgo];

  const cot = useMemo(() => {
    const s = sens / 100;
    // Más sensibilidad = umbral más cercano a lo normal = más probabilidad de pago = más prima.
    const prob = Math.min(0.6, r.base * (0.4 + 1.6 * s) * (meses / 6));
    const prima = monto * prob * 1.35;
    const umbral = r.umbral + (r.dir === 'menor' ? 1 : -1) * (r.umbral - r.salida) * (s - 0.5) * -0.4;
    return { prob, prima, tasa: prima / monto, umbral };
  }, [r, monto, meses, sens]);

  const [enviado, setEnviado] = useState(false);

  return (
    <div className="grid lg:grid-cols-[1fr_1.05fr] gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setEnviado(true);
        }}
        className="rounded-3xl bg-white border border-[#0b1a12]/10 p-6 md:p-8 flex flex-col gap-5"
      >
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#0b1a12]/60">Riesgo a cubrir</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(RIESGOS).map(([k, v]) => (
              <button
                type="button"
                key={k}
                onClick={() => setRiesgo(k)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  riesgo === k ? 'bg-[#0b1a12] text-[#d7ff3f] border-[#0b1a12]' : 'border-[#0b1a12]/15 hover:border-[#0b1a12]'
                }`}
              >
                {v.nombre}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wider text-[#0b1a12]/60">
            Región
            <select value={zona} onChange={(e) => setZona(e.target.value)} className="rounded-xl border border-[#0b1a12]/15 bg-transparent px-3 py-3 text-sm normal-case tracking-normal text-[#0b1a12] font-normal">
              {ZONAS.map((z) => <option key={z}>{z}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wider text-[#0b1a12]/60">
            Periodo de cobertura: {meses} meses
            <input type="range" min={1} max={12} value={meses} onChange={(e) => setMeses(+e.target.value)} className="accent-[#0b1a12] mt-2" />
          </label>
        </div>

        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wider text-[#0b1a12]/60">
          Monto asegurado: <span className="text-[#0b1a12] normal-case tracking-normal text-sm">{clp(monto)}</span>
          <input type="range" min={5_000_000} max={500_000_000} step={5_000_000} value={monto} onChange={(e) => setMonto(+e.target.value)} className="accent-[#0b1a12]" />
        </label>

        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wider text-[#0b1a12]/60">
          Sensibilidad del disparador: {sens}%
          <input type="range" min={10} max={100} value={sens} onChange={(e) => setSens(+e.target.value)} className="accent-[#0b1a12]" />
          <span className="normal-case tracking-normal font-normal text-[#0b1a12]/55">Más sensible = paga con eventos más leves, pero la prima sube.</span>
        </label>

        <div className="border-t border-[#0b1a12]/10 pt-5 grid sm:grid-cols-2 gap-4">
          <input required placeholder="Nombre o empresa" className="rounded-xl border border-[#0b1a12]/15 px-3 py-3 text-sm" />
          <input required type="email" placeholder="Correo de contacto" className="rounded-xl border border-[#0b1a12]/15 px-3 py-3 text-sm" />
        </div>

        <button type="submit" className="rounded-full bg-[#0b1a12] text-[#d7ff3f] font-semibold py-3.5 hover:bg-[#16301f] transition-colors">
          Solicitar cotización formal
        </button>
        {enviado && (
          <p className="flex items-center gap-2 text-sm text-emerald-800" role="status">
            <CheckCircle2 size={16} /> Recibido. Un asesor te contactará con una propuesta firmada.
          </p>
        )}
      </form>

      <div className="rounded-3xl bg-[#0b1a12] text-white p-6 md:p-8 flex flex-col gap-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#d7ff3f]">Cotización indicativa · {zona}</p>
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

function CurvaPago({ r, umbral, monto }) {
  const W = 420, H = 190, pad = 28;
  const lo = Math.min(r.umbral, r.salida), hi = Math.max(r.umbral, r.salida);
  const min = lo - (hi - lo) * 0.4, max = hi + (hi - lo) * 0.4;
  const x = (v) => pad + ((v - min) / (max - min)) * (W - pad * 2);
  const yTop = 24, yBase = H - 34;
  // El pago crece linealmente entre el umbral de activación y el de salida (100%).
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
        <path d={d} fill="none" stroke="#d7ff3f" strokeWidth="3" strokeLinejoin="round" />
        <text x={pad} y={yTop - 8} fill="#ffffff99" fontSize="11">{clp(monto)}</text>
        <text x={pad} y={H - 8} fill="#ffffff99" fontSize="11">
          {r.dir === 'menor' ? `Activa bajo ${umbral.toFixed(0)} ${r.unidad} · pago total en ${r.salida} ${r.unidad}` : `Activa sobre ${umbral.toFixed(0)} ${r.unidad} · pago total en ${r.salida} ${r.unidad}`}
        </text>
      </svg>
    </div>
  );
}
