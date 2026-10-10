import Link from 'next/link';
import {
  ArrowRight,
  ArrowUp,
  BarChart3,
  Briefcase,
  Building2,
  Handshake,
  Leaf,
  Settings2,
  Users,
} from 'lucide-react';
import LandingContactForm from './components/LandingContactForm';
import { obtenerUsuarioSesion, destinoTrasLogin } from '@/lib/auth';
import { BAAS_LEGAL } from '@/lib/baas/config';
import './sicr-landing.css';

const SOLUCIONES = [
  {
    key: 'desarrollo',
    tono: 'azul',
    icon: Users,
    titulo: 'Desarrollo empresarial',
    desc: 'Capacidades, herramientas y acompañamiento para que tu empresa avance con orden y foco.',
  },
  {
    key: 'finanzas',
    tono: 'verde',
    icon: Leaf,
    titulo: 'Finanzas sostenibles',
    desc: 'Acercamos soluciones financieras que impulsan inversión, productividad y crecimiento real.',
  },
  {
    key: 'conexiones',
    tono: 'violeta',
    icon: Handshake,
    titulo: 'Oportunidades y conexiones',
    desc: 'Vinculación con empresas, programas y aliados para abrir puertas en el territorio.',
  },
  {
    key: 'operativas',
    tono: 'naranja',
    icon: Settings2,
    titulo: 'Soluciones operativas',
    desc: 'Herramientas que facilitan tu operación, cobranza y liquidación día a día.',
    href: '/portal',
  },
];

const IMPACTO = [
  { value: '+1.200', label: 'empresas conectadas', icon: Building2 },
  { value: '+350', label: 'oportunidades generadas', icon: Briefcase },
  { value: '+80', label: 'proyectos con enfoque sostenible', icon: Leaf },
  { value: '5', label: 'territorios en desarrollo', icon: Users },
];

const RUTA = [
  { n: 1, titulo: 'Conocemos', desc: 'Identificamos necesidades y el contexto de tu empresa.' },
  { n: 2, titulo: 'Integramos', desc: 'Articulamos capacidades, datos y aliados.' },
  { n: 3, titulo: 'Activamos', desc: 'Acompañamos la conexión con soluciones concretas.' },
  { n: 4, titulo: 'Impulsamos', desc: 'Seguimos el progreso y ajustamos el plan.' },
  { n: 5, titulo: 'Crecemos juntos', desc: 'Más empresas, más oportunidades, más territorio.' },
];

const VALORES = [
  { icon: Leaf, label: 'Empresas más competitivas' },
  { icon: BarChart3, label: 'Territorios más fuertes' },
  { icon: Users, label: 'Crecimiento más inclusivo' },
];

const SECTORES = [
  'Comercio y servicios',
  'Alimentos y turismo',
  'Logística y transporte',
  'Industria y maestranza',
  'Energía y minería (proveedores)',
];

const PHONE_DISPLAY = '+56 9 1234 5678';

export default async function LandingPage() {
  const usuario = await obtenerUsuarioSesion();
  const destino = usuario ? destinoTrasLogin(usuario) : '/ingresar';

  return (
    <div className="sicr-lp framer brand-v2 min-h-screen">
      <div className="grain" aria-hidden="true" />

      <header className="top">
        <div className="c">
          <Link href="/" className="brand-lockup" aria-label="sicr3p/ inicio">
            <span className="brand-word">
              sicr<span>3</span>p<span className="slash">/</span>
            </span>
            <span className="brand-tag">Soluciones que impulsan empresas</span>
          </Link>
          <nav className="menu" aria-label="Secciones">
            <a href="#inicio" className="is-active">
              Inicio
            </a>
            <a href="#soluciones">Soluciones</a>
            <a href="#sectores">Sectores</a>
            <a href="#impacto">Impacto</a>
            <a href="#sobre">Sobre SICR3P</a>
            <a href="#recursos">Recursos</a>
            <a href="#contacto">Contacto</a>
          </nav>
          <div className="sp" />
          <Link href={destino} className="nav-login hide-sm">
            {usuario ? 'Panel' : 'Ingresar'}
          </Link>
          <a href="#contacto" className="btn brand sm">
            Hablemos
          </a>
        </div>
      </header>

      <section className="hero-split" id="inicio" aria-label="Inicio">
        <div className="c hero-split-inner">
          <div className="hero-copy">
            <p className="hero-eyebrow">Desarrollo · Oportunidades · Finanzas sostenibles</p>
            <h1>
              Más empresas hoy.
              <br />
              Un mejor mañana.
            </h1>
            <p className="lead">
              Integramos desarrollo empresarial y finanzas sostenibles para acercar soluciones que
              impulsan el crecimiento de las PYMEs y fortalecen el desarrollo de los territorios.
            </p>
            <div className="cta">
              <a href="#soluciones" className="btn brand">
                Conoce nuestras soluciones <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#contacto" className="btn out brand-out">
                Contáctanos
              </a>
            </div>
            <ul className="valor-row">
              {VALORES.map((v) => {
                const Icon = v.icon;
                return (
                  <li key={v.label}>
                    <span className="valor-icon" aria-hidden="true">
                      <Icon size={18} />
                    </span>
                    <span>{v.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="hero-visual">
            <div className="hero-photo-wrap mock-photo">
              <img
                src="/brand/hero-emprendedora.jpg"
                alt="Empresaria en su taller — sicr3p/"
                width={1200}
                height={1400}
                fetchPriority="high"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="sec soluciones" id="soluciones">
        <div className="c">
          <div className="sec-head dual">
            <div>
              <span className="eyebrow brand">Una visión integrada</span>
              <h2>Soluciones para cada etapa del crecimiento</h2>
            </div>
            <p>
              Trabajamos con aliados especializados para acompañar a tu empresa desde el diagnóstico
              hasta la operación diaria, con una misma mirada de territorio.
            </p>
          </div>
          <div className="sol-grid">
            {SOLUCIONES.map((s) => {
              const Icon = s.icon;
              const inner = (
                <>
                  <span className={`sol-icon tono-${s.tono}`} aria-hidden="true">
                    <Icon size={22} />
                  </span>
                  <h3>{s.titulo}</h3>
                  <p>{s.desc}</p>
                  <span className={`sol-more tono-${s.tono}`}>
                    Ver más <ArrowRight size={14} />
                  </span>
                </>
              );
              return s.href ? (
                <Link key={s.key} href={s.href} className={`sol-card tono-${s.tono}`}>
                  {inner}
                </Link>
              ) : (
                <a key={s.key} href="#contacto" className={`sol-card tono-${s.tono}`}>
                  {inner}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section className="sec sectores" id="sectores">
        <div className="c">
          <div className="sec-head">
            <span className="eyebrow brand">Sectores</span>
            <h2>Donde acompañamos el crecimiento</h2>
            <p>Presencia con PYMEs y proveedores regionales en rubros clave del norte de Chile.</p>
          </div>
          <ul className="sector-chips">
            {SECTORES.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="impacto" id="impacto" aria-label="Impacto">
        <img src="/brand/impact-andes.jpg" alt="" aria-hidden="true" />
        <div className="impacto-ov" aria-hidden="true" />
        <div className="c impacto-inner split-impact">
          <div className="impacto-copy">
            <h2>Impacto que se mide</h2>
            <p>
              Trabajamos por un ecosistema empresarial más fuerte, dinámico y sostenible.
            </p>
          </div>
          <div className="impacto-grid">
            {IMPACTO.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="impacto-item">
                  <Icon size={22} aria-hidden="true" />
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="sec ruta" id="sobre">
        <div className="c">
          <div className="sec-head">
            <span className="eyebrow brand">Cómo funciona</span>
            <h2>Una ruta clara para avanzar</h2>
          </div>
          <div className="ruta-wrap">
            <ol className="ruta-steps">
              {RUTA.map((paso, i) => (
                <li key={paso.n}>
                  <span className={`ruta-n n-${paso.n}`}>{paso.n}</span>
                  {i < RUTA.length - 1 ? <span className="ruta-arrow" aria-hidden="true" /> : null}
                  <h3>{paso.titulo}</h3>
                  <p>{paso.desc}</p>
                </li>
              ))}
            </ol>
            <p className="ruta-script" aria-hidden="true">
              Tu crecimiento también genera un futuro mejor
            </p>
          </div>
        </div>
      </section>

      <section className="sec recursos" id="recursos">
        <div className="c recursos-row">
          <div>
            <span className="eyebrow brand">Recursos</span>
            <h2>Documentos y acceso</h2>
            <p>Términos, privacidad y datos de la sociedad — siempre visibles.</p>
          </div>
          <div className="recursos-links">
            <Link href="/terminos">
              Términos y condiciones <ArrowRight size={16} />
            </Link>
            <Link href="/privacidad">
              Política de privacidad <ArrowRight size={16} />
            </Link>
            <Link href="/legal">
              Aviso legal / Datos PJ <ArrowRight size={16} />
            </Link>
            <Link href={destino}>
              {usuario ? 'Abrir panel' : 'Ingresar al panel'} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="contacto-band" id="contacto">
        <div className="c contacto-grid">
          <div className="contacto-visual">
            <img
              src="/brand/contact-costa.jpg"
              alt="Territorio costero — Antofagasta y norte de Chile"
              width={900}
              height={1100}
            />
            <div className="contacto-visual-copy">
              <h2>Construyamos el próximo paso de tu empresa</h2>
              <p className="brand-word light">
                sicr<span>3</span>p<span className="slash">/</span>
              </p>
              <span className="contacto-tag">Soluciones que impulsan empresas</span>
            </div>
          </div>
          <LandingContactForm />
          <aside className="contacto-aside">
            <h4>O contáctanos directamente</h4>
            <p>
              <a href={`mailto:${BAAS_LEGAL.email}`}>{BAAS_LEGAL.email}</a>
              <br />
              <a href={`tel:${PHONE_DISPLAY.replace(/\s/g, '')}`}>{PHONE_DISPLAY}</a>
              <br />
              Antofagasta, Chile.
              <br />
              <span className="aside-soft">Con presencia en todo el país.</span>
            </p>
            <div className="social-row" aria-label="Redes">
              <a
                href={BAAS_LEGAL.social.linkedin || 'https://www.linkedin.com/'}
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="soc-li"
              >
                in
              </a>
              <a
                href="https://www.youtube.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="soc-yt"
              >
                ▶
              </a>
              <a
                href={BAAS_LEGAL.social.instagram || 'https://www.instagram.com/'}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="soc-ig"
              >
                ○
              </a>
            </div>
            <p className="aside-note">
              Dueña: {BAAS_LEGAL.fundacion.razonSocial}
              <br />
              Operadora: {BAAS_LEGAL.razonSocial}
            </p>
          </aside>
        </div>
      </section>

      <footer className="site-foot mock-foot">
        <div className="c foot-bar">
          <div className="foot-brand">
            sicr<span>3</span>p<span className="slash">/</span>
          </div>
          <nav className="foot-inline" aria-label="Legal">
            <Link href="/terminos">Términos y Condiciones</Link>
            <Link href="/privacidad">Política de Privacidad</Link>
            <Link href="/legal">Aviso Legal</Link>
            <a href="#contacto">Contacto</a>
          </nav>
          <p className="foot-copy-inline">
            © {new Date().getFullYear()} SICR3P. Una iniciativa de Proveedor Regional.
          </p>
          <a href="#inicio" className="to-top" aria-label="Volver arriba">
            <ArrowUp size={18} />
          </a>
        </div>
      </footer>
    </div>
  );
}
