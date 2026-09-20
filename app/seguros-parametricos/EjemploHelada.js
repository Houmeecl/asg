'use client';

import { CheckCircle2, Snowflake } from 'lucide-react';
import { Contador, Reveal, Trazo, motion } from './Motion';
import { clp } from './data';
import { DIAS, EJEMPLO, serie } from './ejemplo';

const { riesgo: r, monto: MONTO, cot, minimo, diaMin, fraccion, pago } = EJEMPLO;

const W = 640, H = 260, PX = 44, PY = 20;
const TMIN = -7, TMAX = 16;
const x = (i) => PX + (i / (DIAS - 1)) * (W - PX - 12);
const y = (t) => PY + ((TMAX - t) / (TMAX - TMIN)) * (H - PY - 34);
const linea = serie.map((t, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(t).toFixed(1)}`).join(' ');

export default function EjemploHelada() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-3xl bg-white border border-[#0f1f2e]/10 p-5 md:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-[#0f1f2e]/50">Temperatura mínima diaria · 90 días</p>
            <p className="font-semibold">Temporada de ejemplo, Valle de Azapa</p>
          </div>
          <span className="text-[11px] rounded-full bg-[#0f1f2e]/5 px-3 py-1 text-[#0f1f2e]/60">Datos sintéticos, ilustrativos</span>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" role="img" aria-label="Gráfico de temperatura mínima con una helada bajo el umbral del seguro">
          {[-6, 0, 6, 12].map((t) => (
            <g key={t}>
              <line x1={PX} x2={W - 12} y1={y(t)} y2={y(t)} stroke="#0f1f2e" strokeOpacity="0.08" />
              <text x={PX - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#0f1f2e" fillOpacity="0.5">{t}°</text>
            </g>
          ))}
          <rect x={PX} y={y(cot.umbral)} width={W - PX - 12} height={y(TMIN) - y(cot.umbral)} fill="#e5484d" fillOpacity="0.07" />
          <line x1={PX} x2={W - 12} y1={y(cot.umbral)} y2={y(cot.umbral)} stroke="#e5484d" strokeWidth="1.5" strokeDasharray="6 5" />
          <text x={W - 14} y={y(cot.umbral) - 6} textAnchor="end" fontSize="11" fontWeight="600" fill="#e5484d">Umbral del seguro: {cot.umbral.toFixed(0)} °C</text>
          <line x1={PX} x2={W - 12} y1={y(r.salida)} y2={y(r.salida)} stroke="#0f1f2e" strokeOpacity="0.25" strokeDasharray="2 4" />
          <text x={W - 14} y={y(r.salida) - 6} textAnchor="end" fontSize="10" fill="#0f1f2e" fillOpacity="0.5">Pago total: {r.salida} °C</text>

          <Trazo d={linea} stroke="#0f1f2e" ancho={2.5} />

          <motion.g
            initial={{ opacity: 0, scale: 0.4 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            transition={{ delay: 1.6, type: 'spring', stiffness: 260, damping: 16 }} style={{ transformOrigin: `${x(diaMin)}px ${y(minimo)}px` }}
          >
            <circle cx={x(diaMin)} cy={y(minimo)} r="11" fill="#e5484d" fillOpacity="0.2" />
            <circle cx={x(diaMin)} cy={y(minimo)} r="5" fill="#e5484d" />
          </motion.g>
          <text x={x(diaMin) + 14} y={y(minimo) + 4} fontSize="12" fontWeight="600" fill="#e5484d">{minimo.toFixed(1)} °C · día {diaMin + 1}</text>
          <text x={PX} y={H - 8} fontSize="11" fill="#0f1f2e" fillOpacity="0.5">Día 1</text>
          <text x={W - 12} y={H - 8} textAnchor="end" fontSize="11" fill="#0f1f2e" fillOpacity="0.5">Día 90</text>
        </svg>
      </div>

      <Reveal delay={0.1} className="grid sm:grid-cols-3 gap-3">
        {[
          ['Monto asegurado', clp(MONTO), 'Cobertura por 3 meses'],
          ['Prima indicativa', clp(cot.prima), `Tasa ${(cot.tasa * 100).toFixed(1)}%`],
        ].map(([k, v, s]) => (
          <div key={k} className="rounded-2xl bg-white border border-[#0f1f2e]/10 p-4">
            <p className="text-xs uppercase tracking-wider font-semibold text-[#0f1f2e]/50">{k}</p>
            <p className="mt-1 text-xl font-semibold">{v}</p>
            <p className="text-xs text-[#0f1f2e]/55">{s}</p>
          </div>
        ))}
        <div className="rounded-2xl bg-[#0f1f2e] text-white p-4">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-[#5ce08a]"><Snowflake size={13} /> Pago automático</p>
          <p className="mt-1 text-xl font-semibold"><Contador hasta={pago} formato={(n) => clp(Math.round(n / 1000) * 1000)} /></p>
          <p className="text-xs text-white/60 flex items-center gap-1"><CheckCircle2 size={12} className="text-[#5ce08a]" /> {(fraccion * 100).toFixed(0)}% del monto, sin peritaje</p>
        </div>
      </Reveal>
    </div>
  );
}
