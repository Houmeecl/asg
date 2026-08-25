import Link from 'next/link';
import { ShieldCheck, Leaf, FileCheck2, Truck, ArrowRight, Link2, Calculator, Radar } from 'lucide-react';
import SicrLogo from './components/SicrLogo';

const SERVICIOS = [
  {
    icon: Calculator,
    titulo: 'Contabilidad de carbono',
    descripcion: 'Sube tus documentos y obtén tu informe de emisiones, listo para tu Libro Mayor de Carbono.',
  },
  {
    icon: Link2,
    titulo: 'Trazabilidad y Pasaporte Digital',
    descripcion: 'Cada documento queda encadenado por hash y disponible en un Pasaporte Digital público, verificable con QR.',
  },
  {
    icon: Leaf,
    titulo: 'Declaración REP',
    descripcion: 'Declara la reciclabilidad de tu embalaje (Ley 20.920) junto con tu documento, sin trámites aparte.',
  },
  {
    icon: Radar,
    titulo: 'Atención en terreno',
    descripcion: 'Un operador de sicr3p captura tus documentos en tu propia faena, bodega o punto de despacho.',
  },
];

const PASOS = [
  { n: '1', titulo: 'Recoge el documento', desc: 'La operación entra con su origen, cantidad, material y documento base. Sin suposiciones ocultas.' },
  { n: '2', titulo: 'Calcula emisiones', desc: 'El motor usa factores reales, categoría y método de cálculo para convertir el dato en t CO2e.' },
  { n: '3', titulo: 'Publica trazabilidad', desc: 'La evidencia, el hash y la cadena quedan visibles para terceros — no solo un PDF bonito.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-5 border-b border-slate-800">
        <SicrLogo size="sm" />
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/ingresar" className="px-4 py-2 rounded-lg border border-slate-700 hover:border-emerald-500 hover:text-emerald-400 transition-colors">
            Ingresar
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center flex flex-col items-center gap-6">
        <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">
          Aseguramiento, forense y cumplimiento · Antofagasta, Chile
        </span>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight max-w-3xl">
          Demuestra tus datos <span className="text-emerald-400">sin revelar toda tu información.</span>
        </h1>
        <p className="text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed">
          Aseguramiento de sostenibilidad, contabilidad forense y cumplimiento del Modelo de Prevención de Delitos.
          Cuando tu cliente te pide con qué respaldas un dato, sicr3p le muestra qué factura, qué guía y qué compra lo
          sostienen — y nada más. Tus costos, tus márgenes y tus otros clientes no salen de tu empresa.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Link href="/ingresar" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
            Ingresar al panel <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500 uppercase tracking-wider mt-4">
          <span>GHG Protocol</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span>ISO 14064-1</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span>Factores HuellaChile</span>
        </div>
      </section>

      {/* Servicios */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-2">Nuestros servicios</h2>
        <p className="text-slate-400 text-center text-sm mb-10">Cuatro formas de trabajar con sicr3p, según lo que necesites.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICIOS.map((s) => (
            <div key={s.titulo} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center">
                <s.icon className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-100">{s.titulo}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{s.descripcion}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-2">Cómo funciona el motor</h2>
        <p className="text-slate-400 text-center text-sm mb-10">Un flujo simple y verificable: recopilar, calcular, publicar y auditar.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PASOS.map((p) => (
            <div key={p.n} className="flex flex-col gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">{p.n}</div>
              <h3 className="text-sm font-semibold text-slate-100">{p.titulo}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Áreas de práctica (posicionamiento SICR3P) */}
      <section className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <h3 className="text-sm font-semibold">Sustainability Assurance</h3>
          <p className="text-xs text-slate-400 leading-relaxed">Auditoría de indicadores ASG, inventarios de emisiones (Alcance 1, 2 y 3) y capital natural.</p>
        </div>
        <div className="flex flex-col gap-2">
          <FileCheck2 className="w-6 h-6 text-emerald-400" />
          <h3 className="text-sm font-semibold">Forensic &amp; Investigations</h3>
          <p className="text-xs text-slate-400 leading-relaxed">Detección de greenwashing, integridad documental y trazabilidad transaccional.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Truck className="w-6 h-6 text-emerald-400" />
          <h3 className="text-sm font-semibold">Compliance &amp; MPD Assurance</h3>
          <p className="text-xs text-slate-400 leading-relaxed">Evaluación independiente del Modelo de Prevención de Delitos (Ley N° 21.595).</p>
        </div>
      </section>

      <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
        © 2026 sicr3p — triple impacto: social · ambiental · económico
      </footer>
    </div>
  );
}
