import Link from 'next/link';
import {
  ArrowRight, ArrowUpRight, CloudRain, Snowflake, Wind, Thermometer, Droplets, Waves,
  Zap, ShieldCheck, Eye, Satellite, MapPin, SlidersHorizontal, BadgeDollarSign, FileText, Flame, Headset,
} from 'lucide-react';
import Cotizador from './Cotizador';
import TileGrid from './TileGrid';
import MapaInteractivo from './MapaInteractivo';
import EjemploHelada from './EjemploHelada';
import { EJEMPLO } from './ejemplo';
import { MotionRoot, Reveal, Stagger, Item, Lift, Parallax, Contador } from './Motion';
import { SiteHeader, SiteFooter } from './SiteChrome';
import { ICONOS } from './iconos';
import { ATRIBUCION } from './satelite';
import { BASE, PREDIO_EJEMPLO, RIESGOS, SECTORES, clp } from './data';

export const metadata = {
  title: 'SICR3P — Seguros paramétricos contra riesgo climático',
  description: 'Cotiza y contrata cobertura paramétrica en el norte de Chile: el pago se activa automáticamente cuando el clima cruza el umbral acordado.',
};

const INK = 'text-[#0f1f2e]';
const HERO = SECTORES.find((s) => s.slug === 'agricultura').lugar;

const CONFIANZA = [
  { icon: Satellite, t: 'Datos satelitales y de estaciones', d: 'Índices objetivos y auditables, no opiniones.' },
  { icon: Zap, t: 'Pago automático', d: 'Si se cruza el umbral, se paga. Sin peritajes.' },
  { icon: FileText, t: 'Condiciones claras', d: 'Índice, umbral y monto quedan en la póliza.' },
  { icon: Headset, t: 'Atención en Chile', d: 'Un ejecutivo te acompaña de la cotización al pago.' },
];

const PASOS = [
  { icon: MapPin, n: '01', t: 'Ubica tu operación', d: 'Marcamos tu predio, faena o activo sobre imagen satelital y asignamos la estación de referencia más cercana.' },
  { icon: SlidersHorizontal, n: '02', t: 'Define el umbral y el monto', d: 'Tú eliges desde qué nivel de riesgo quieres cobrar y cuánto. Ves la prima al instante.' },
  { icon: BadgeDollarSign, n: '03', t: 'Cobra cuando el clima ocurre', d: 'Monitoreamos el índice. Si cruza tu umbral, el pago se dispara sin trámites ni peritajes.' },
];

const COBERTURAS = [
  { icon: Snowflake, k: 'helada' }, { icon: Droplets, k: 'sequia' }, { icon: CloudRain, k: 'lluvia' },
  { icon: Wind, k: 'viento' }, { icon: Flame, k: 'calor' }, { icon: Waves, k: 'marejada' },
];
const ICONO_RIESGO = { helada: Snowflake, sequia: Droplets, lluvia: CloudRain, viento: Wind, calor: Thermometer, marejada: Waves };

const FAQ = [
  ['¿Qué es un seguro paramétrico?', 'Es un contrato que paga un monto acordado cuando un índice medible (por ejemplo, la temperatura mínima o la lluvia acumulada) cruza un umbral pactado, en lugar de indemnizar una pérdida evaluada por un perito.'],
  ['¿Cómo se mide el evento?', 'Con una estación meteorológica de referencia y datos satelitales definidos en la póliza. Ambas partes pueden auditar el mismo dato.'],
  ['¿Cuánto tarda un pago?', 'Cuando el periodo cierra y el índice se confirma, el pago se libera en días, no en meses.'],
  ['¿Y si sufro pérdidas pero el índice no se activa?', 'Es el riesgo base del producto: paga el índice, no la pérdida. Por eso calibramos el umbral con el historial de tu ubicación.'],
  ['¿Las cifras de esta página son reales?', 'Las primas y el ejemplo de helada son ilustrativos. Las imágenes satelitales sí son reales (Copernicus Sentinel-2). La prima definitiva depende del análisis de riesgo y de la aceptación del asegurador.'],
];

export default function SegurosParametricos() {
  return (
    <MotionRoot>
      <div className={`min-h-screen bg-[#f4f7fa] ${INK} font-sans`}>
        <SiteHeader />

        {/* Hero con imagen satelital real */}
        <section className="relative bg-[#0f1f2e] text-white overflow-hidden">
          <Parallax>
            <TileGrid lat={HERO.lat} lon={HERO.lon} z={HERO.z} cols={6} rows={5} escala={1.1} prioridad atribuir={false} />
          </Parallax>
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#0f1f2e] via-[#0f1f2e]/75 to-[#0f1f2e]/10" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0f1f2e] to-transparent" />

          <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-28 grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
            <div className="flex flex-col gap-6">
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                  <ShieldCheck size={14} className="text-[#5ce08a]" /> Seguros paramétricos · Norte de Chile
                </span>
              </Reveal>
              <Reveal delay={0.08}>
                <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.04]">
                  Tu operación, <span className="text-[#5ce08a]">protegida del clima.</span>
                </h1>
              </Reveal>
              <Reveal delay={0.16}>
                <p className="text-lg text-white/75 max-w-xl">
                  Si el clima supera el umbral que acordamos, el pago se activa solo. Sin peritajes, sin esperas, con la evidencia a la vista de ambas partes.
                </p>
              </Reveal>
              <Reveal delay={0.24} className="flex flex-wrap gap-3">
                <a href="#cotizar" className="rounded-full bg-[#5ce08a] text-[#0f1f2e] font-semibold px-6 py-3.5 flex items-center gap-2 hover:bg-white transition-colors">Cotizar mi cobertura <ArrowRight size={16} /></a>
                <a href="#ejemplo" className="rounded-full border border-white/40 font-semibold px-6 py-3.5 hover:bg-white/10 transition-colors">Ver un ejemplo real</a>
              </Reveal>
            </div>

            <Reveal delay={0.3} y={40}>
              <div className="rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md p-6 shadow-2xl">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span className="uppercase tracking-wider font-semibold">Cobertura activa</span>
                  <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#5ce08a] animate-pulse" /> Monitoreando</span>
                </div>
                <p className="mt-3 text-2xl font-semibold">Helada · Valle de Azapa</p>
                <p className="text-sm text-white/65">Arica y Parinacota</p>
                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-white/10 p-3"><dt className="text-xs text-white/60">Umbral</dt><dd className="mt-0.5 font-semibold">bajo {EJEMPLO.umbral.toFixed(0)} °C</dd></div>
                  <div className="rounded-xl bg-white/10 p-3"><dt className="text-xs text-white/60">Monto asegurado</dt><dd className="mt-0.5 font-semibold">{clp(EJEMPLO.monto)}</dd></div>
                  <div className="rounded-xl bg-white/10 p-3"><dt className="text-xs text-white/60">Última mínima</dt><dd className="mt-0.5 font-semibold">6,4 °C</dd></div>
                  <div className="rounded-xl bg-white/10 p-3"><dt className="text-xs text-white/60">Estado</dt><dd className="mt-0.5 font-semibold text-[#5ce08a]">Sin evento</dd></div>
                </dl>
                <p className="mt-4 text-[11px] text-white/45">Ejemplo ilustrativo de un panel de cliente.</p>
              </div>
            </Reveal>
          </div>
          <p className="relative max-w-6xl mx-auto px-6 pb-3 text-[10px] text-white/50">Imagen: {ATRIBUCION}</p>
        </section>

        {/* Franja de confianza */}
        <section className="bg-white border-b border-[#0f1f2e]/10">
          <Stagger className="max-w-6xl mx-auto px-6 py-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {CONFIANZA.map(({ icon: I, t, d }) => (
              <Item key={t} className="flex gap-4">
                <span className="shrink-0 w-11 h-11 rounded-xl bg-[#0f1f2e] text-[#5ce08a] grid place-items-center"><I size={20} /></span>
                <div><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-[#0f1f2e]/65 leading-relaxed">{d}</p></div>
              </Item>
            ))}
          </Stagger>
        </section>

        {/* Ejemplo real */}
        <section id="ejemplo" className="max-w-6xl mx-auto px-6 py-24 scroll-mt-16">
          <Reveal>
            <p className="text-xs uppercase tracking-widest text-[#28a745] font-semibold">Un ejemplo</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight max-w-3xl">Así paga un seguro paramétrico: helada en el Valle de Azapa.</h2>
            <p className="mt-4 text-[#0f1f2e]/65 max-w-2xl">
              Un productor asegura su predio de olivos y hortalizas contra heladas. La estación de referencia mide la temperatura mínima cada noche.
              Cuando baja del umbral, el pago se calcula solo.
            </p>
          </Reveal>

          <div className="mt-12 grid lg:grid-cols-[0.9fr_1.1fr] gap-6 items-start">
            <Reveal className="rounded-3xl overflow-hidden border border-[#0f1f2e]/10 shadow-sm bg-white">
              <div className="h-[420px]">
                <MapaInteractivo {...PREDIO_EJEMPLO} etiquetaPredio="Predio asegurado" etiquetaEstacion="Estación de referencia" />
              </div>
              <p className="px-5 py-3 text-xs text-[#0f1f2e]/55">Imagen satelital real (Sentinel-2). El polígono del predio es ilustrativo. Arrastra y haz zoom para explorar.</p>
            </Reveal>
            <EjemploHelada />
          </div>

          <Stagger className="mt-10 grid md:grid-cols-3 gap-4">
            {[
              ['1', 'La helada ocurre', `La mínima cae a ${EJEMPLO.minimo.toFixed(1)} °C, bajo el umbral de ${EJEMPLO.umbral.toFixed(0)} °C.`],
              ['2', 'El sistema lo detecta', 'La estación de referencia registra el dato y se verifica contra la póliza.'],
              ['3', 'Se paga automáticamente', `El productor recibe ${clp(Math.round(EJEMPLO.pago / 1000) * 1000)} sin peritajes ni trámites.`],
            ].map(([n, t, d]) => (
              <Item key={n} className="rounded-2xl bg-white border border-[#0f1f2e]/10 p-5 flex gap-4">
                <span className="shrink-0 w-8 h-8 rounded-full bg-[#28a745] text-white grid place-items-center text-sm font-semibold">{n}</span>
                <div><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-[#0f1f2e]/65">{d}</p></div>
              </Item>
            ))}
          </Stagger>
        </section>

        {/* Sectores con imágenes satelitales */}
        <section id="sectores" className="bg-white border-y border-[#0f1f2e]/10 scroll-mt-16">
          <div className="max-w-6xl mx-auto px-6 py-24">
            <Reveal>
              <p className="text-xs uppercase tracking-widest text-[#28a745] font-semibold">Zona norte de Chile</p>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">Soluciones por sector, de Arica a Coquimbo.</h2>
            </Reveal>
            <Stagger className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {SECTORES.map((sec) => {
                const I = ICONOS[sec.icon];
                return (
                  <Item key={sec.slug}>
                    <Lift className="h-full">
                      <Link href={`${BASE}/sectores/${sec.slug}`} className="group block h-full rounded-3xl overflow-hidden border border-[#0f1f2e]/10 bg-white shadow-sm hover:shadow-xl transition-shadow">
                        <div className="relative h-44 overflow-hidden bg-[#0f1f2e]">
                          <TileGrid lat={sec.lugar.lat} lon={sec.lugar.lon} z={sec.lugar.z} cols={2} rows={1} atribuir={false} className="transition-transform duration-700 group-hover:scale-110" />
                          <span className="absolute top-3 left-3 w-10 h-10 rounded-xl bg-[#0f1f2e]/85 text-[#5ce08a] grid place-items-center backdrop-blur"><I size={18} /></span>
                          <span className="absolute bottom-2 left-3 text-[11px] text-white bg-black/45 rounded px-2 py-0.5">{sec.lugar.nombre}</span>
                        </div>
                        <div className="p-6">
                          <h3 className="font-semibold text-lg">{sec.nombre}</h3>
                          <p className="mt-1 text-sm text-[#0f1f2e]/65">{sec.corto}</p>
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {sec.riesgos.map((k) => <span key={k} className="text-[11px] rounded-full bg-[#0f1f2e]/5 px-2.5 py-1">{RIESGOS[k].corto ?? RIESGOS[k].nombre.split(' ')[0]}</span>)}
                          </div>
                          <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#28a745] group-hover:gap-2 transition-all">Ver sector <ArrowUpRight size={14} /></span>
                        </div>
                      </Link>
                    </Lift>
                  </Item>
                );
              })}
              <Item>
                <Lift className="h-full">
                  <Link href={`${BASE}/onboarding`} className="group h-full min-h-[300px] rounded-3xl bg-[#0f1f2e] text-white p-8 flex flex-col justify-between hover:shadow-xl transition-shadow">
                    <ShieldCheck className="text-[#5ce08a]" size={30} />
                    <div>
                      <h3 className="text-xl font-semibold">¿Tu operación es distinta?</h3>
                      <p className="mt-2 text-sm text-white/65">Cuéntanos qué riesgo climático te afecta y armamos una cobertura a tu medida.</p>
                      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#5ce08a] group-hover:gap-2 transition-all">Empezar <ArrowRight size={14} /></span>
                    </div>
                  </Link>
                </Lift>
              </Item>
            </Stagger>
            <p className="mt-6 text-[11px] text-[#0f1f2e]/45">Imágenes: {ATRIBUCION}.</p>
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" className="bg-[#0f1f2e] text-white scroll-mt-16">
          <div className="max-w-6xl mx-auto px-6 py-24">
            <Reveal>
              <p className="text-xs uppercase tracking-widest text-[#5ce08a] font-semibold">Cómo funciona</p>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">Tres pasos, sin reclamos.</h2>
            </Reveal>
            <Stagger className="mt-12 grid md:grid-cols-3 gap-6" gap={0.12}>
              {PASOS.map(({ icon: I, n, t, d }) => (
                <Item key={n} className="rounded-2xl border border-white/10 bg-white/[0.04] p-7">
                  <div className="flex items-center justify-between"><I className="text-[#5ce08a]" size={26} /><span className="text-white/30 font-mono text-sm">{n}</span></div>
                  <h3 className="mt-10 text-xl font-semibold">{t}</h3>
                  <p className="mt-2 text-sm text-white/65 leading-relaxed">{d}</p>
                </Item>
              ))}
            </Stagger>
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-white/10 pt-10">
              {[[5, '', 'Sectores del norte'], [6, '', 'Riesgos climáticos'], [0, '', 'Peritajes para cobrar'], [24, '/7', 'Monitoreo del índice']].map(([n, suf, l]) => (
                <div key={l}>
                  <p className="text-4xl font-semibold text-[#5ce08a]"><Contador hasta={n} />{suf}</p>
                  <p className="mt-1 text-sm text-white/60">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Póliza de muestra */}
        <section className="max-w-6xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-14 items-center">
          <Reveal>
            <p className="text-xs uppercase tracking-widest text-[#28a745] font-semibold">Transparencia</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">Todo queda escrito en tu póliza.</h2>
            <p className="mt-4 text-[#0f1f2e]/65 max-w-lg">Qué se mide, dónde, desde qué valor se paga y cuánto. Sin letra chica: el criterio de pago es un número que ambas partes pueden verificar.</p>
            <ul className="mt-6 flex flex-col gap-3 text-sm">
              {['Índice y estación de referencia definidos', 'Umbral de activación y tabla de pago', 'Periodo de cobertura y monto asegurado', 'Fuente de datos auditable'].map((x) => (
                <li key={x} className="flex items-center gap-3"><Eye size={16} className="text-[#28a745]" /> {x}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1} y={40}>
            <div className="rounded-3xl bg-white border border-[#0f1f2e]/10 shadow-xl p-7 md:p-8 rotate-1 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#0f1f2e]/50 font-semibold">Póliza paramétrica</p>
                  <p className="mt-1 text-xl font-semibold">N.º SP-2026-0001 <span className="text-xs font-medium text-[#0f1f2e]/50">(ejemplo)</span></p>
                </div>
                <ShieldCheck className="text-[#28a745]" size={28} />
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                {[
                  ['Asegurado', 'Agrícola Azapa Ltda. (ejemplo)'], ['Riesgo', 'Helada'],
                  ['Índice', 'Temperatura mínima diaria'], ['Ubicación', 'Valle de Azapa, Arica'],
                  ['Umbral', `bajo ${EJEMPLO.umbral.toFixed(0)} °C`], ['Pago total', 'en −6 °C o menos'],
                  ['Monto asegurado', clp(EJEMPLO.monto)], ['Vigencia', '3 meses'],
                ].map(([k, v]) => (
                  <div key={k}><dt className="text-xs uppercase tracking-wider text-[#0f1f2e]/45 font-semibold">{k}</dt><dd className="mt-0.5">{v}</dd></div>
                ))}
              </dl>
              <div className="mt-6 border-t border-dashed border-[#0f1f2e]/20 pt-4 text-xs text-[#0f1f2e]/50">Documento de muestra sin validez contractual.</div>
            </div>
          </Reveal>
        </section>

        {/* Cotizador */}
        <section id="cotizar" className="bg-white border-y border-[#0f1f2e]/10 scroll-mt-16">
          <div className="max-w-6xl mx-auto px-6 py-24">
            <Reveal>
              <p className="text-xs uppercase tracking-widest text-[#28a745] font-semibold">Cotizador</p>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">Cotiza tu cobertura.</h2>
              <p className="mt-4 mb-10 text-[#0f1f2e]/65 max-w-2xl">Mueve los controles y mira cómo cambian la prima y la curva de pago.</p>
            </Reveal>
            <Cotizador />
          </div>
        </section>

        {/* Coberturas */}
        <section id="coberturas" className="max-w-6xl mx-auto px-6 py-24 scroll-mt-16">
          <Reveal><h2 className="text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">Riesgos que puedes cubrir.</h2></Reveal>
          <Stagger className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-4">
            {COBERTURAS.map(({ k }) => {
              const I = ICONO_RIESGO[k], r = RIESGOS[k];
              return (
                <Item key={k}>
                  <Lift className="h-full rounded-2xl bg-white border border-[#0f1f2e]/10 p-6 hover:border-[#0f1f2e] transition-colors">
                    <I size={24} className="text-[#28a745]" />
                    <h3 className="mt-6 font-semibold">{r.nombre}</h3>
                    <p className="mt-1 text-sm text-[#0f1f2e]/60">{r.indice} ({r.unidad})</p>
                  </Lift>
                </Item>
              );
            })}
          </Stagger>
        </section>

        {/* FAQ */}
        <section id="faq" className="max-w-3xl mx-auto px-6 pb-24 scroll-mt-16">
          <Reveal><h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Preguntas frecuentes</h2></Reveal>
          <div className="mt-8 divide-y divide-[#0f1f2e]/10 border-y border-[#0f1f2e]/10">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex justify-between items-center cursor-pointer font-medium list-none">
                  {q}<span className="text-xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-3 text-sm text-[#0f1f2e]/70 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section id="contacto" className="px-6 pb-16">
          <Reveal className="max-w-6xl mx-auto rounded-3xl bg-[#0f1f2e] text-white p-10 md:p-14 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight max-w-lg">Protege tu próxima temporada.</h2>
              <p className="mt-3 text-white/65 max-w-md">Crea tu cuenta, cotiza en minutos y guarda tu cobertura.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`${BASE}/onboarding`} className="rounded-full bg-[#5ce08a] text-[#0f1f2e] font-semibold px-6 py-3.5 hover:bg-white transition-colors">Empezar ahora</Link>
              <Link href={`${BASE}/ingresar`} className="rounded-full border border-white/40 font-semibold px-6 py-3.5 hover:bg-white/10 transition-colors">Ingresar</Link>
            </div>
          </Reveal>
        </section>

        <SiteFooter />
      </div>
    </MotionRoot>
  );
}
