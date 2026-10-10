import Link from 'next/link';
import { ArrowRight, MapPinned } from 'lucide-react';
import SicrLogo from './components/SicrLogo';
import { obtenerUsuarioSesion } from '@/lib/auth';
import './sicr-landing.css';

const FLUJOS = [
  {
    tag: 'Operación industrial',
    titulo: 'Proveedor minero y maestranza',
    desc: 'Expedientes por empresa, instalación, producto, lote, energía, combustible, producción y respaldo documental.',
  },
  {
    tag: 'Bienes cubiertos UE',
    titulo: 'CBAM preverificado',
    desc: 'Informe Preverificado CBAM con fuentes, brechas visibles y límites explícitos frente al certificado oficial.',
  },
  {
    tag: 'Ruta y legalidad',
    titulo: 'Corredor Bioceánico + EUDR',
    desc: 'Actor, país, documento y requisito: origen, tránsito, aduana, destino y evaluación EUDR cuando aplica.',
  },
];

const PASOS = [
  { n: '1', titulo: 'Crea acceso', desc: 'Un administrador habilita usuarios internos para operar expedientes.' },
  { n: '2', titulo: 'Registra empresa', desc: 'Proveedor, instalación, producto, lote, período y flujo aplicable.' },
  { n: '3', titulo: 'Carga evidencia', desc: 'Cada dato queda declarado o documentado, con custodia SHA-256.' },
  { n: '4', titulo: 'Emite informe', desc: 'Cobertura, normas, trazabilidad, faltantes y estado de revisión.' },
];

const NORMAS = [
  {
    k: 'CBAM',
    titulo: 'Cálculo y verificación',
    desc: 'Metodologías, valores por defecto y guías para preparar el Informe Preverificado con límites claros.',
  },
  {
    k: 'EUDR',
    titulo: 'Libre de deforestación',
    desc: 'Aplicabilidad, geolocalización, legalidad, riesgo y referencia DDS/TRACES cuando corresponda.',
  },
  {
    k: 'Corredor',
    titulo: 'Hitos por país',
    desc: 'Chile, Argentina, Bolivia, Brasil, Paraguay y Perú con documentos esperados en cada tramo.',
  },
];

export default async function LandingPage() {
  const usuario = await obtenerUsuarioSesion();
  const destino = usuario ? '/panel' : '/ingresar';

  return (
    <div className="sicr-lp min-h-screen">
      <header className="top">
        <div className="c">
          <Link href="/" className="brand-mark" aria-label="SICR3P inicio">
            <SicrLogo size="sm" contrast="dark" />
          </Link>
          <nav className="menu" aria-label="Secciones">
            <a href="#flujos">Flujos</a>
            <a href="#pasos">Cómo opera</a>
            <a href="#normas">Normas</a>
            <a href="#para-quien">Para quién</a>
          </nav>
          <div className="sp" />
          <Link href={destino} className="btn out sm">
            {usuario ? 'Ir al panel' : 'Ingresar'}
          </Link>
        </div>
      </header>

      <section className="hero" aria-label="Inicio">
        <img
          src="/brand/hero-industrial.jpg"
          alt="Operación industrial: infraestructura y evidencia en terreno"
          width={2400}
          height={1600}
          fetchPriority="high"
        />
        <div className="ov" aria-hidden="true" />
        <div className="c">
          <div className="brand-hero">
            sicr<span>3</span>p
          </div>
          <h1>
            Evidencia industrial ordenada.{' '}
            <em>Informes que se pueden revisar.</em>
          </h1>
          <p className="lead">
            Un solo sistema para registrar empresa, cargar respaldos y ver qué falta — CBAM y Corredor/EUDR sin mezclar obligaciones.
          </p>
          <div className="cta">
            <Link href={destino} className="btn lime">
              {usuario ? 'Abrir panel' : 'Ingresar al panel'} <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#flujos" className="btn ghost">
              Ver flujos
            </a>
          </div>
        </div>
      </section>

      <section className="sec tint" id="flujos">
        <div className="c">
          <div className="sh">
            <span className="eyebrow">Flujos</span>
            <h2>Elige el camino correcto</h2>
            <p>Entras, escoges tu flujo y avanzas paso a paso. Lo técnico queda ordenado por detrás.</p>
          </div>
          <div className="flows">
            {FLUJOS.map((f) => (
              <article key={f.titulo} className="flow">
                <span className="tag">{f.tag}</span>
                <h3>{f.titulo}</h3>
                <p>{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" id="pasos">
        <div className="c">
          <div className="sh">
            <span className="eyebrow">Operación</span>
            <h2>Cuatro pasos, sin enredo</h2>
            <p>Primero se registra, luego se documenta, después se revisa. Si falta algo, el sistema lo muestra.</p>
          </div>
          <div className="steps">
            {PASOS.map((p) => (
              <div key={p.n} className="step">
                <span className="n">{p.n}</span>
                <h3>{p.titulo}</h3>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec navy" id="normas">
        <div className="c">
          <div className="sh">
            <span className="eyebrow" style={{ color: 'var(--lime)' }}>Normas</span>
            <h2>Guía práctica, no certificado oficial</h2>
            <p>
              SICR3P no reemplaza certificado CBAM, declaración DDS ni asesoría legal del operador europeo.
              Muestra qué revisar, qué documento falta y qué salida se puede emitir.
            </p>
          </div>
          <div className="norm-row">
            {NORMAS.map((n) => (
              <div key={n.k} className="norm">
                <div className="k">{n.k}</div>
                <h3>{n.titulo}</h3>
                <p>{n.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 36, display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(241,245,242,.7)', fontSize: 14 }}>
            <MapPinned className="w-4 h-4" style={{ color: 'var(--lime)' }} />
            Antofagasta, Chile · infraestructura de evidencia para la cadena minera
          </div>
        </div>
      </section>

      <section className="sec" id="para-quien">
        <div className="c">
          <div className="sh">
            <span className="eyebrow">Triple impacto</span>
            <h2>Para quién trabaja SICR3P</h2>
            <p>Social · ambiental · económico — con trazabilidad que un tercero puede auditar.</p>
          </div>
          <div className="audiences">
            <div className="aud">
              <h3>Empresa / proveedor</h3>
              <p>Controla la información que entrega y prepara expedientes reutilizables para sus mandantes.</p>
            </div>
            <div className="aud">
              <h3>Mandante / minera</h3>
              <p>Revisa cobertura, origen y brechas de proveedores sin reemplazar al auditor independiente.</p>
            </div>
            <div className="aud">
              <h3>Banco / inversionista</h3>
              <p>Observa trazabilidad y brechas para decisiones de financiamiento sostenible.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="c">
          <h2>Listo para operar el expediente</h2>
          <p>Acceso creado por administrador. Demo: admin@sicr3p.cl</p>
          <div className="actions">
            <Link href={destino} className="btn lime">
              {usuario ? 'Ir al panel' : 'Ingresar'} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer>
        © 2026 SICR3P · triple impacto: social · ambiental · económico
      </footer>
    </div>
  );
}
