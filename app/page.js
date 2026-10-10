import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Handshake,
  Leaf,
  Settings2,
  Users,
  Building2,
  Network,
} from 'lucide-react';
import SiteFooter from './components/SiteFooter';
import LandingContactForm from './components/LandingContactForm';
import { obtenerUsuarioSesion, destinoTrasLogin } from '@/lib/auth';
import { BAAS_LEGAL } from '@/lib/baas/config';
import './sicr-landing.css';

const SOLUCIONES = [
  {
    key: 'desarrollo',
    tono: 'azul',
    icon: Building2,
    titulo: 'Desarrollo empresarial',
    desc: 'Capacidades, herramientas y acompañamiento para que tu empresa avance con orden y foco.',
  },
  {
    key: 'finanzas',
    tono: 'verde',
    icon: Leaf,
    titulo: 'Finanzas sostenibles',
    desc: 'Soluciones financieras responsables para inversión, productividad y crecimiento real.',
  },
  {
    key: 'conexiones',
    tono: 'violeta',
    icon: Handshake,
    titulo: 'Oportunidades y conexiones',
    desc: 'Redes, encuentros y puentes con compradores, aliados y territorios.',
  },
  {
    key: 'operativas',
    tono: 'naranja',
    icon: Settings2,
    titulo: 'Soluciones operativas',
    desc: 'Herramientas para el día a día: cobros, liquidación y panel operativo de tu operación.',
    href: '/portal',
  },
];

const IMPACTO = [
  { value: '+1.200', label: 'empresas conectadas', icon: Users },
  { value: '+350', label: 'oportunidades generadas', icon: Network },
  { value: '+80', label: 'proyectos con enfoque sostenible', icon: Leaf },
  { value: '5', label: 'territorios en desarrollo', icon: BarChart3 },
];

const RUTA = [
  { n: 1, titulo: 'Conocemos', desc: 'Identificamos necesidades y contexto de tu empresa.' },
  { n: 2, titulo: 'Integramos', desc: 'Articulamos capacidades, datos y aliados.' },
  { n: 3, titulo: 'Activamos', desc: 'Acompañamos la conexión con soluciones concretas.' },
  { n: 4, titulo: 'Impulsamos', desc: 'Seguimos el avance y ajustamos el plan.' },
  { n: 5, titulo: 'Crecemos juntos', desc: 'Más empresa, más territorio, más futuro.' },
];

const VALORES = [
  { icon: Leaf, label: 'Empresas más competitivas' },
  { icon: BarChart3, label: 'Territorios más fuertes' },
  { icon: Users, label: 'Crecimiento más inclusivo' },
];

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
            <a href="#inicio">Inicio</a>
            <a href="#soluciones">Soluciones</a>
            <a href="#impacto">Impacto</a>
            <a href="#ruta">Sobre SICR3P</a>
            <a href="#contacto">Contacto</a>
            <Link href="/legal">Legal</Link>
          </nav>
          <div className="sp" />
          <Link href={destino} className="btn out sm hide-sm">
            {usuario ? 'Abrir panel' : 'Ingresar'}
          </Link>
          <a href="#contacto" className="btn brand sm">
            Hablemos
          </a>
        </div>
      </header>

      <section className="hero-split" id="inicio" aria-label="Inicio">
        <div className="c hero-split-inner">
          <div className="hero-copy">
            <p className="brand-kicker">
              sicr<span>3</span>p<span className="slash">/</span>
            </p>
            <h1>
              Más empresas hoy.
              <br />
              Un mejor mañana.
            </h1>
            <p className="lead">
              Integramos desarrollo empresarial y finanzas sostenibles para impulsar a las PYMEs y
              fortalecer el territorio.
            </p>
            <div className="cta">
              <a href="#soluciones" className="btn brand">
                Conoce nuestras soluciones <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#contacto" className="btn out">
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
            <div className="hero-photo-wrap">
              <img
                src="/brand/hero-emprendedora.jpg"
                alt="Empresaria en su taller — sicr3p/"
                width={1200}
                height={1400}
                fetchPriority="high"
              />
              <p className="hero-script" aria-hidden="true">
                Empresas que transforman su entorno.
              </p>
              <aside className="hero-float">
                <span className="hero-float-icon" aria-hidden="true">
                  <Leaf size={20} />
                </span>
                <p>Finanzas sostenibles para un crecimiento real</p>
              </aside>
            </div>
          </div>
        </div>
      </section>

      <section className="sec soluciones" id="soluciones">
        <div className="c">
          <div className="sec-head dual">
            <h2>Soluciones para cada etapa del crecimiento</h2>
            <p>
              Desde el diagnóstico hasta la operación diaria: un mismo acompañamiento para que tu
              empresa avance con claridad.
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
                  <span className="sol-more">
                    Ver más <ArrowRight size={14} />
                  </span>
                </>
              );
              return s.href ? (
                <Link key={s.key} href={s.href} className={`sol-card tono-${s.tono}`}>
                  {inner}
                </Link>
              ) : (
                <article key={s.key} className={`sol-card tono-${s.tono}`}>
                  {inner}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="impacto" id="impacto" aria-label="Impacto">
        <img src="/brand/impact-andes.jpg" alt="" aria-hidden="true" />
        <div className="impacto-ov" aria-hidden="true" />
        <div className="c impacto-inner">
          <h2>Impacto que se mide</h2>
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

      <section className="sec ruta" id="ruta">
        <div className="c">
          <div className="sec-head">
            <h2>Una ruta clara para avanzar</h2>
            <p>Cinco pasos simples: de conocerte a crecer juntos.</p>
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
              <p className="brand-word light">
                sicr<span>3</span>p<span className="slash">/</span>
              </p>
              <h2>Construyamos el próximo paso de tu empresa</h2>
            </div>
          </div>
          <LandingContactForm />
          <aside className="contacto-aside">
            <h4>Contacto directo</h4>
            <p>
              <a href={`mailto:${BAAS_LEGAL.email}`}>{BAAS_LEGAL.email}</a>
              <br />
              <a href={`tel:${BAAS_LEGAL.telefono.replace(/\s/g, '')}`}>{BAAS_LEGAL.telefono}</a>
              <br />
              {BAAS_LEGAL.direccion}
            </p>
            <p className="aside-note">
              Dueña: {BAAS_LEGAL.fundacion.razonSocial}
              <br />
              Operadora: {BAAS_LEGAL.razonSocial}
            </p>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
