import Link from 'next/link';
import {
  ArrowRight, ArrowUpRight, CloudRain, Snowflake, Wind, Thermometer, Sun, Droplets,
  Zap, ShieldCheck, Eye, Layers, Cpu, Landmark, MapPin, SlidersHorizontal, BadgeDollarSign,
  Calculator, FileSignature, Users, Sprout, Mountain, Plane, Flame,
} from 'lucide-react';
import Cotizador from './Cotizador';
import Wordmark from './Wordmark';

export const metadata = {
  title: 'SICR3P — Seguros paramétricos contra riesgo climático',
  description: 'Cotiza y contrata cobertura paramétrica: pagos automáticos cuando el clima cruza el umbral que tú defines.',
};

const INK = 'text-[#0b1a12]';
const LIME = 'bg-[#d7ff3f]';

const HERRAMIENTAS = [
  { icon: Calculator, t: 'Cálculo instantáneo', d: 'Define ubicación, riesgo y monto. Recibe una prima indicativa en segundos.' },
  { icon: FileSignature, t: 'Solicita cobertura', d: 'Convierte tu cotización en una propuesta formal sin papeleo interminable.' },
  { icon: Users, t: 'Gestión de clientes', d: 'Corredores y aseguradoras administran carteras, pólizas y renovaciones en un solo lugar.' },
];

const VENTAJAS = [
  { icon: Layers, t: 'Cobertura escalable', d: 'Desde un predio hasta una cartera regional con el mismo contrato.' },
  { icon: Zap, t: 'Pagos ágiles', d: 'Sin peritajes: si el índice cruza el umbral, el pago se dispara.' },
  { icon: Eye, t: 'Criterios transparentes', d: 'Índice, estación de referencia y tabla de pago quedan escritos en la póliza.' },
  { icon: ShieldCheck, t: 'Suscripción', d: 'Modelos actuariales calibrados con décadas de datos climáticos.' },
  { icon: Cpu, t: 'Tecnología', d: 'Monitoreo satelital y de estaciones en tiempo real, auditable por ambas partes.' },
  { icon: Landmark, t: 'Capital', d: 'Respaldo de reaseguradores y capital alternativo para pagar cuando importa.' },
];

const PASOS = [
  { icon: MapPin, n: '01', t: 'Define tu ubicación y riesgo', d: 'Marca el predio, faena o activo y elige el peligro: helada, sequía, lluvia, viento o calor.' },
  { icon: SlidersHorizontal, n: '02', t: 'Fija los parámetros de pago', d: 'Elige el umbral, el monto y el periodo. Ves de inmediato cuánto cuesta cada decisión.' },
  { icon: BadgeDollarSign, n: '03', t: 'Deja que el clima ocurra; cobra', d: 'Si el índice oficial cruza tu umbral, el pago llega automáticamente. Sin reclamos.' },
];

const COBERTURAS = [
  { icon: Sprout, t: 'Rendimiento por área' },
  { icon: Snowflake, t: 'Helada crítica' },
  { icon: Droplets, t: 'Precipitación acumulada' },
  { icon: CloudRain, t: 'Lluvia intensa (24 h)' },
  { icon: Wind, t: 'Viento y ráfagas' },
  { icon: Thermometer, t: 'Temperatura extrema' },
  { icon: Sun, t: 'Ola de calor' },
  { icon: Flame, t: 'Riesgo de incendio' },
];

const SECTORES = [
  { icon: Sprout, t: 'Agricultura', d: 'Heladas en fruta, sequía en secano, lluvia en cosecha.' },
  { icon: Mountain, t: 'Minería y energía', d: 'Lluvias altiplánicas y viento que detienen faenas y parques solares.' },
  { icon: Plane, t: 'Turismo y eventos', d: 'Protege temporadas y eventos ante clima adverso.' },
];

const FAQ = [
  ['¿Qué es un seguro paramétrico?', 'Es un contrato que paga un monto acordado cuando un índice medible (por ejemplo, la lluvia acumulada) cruza un umbral pactado, en lugar de indemnizar la pérdida evaluada por un perito.'],
  ['¿Cómo se protegen mis datos?', 'Los datos se cifran en tránsito y en reposo, con acceso por roles y registro de auditoría de cada consulta.'],
  ['¿De dónde vienen los datos climáticos?', 'De fuentes públicas y reconocidas —estaciones de la Dirección Meteorológica de Chile, NOAA, ECMWF y NASA— definidas en la póliza como estación de referencia.'],
  ['¿Cuánto tarda un pago?', 'Cuando el periodo cierra y el índice se confirma, el pago se libera en días, no en meses.'],
  ['¿Y si sufro pérdidas pero el índice no se activa?', 'Es el riesgo base del producto: paga el índice, no la pérdida. Por eso calibramos el umbral con tu historial y una estación cercana.'],
];

export default function SegurosParametricos() {
  return (
    <div className={`min-h-screen bg-[#f6f5ef] ${INK} font-sans`}>
      <header className="sticky top-0 z-20 backdrop-blur bg-[#f6f5ef]/85 border-b border-[#0b1a12]/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/seguros-parametricos" aria-label="SICR3P — inicio">
            <Wordmark />
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm">
            <a href="#plataforma" className="hover:underline">Plataforma</a>
            <a href="#como-funciona" className="hover:underline">Cómo funciona</a>
            <a href="#coberturas" className="hover:underline">Coberturas</a>
            <a href="#faq" className="hover:underline">Preguntas</a>
          </nav>
          <a href="#cotizar" className="rounded-full bg-[#0b1a12] text-[#d7ff3f] text-sm font-semibold px-5 py-2.5 hover:bg-[#16301f]">Cotizar</a>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-[#0b1a12] text-white relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:56px_56px]" />
        <div aria-hidden className="absolute -top-40 -right-40 w-[560px] h-[560px] rounded-full bg-[#d7ff3f]/15 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div className="flex flex-col gap-6">
            <span className={`self-start ${LIME} text-[#0b1a12] rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider`}>Seguros paramétricos</span>
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.02]">
              El futuro <span className="text-[#d7ff3f]">está asegurado.</span>
            </h1>
            <p className="text-lg text-white/70 max-w-xl">
              Tecnología de punta a punta para gestionar el riesgo climático: defines el umbral, monitoreamos el índice y pagamos automáticamente cuando se cruza.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#solucion" className="rounded-full bg-[#d7ff3f] text-[#0b1a12] font-semibold px-6 py-3.5 flex items-center gap-2 hover:bg-white">Explorar soluciones <ArrowRight size={16} /></a>
              <a href="#cotizar" className="rounded-full border border-white/40 font-semibold px-6 py-3.5 hover:bg-white/10">Cotizar ahora</a>
            </div>
          </div>

          <div className="rounded-3xl bg-white/[0.06] border border-white/10 p-5 backdrop-blur">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>Predio Los Olivos · Maule</span><span>-35.43, -71.66</span>
            </div>
            <div className="mt-4 h-44 rounded-2xl bg-[radial-gradient(circle_at_30%_40%,#d7ff3f55,transparent_45%),radial-gradient(circle_at_75%_65%,#3ddc9755,transparent_40%)] border border-white/10 relative overflow-hidden">
              <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:28px_28px]" />
              <span className="absolute left-[38%] top-[45%] w-4 h-4 rounded-full bg-[#d7ff3f] ring-8 ring-[#d7ff3f]/25" />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
              {[[Sun, '28°'], [Snowflake, '-3°'], [CloudRain, '12mm'], [Wind, '34km/h']].map(([I, v]) => (
                <div key={v} className="rounded-xl bg-white/5 py-3 flex flex-col items-center gap-1"><I size={16} className="text-[#d7ff3f]" />{v}</div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-[#d7ff3f] text-[#0b1a12] px-4 py-3 flex items-center justify-between text-sm font-semibold">
              Umbral helada: -2 °C <span>Pago 100% en -6 °C</span>
            </div>
          </div>
        </div>
        <div className="relative border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[['5', 'Riesgos climáticos cubiertos'], ['0', 'Peritajes para cobrar'], ['24/7', 'Monitoreo del índice'], ['100%', 'Criterios escritos en la póliza']].map(([n, l]) => (
              <div key={l}><p className="text-3xl font-semibold text-[#d7ff3f]">{n}</p><p className="text-xs text-white/60 mt-1">{l}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* Problema */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <p className="text-xs uppercase tracking-widest text-[#0b1a12]/50 font-semibold">El problema</p>
        <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight leading-tight">
          La mayoría de las pérdidas climáticas <span className="underline decoration-[#d7ff3f] decoration-8 underline-offset-4">no está asegurada.</span>
        </h2>
        <p className="mt-6 text-[#0b1a12]/65 max-w-2xl mx-auto text-lg">
          El seguro tradicional llega tarde: peritajes, disputas y meses de espera. Quien más lo necesita —agricultores, pymes, operaciones remotas— suele quedar fuera.
        </p>
      </section>

      {/* Solución: paramétrico vs tradicional */}
      <section id="solucion" className="bg-white border-y border-[#0b1a12]/10 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Nuestra solución es paramétrica.</h2>
          <div className="mt-10 grid md:grid-cols-2 gap-5">
            <div className="rounded-3xl border border-[#0b1a12]/10 p-7">
              <p className="text-sm font-semibold text-[#0b1a12]/50 uppercase tracking-wider">Seguro tradicional</p>
              <ol className="mt-5 flex flex-col gap-3 text-sm">
                {['Ocurre el evento', 'Denuncias el siniestro', 'Un perito evalúa la pérdida', 'Se negocia y se disputa el monto', 'Recibes el pago, meses después'].map((x, i) => (
                  <li key={x} className="flex gap-3"><span className="text-[#0b1a12]/35 font-mono">{i + 1}</span>{x}</li>
                ))}
              </ol>
            </div>
            <div className="rounded-3xl bg-[#0b1a12] text-white p-7">
              <p className="text-sm font-semibold text-[#d7ff3f] uppercase tracking-wider">Seguro paramétrico SICR3P</p>
              <ol className="mt-5 flex flex-col gap-3 text-sm">
                {['Ocurre el evento', 'El índice oficial cruza tu umbral', 'El pago se dispara automáticamente', 'Recibes el pago en días'].map((x, i) => (
                  <li key={x} className="flex gap-3"><span className="text-[#d7ff3f] font-mono">{i + 1}</span>{x}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosistema */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">Un ecosistema completo de riesgo.</h2>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[[Cpu, 'Infraestructura de datos', 'Satélites y estaciones oficiales.'], [Calculator, 'Suscripción con IA', 'Modelos que fijan prima y umbral.'], [Layers, 'Plataforma SICR3P', 'Cotiza, contrata y administra.'], [Landmark, 'Capital de riesgo', 'Reaseguro y capital alternativo.'], [Users, 'Clientes', 'Productores, pymes y empresas.']].map(([I, t, d], i) => (
            <div key={t} className="rounded-2xl border border-[#0b1a12]/10 bg-white p-5">
              <span className="text-xs font-mono text-[#0b1a12]/35">0{i + 1}</span>
              <I size={22} className="mt-4" />
              <h3 className="mt-4 font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-[#0b1a12]/65">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Herramientas */}
      <section id="plataforma" className="bg-white border-y border-[#0b1a12]/10">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">Una plataforma simple para un producto que no lo era.</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {HERRAMIENTAS.map(({ icon: I, t, d }) => (
              <a key={t} href="#cotizar" className="group rounded-2xl border border-[#0b1a12]/10 p-6 hover:bg-[#f6f5ef] transition-colors">
                <I size={22} />
                <h3 className="mt-5 text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm text-[#0b1a12]/65 leading-relaxed">{d}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all">Probar <ArrowUpRight size={14} /></span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Ventajas */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">Resolvemos problemas con seguros paramétricos.</h2>
        <p className="mt-4 text-[#0b1a12]/65 max-w-2xl">Pagos rápidos y sistemas más resilientes: menos fricción para quien asegura y para quien respalda el riesgo.</p>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
          {VENTAJAS.map(({ icon: I, t, d }) => (
            <div key={t} className="flex gap-4">
              <span className={`shrink-0 w-11 h-11 rounded-xl ${LIME} grid place-items-center`}><I size={20} /></span>
              <div><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-[#0b1a12]/65 leading-relaxed">{d}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="bg-[#0b1a12] text-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <p className="text-xs uppercase tracking-widest text-[#d7ff3f]">Cómo funciona</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">Tres pasos, sin reclamos.</h2>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {PASOS.map(({ icon: I, n, t, d }) => (
              <div key={n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-center justify-between"><I className="text-[#d7ff3f]" size={24} /><span className="text-white/30 font-mono text-sm">{n}</span></div>
                <h3 className="mt-8 text-xl font-semibold">{t}</h3>
                <p className="mt-2 text-sm text-white/65 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cotizador */}
      <section id="cotizar" className="max-w-6xl mx-auto px-6 py-20 scroll-mt-16">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">Cotiza tu cobertura.</h2>
        <p className="mt-4 mb-10 text-[#0b1a12]/65 max-w-2xl">Mueve los controles y mira cómo cambian la prima y la curva de pago.</p>
        <Cotizador />
      </section>

      {/* Coberturas */}
      <section id="coberturas" className="bg-white border-y border-[#0b1a12]/10 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">Cobertura a tu medida.</h2>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {COBERTURAS.map(({ icon: I, t }) => (
              <div key={t} className="rounded-2xl border border-[#0b1a12]/10 p-5 flex flex-col gap-6 hover:border-[#0b1a12] transition-colors">
                <I size={22} /><span className="font-medium text-sm">{t}</span>
              </div>
            ))}
          </div>
          <div className="mt-14 grid md:grid-cols-3 gap-5">
            {SECTORES.map(({ icon: I, t, d }) => (
              <div key={t} className={`rounded-2xl ${LIME} p-6`}>
                <I size={22} /><h3 className="mt-6 font-semibold text-lg">{t}</h3><p className="mt-1 text-sm">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-20 scroll-mt-16">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Preguntas frecuentes</h2>
        <div className="mt-8 divide-y divide-[#0b1a12]/10 border-y border-[#0b1a12]/10">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex justify-between items-center cursor-pointer font-medium list-none">
                {q}<span className="text-xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-[#0b1a12]/70 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA / Footer */}
      <section id="contacto" className="px-6 pb-10">
        <div className={`max-w-6xl mx-auto rounded-3xl ${LIME} p-10 md:p-14 flex flex-col md:flex-row md:items-center justify-between gap-6`}>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight max-w-lg">Recibe novedades e ideas sobre riesgo climático.</h2>
          <form className="flex gap-2 w-full md:w-auto">
            <input type="email" required placeholder="tu@correo.cl" className="flex-1 md:w-64 rounded-full px-5 py-3 text-sm bg-white/70 placeholder:text-[#0b1a12]/50" />
            <button className="rounded-full bg-[#0b1a12] text-[#d7ff3f] font-semibold px-6 py-3 text-sm">Suscribirme</button>
          </form>
        </div>
      </section>
      <footer className="max-w-6xl mx-auto px-6 py-10 text-sm text-[#0b1a12]/60 flex flex-wrap justify-between gap-4">
        <span>© 2026 SICR3P. Producto ilustrativo; sujeto a suscripción del asegurador.</span>
        <span className="flex gap-5"><a href="#faq">Preguntas</a><a href="#cotizar">Cotizar</a><a href="#contacto">Contacto</a></span>
      </footer>
    </div>
  );
}
