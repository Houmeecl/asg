import Link from 'next/link';
import { ShieldCheck, FileCheck2, ArrowRight, Factory, MapPinned, ClipboardCheck, History, Users, Leaf, Route, Scale, BookOpenCheck } from 'lucide-react';
import SicrLogo from './components/SicrLogo';
import { obtenerUsuarioSesion } from '@/lib/auth';

const LINEAS = [
  {
    icon: Factory,
    titulo: 'Proveedor minero y maestranza',
    etiqueta: 'Operación industrial',
    descripcion: 'Expedientes por empresa, instalación, producto, lote, energía, combustible, producción, despacho y respaldo documental.',
  },
  {
    icon: ShieldCheck,
    titulo: 'CBAM preverificado',
    etiqueta: 'Bienes cubiertos UE',
    descripcion: 'Emite Informe Preverificado CBAM, validado por verificador registrado, con fuentes y brechas visibles.',
  },
  {
    icon: Route,
    titulo: 'Corredor Bioceánico + EUDR',
    etiqueta: 'Ruta, país y legalidad',
    descripcion: 'Conecta actor, país, documento y requisito: productor, exportador, transporte, aduana, destino y evaluación EUDR.',
  },
];

const PASOS = [
  { n: '1', titulo: 'Crea acceso', desc: 'Un administrador habilita usuarios internos para operar expedientes y cargar respaldo.' },
  { n: '2', titulo: 'Registra empresa', desc: 'Proveedor, instalación, producto, lote, período, país de origen y flujo aplicable.' },
  { n: '3', titulo: 'Carga evidencia', desc: 'Cada dato queda declarado, documentado o validado en fuente, con custodia SHA-256.' },
  { n: '4', titulo: 'Emite informe', desc: 'El expediente muestra cobertura, normas, trazabilidad, faltantes y estado de revisión.' },
];

const AUTOMATIZACIONES = [
  { icon: History, titulo: 'Bitácora automática', desc: 'Cada alta o cambio relevante crea un evento con actor, fecha y hash encadenado.' },
  { icon: ClipboardCheck, titulo: 'Plan de completitud', desc: 'El sistema detecta evidencia faltante por bloque, código CN, instalación y corredor.' },
  { icon: ShieldCheck, titulo: 'Normas versionadas', desc: 'Las referencias CBAM y EUDR quedan separadas por fuente, versión, hash y carácter legal.' },
  { icon: Factory, titulo: 'Plantillas de carga', desc: 'El usuario puede preparar evidencia típica de energía, combustible, producción, aduana, origen y EUDR.' },
  { icon: ArrowRight, titulo: 'Siguiente acción', desc: 'El expediente muestra el próximo pendiente para avanzar sin leer toda la norma.' },
  { icon: Users, titulo: 'Usuarios separados', desc: 'Proveedor/CBAM y Corredor/EUDR tienen accesos distintos para operar sin mezclar flujos.' },
];

const CORREDOR = [
  'Chile: origen, instalación, lote, DTE/OC y salida portuaria o fronteriza.',
  'Argentina, Bolivia, Paraguay, Perú y Brasil: tránsito, aduana, transporte, manifiestos y recepción.',
  'EUDR: aplicabilidad, producto relevante, código HS/CN, geolocalización, legalidad, riesgo y DDS/TRACES si existe.',
];

const NORMAS = [
  { icon: Scale, tipo: 'CBAM', estado: 'Texto UE + guías', titulo: 'Cálculo y verificación CBAM', desc: 'Metodologías, valores por defecto, benchmarks y guías para preparar el Informe Preverificado CBAM con límites explícitos.' },
  { icon: Leaf, tipo: 'EUDR', estado: 'Reglamento (UE) 2023/1115', titulo: 'Productos libres de deforestación', desc: 'Aplicabilidad, país de producción, geolocalización, legalidad, riesgo y referencia DDS/TRACES cuando corresponda.' },
  { icon: Route, tipo: 'Corredor', estado: 'Matriz operativa', titulo: 'Hitos por país y actor', desc: 'Chile, Argentina, Bolivia, Brasil, Paraguay y Perú con documentos esperados para origen, tránsito, aduana y destino.' },
];

export default async function LandingPage() {
  const usuario = await obtenerUsuarioSesion();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-10 flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="rounded-lg bg-slate-950 px-3 py-2"><SicrLogo size="sm" /></div>
        <nav className="flex items-center gap-3 text-sm">
          <Link href={usuario ? '/panel' : '/ingresar'} className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:border-emerald-600 hover:text-emerald-700 transition-colors">
            {usuario ? 'Ir al panel' : 'Ingresar'}
          </Link>
        </nav>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-16 md:py-20 grid lg:grid-cols-[1fr_.85fr] gap-10 items-center">
        <div className="flex flex-col gap-6">
        <span className="text-xs uppercase tracking-widest text-emerald-700 font-semibold">
          Infraestructura de evidencia industrial · Antofagasta, Chile
        </span>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl leading-tight">
          SICR3P hace simple ordenar evidencia industrial.
        </h1>
        <p className="text-slate-600 max-w-2xl text-sm md:text-base leading-relaxed">
          Un solo sistema para registrar empresa, abrir expediente, cargar respaldos y revisar qué falta.
          CBAM y Corredor/EUDR van separados para que nadie mezcle obligaciones ni documentos.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Link href={usuario ? '/panel' : '/ingresar'} className="bg-emerald-700 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-sm">
            {usuario ? 'Ir al panel' : 'Ingresar al panel'} <ArrowRight className="w-4 h-4" />
          </Link>
          {!usuario && <span className="px-4 py-3 text-xs text-slate-500">Acceso creado por administrador</span>}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 uppercase tracking-wider mt-2">
          <span>Custodia documental</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>Informe preverificado CBAM</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>Corredor + EUDR</span>
        </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm p-5">
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
            <div className="rounded bg-emerald-50 text-emerald-800 p-3">Empresa</div>
            <div className="rounded bg-sky-50 text-sky-800 p-3">Ruta</div>
            <div className="rounded bg-amber-50 text-amber-800 p-3">Norma</div>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            {['Registro de instalación y lote', 'Carga de evidencia y hash', 'Plan de completitud automático', 'Informe para revisión'].map((item) => <div key={item} className="flex items-center gap-3 rounded border border-slate-100 bg-slate-50 p-3"><FileCheck2 className="w-4 h-4 text-emerald-700" /><span>{item}</span></div>)}
          </div>
        </div>
      </section>

      <section className="bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <h2 className="text-2xl font-bold mb-2">Elige el camino correcto</h2>
          <p className="text-slate-600 text-sm mb-8">El usuario entra, escoge su flujo y avanza paso a paso. Lo técnico queda ordenado por detrás.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {LINEAS.map((linea) => (
              <div key={linea.titulo} className="rounded-lg border border-slate-200 bg-slate-50 p-5 flex flex-col gap-3">
                <linea.icon className="w-5 h-5 text-emerald-700" />
                <span className="text-[11px] uppercase tracking-widest text-slate-500">{linea.etiqueta}</span>
                <h3 className="text-base font-semibold text-slate-950">{linea.titulo}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{linea.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-14">
        <h2 className="text-2xl font-bold mb-2">Cuatro pasos, sin enredo</h2>
        <p className="text-slate-600 text-sm mb-8">Primero se registra, luego se documenta, después se revisa. Si falta algo, el sistema lo muestra.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PASOS.map((p) => (
            <div key={p.n} className="flex flex-col gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center text-sm font-bold">{p.n}</div>
              <h3 className="text-sm font-semibold text-slate-950">{p.titulo}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-sky-50 border-y border-sky-100">
        <div className="max-w-6xl mx-auto px-6 py-14 grid lg:grid-cols-[.8fr_1.2fr] gap-8">
          <div>
            <MapPinned className="w-7 h-7 text-sky-700 mb-4" />
            <h2 className="text-2xl font-bold mb-3">Corredor separado de CBAM</h2>
            <p className="text-sm text-slate-700 leading-relaxed">El corredor no es un certificado CBAM. Es una cadena documental por país, actor y requisito, con evaluación EUDR cuando el producto pueda estar cubierto por el reglamento de deforestación.</p>
          </div>
          <div className="grid gap-3">
            {CORREDOR.map((item) => <div key={item} className="rounded-lg bg-white border border-sky-100 p-4 text-sm text-slate-700">{item}</div>)}
          </div>
        </div>
      </section>

      <section className="bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="flex items-center gap-3 mb-3">
            <BookOpenCheck className="w-6 h-6 text-emerald-700" />
            <h2 className="text-2xl font-bold">Normas integradas</h2>
          </div>
          <p className="text-slate-600 text-sm mb-8">Las normas aparecen como guía práctica: qué revisar, qué documento falta y qué salida se puede emitir. SICR3P no reemplaza certificado oficial, declaración DDS ni asesoría legal del operador europeo.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {NORMAS.map((norma) => (
              <div key={norma.titulo} className="rounded-lg border border-slate-200 bg-slate-50 p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <norma.icon className="w-5 h-5 text-emerald-700" />
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">{norma.tipo}</span>
                </div>
                <span className="text-[11px] uppercase tracking-widest text-slate-500">{norma.estado}</span>
                <h3 className="text-base font-semibold text-slate-950">{norma.titulo}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{norma.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-14">
        <h2 className="text-2xl font-bold mb-2">Automatización del expediente</h2>
        <p className="text-slate-600 text-sm mb-8">El sistema reduce trabajo manual sin confundir evidencia con certificación oficial.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {AUTOMATIZACIONES.map((item) => (
            <div key={item.titulo} className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col gap-3 shadow-sm">
              <item.icon className="w-5 h-5 text-emerald-700" />
              <h3 className="text-sm font-semibold text-slate-950">{item.titulo}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Áreas de práctica (posicionamiento SICR3P) */}
      <section className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-700" />
          <h3 className="text-sm font-semibold">Empresa / proveedor</h3>
          <p className="text-xs text-slate-600 leading-relaxed">Controla la información que entrega y prepara expedientes reutilizables para sus mandantes.</p>
        </div>
        <div className="flex flex-col gap-2">
          <FileCheck2 className="w-6 h-6 text-emerald-700" />
          <h3 className="text-sm font-semibold">Mandante / minera</h3>
          <p className="text-xs text-slate-600 leading-relaxed">Revisa cobertura, origen y brechas de proveedores sin reemplazar al auditor independiente.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Users className="w-6 h-6 text-emerald-700" />
          <h3 className="text-sm font-semibold">Banco / inversionista</h3>
          <p className="text-xs text-slate-600 leading-relaxed">Observa trazabilidad, brechas y triple impacto social, ambiental y económico para decisiones de financiamiento.</p>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        © 2026 SICR3P · triple impacto: social · ambiental · económico
      </footer>
    </div>
  );
}
