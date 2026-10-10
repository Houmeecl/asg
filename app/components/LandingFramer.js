'use client';

import Link from 'next/link';
import { motion, useReducedMotion, useInView, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
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
import LandingContactForm from './LandingContactForm';
import SicrWordmark from './SicrWordmark';

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
  {
    value: 1200,
    label: 'empresas conectadas',
    icon: Building2,
    format: (n) => `+${n.toLocaleString('es-CL')}`,
  },
  {
    value: 350,
    label: 'oportunidades generadas',
    icon: Briefcase,
    format: (n) => `+${n}`,
  },
  {
    value: 80,
    label: 'proyectos con enfoque sostenible',
    icon: Leaf,
    format: (n) => `+${n}`,
  },
  {
    value: 5,
    label: 'territorios en desarrollo',
    icon: Users,
    format: (n) => String(n),
  },
];

const RUTA = [
  { n: 1, titulo: 'Conocemos', desc: 'Identificamos necesidades y el contexto de tu empresa.' },
  { n: 2, titulo: 'Integramos', desc: 'Articulamos capacidades, datos y aliados.' },
  { n: 3, titulo: 'Activamos', desc: 'Acompañamos la conexión con soluciones concretas.' },
  { n: 4, titulo: 'Impulsamos', desc: 'Seguimos el progreso y ajustamos el plan.' },
  { n: 5, titulo: 'Crecemos juntos', desc: 'Más empresas, más oportunidades, más territorio.' },
];

const VALORES = [
  { icon: Building2, label: 'Empresas más competitivas' },
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

const ease = [0.22, 1, 0.36, 1];

function usePlay() {
  const [play, setPlay] = useState(false);
  useEffect(() => {
    // setTimeout (not rAF): headless/background tabs throttle rAF and leave Motion stuck.
    const id = setTimeout(() => setPlay(true), 30);
    return () => clearTimeout(id);
  }, []);
  return play;
}

function Counter({ value, format, active }) {
  const [display, setDisplay] = useState(format(0));
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!active) return;
    if (reduce) {
      setDisplay(format(value));
      return;
    }
    const controls = animate(0, value, {
      duration: 1.35,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(format(Math.round(v))),
    });
    return () => controls.stop();
  }, [active, value, format, reduce]);

  return <strong>{display}</strong>;
}

function ImpactStats({ items }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const reduce = useReducedMotion();

  return (
    <div className="impacto-grid" ref={ref}>
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.label}
            className="impacto-item"
            initial={reduce ? false : { opacity: 1, y: 20 }}
            animate={inView || reduce ? { opacity: 1, y: 0 } : { opacity: 1, y: 20 }}
            transition={{ duration: 0.55, ease, delay: reduce ? 0 : i * 0.08 }}
          >
            <Icon size={22} aria-hidden="true" />
            <Counter value={item.value} format={item.format} active={inView || reduce} />
            <span>{item.label}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

function Reveal({ children, className, delay = 0, y = 22 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 1, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease, delay: reduce ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}

export default function LandingFramer({ usuario, destino, legal }) {
  const reduce = useReducedMotion();
  const play = usePlay();
  const telefono = legal.telefono;
  const telefonoHref = telefono.replace(/\s/g, '');
  const social = [
    legal.social.linkedin
      ? { key: 'linkedin', href: legal.social.linkedin, label: 'LinkedIn', className: 'soc-li', mark: 'in' }
      : null,
    legal.social.instagram
      ? { key: 'instagram', href: legal.social.instagram, label: 'Instagram', className: 'soc-ig', mark: '○' }
      : null,
  ].filter(Boolean);

  const heroVisible = play || reduce;

  return (
    <div className={`sicr-lp framer brand-v2 fm-motion min-h-screen${play ? ' fm-ready' : ''}`}>
      <div className="grain" aria-hidden="true" />

      <header className="top">
        <div className="c">
          <Link href="/" className="brand-lockup" aria-label="sicr3p inicio">
            <SicrWordmark size="sm" contrast="dark" animate={!reduce} />
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
            <motion.p
              className="hero-eyebrow"
              initial={heroVisible && !reduce ? { opacity: 0, y: 18 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease }}
            >
              Desarrollo · Oportunidades · Finanzas sostenibles
            </motion.p>
            <motion.h1
              initial={heroVisible && !reduce ? { opacity: 0, y: 22 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease, delay: reduce ? 0 : 0.06 }}
            >
              Más empresas hoy.
              <br />
              Un mejor mañana.
            </motion.h1>
            <motion.p
              className="lead"
              initial={heroVisible && !reduce ? { opacity: 0, y: 18 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease, delay: reduce ? 0 : 0.12 }}
            >
              Integramos desarrollo empresarial y finanzas sostenibles para que más PYMEs crezcan
              con orden, conexiones y herramientas reales en el territorio.
            </motion.p>
            <motion.div
              className="cta"
              initial={heroVisible && !reduce ? { opacity: 0, y: 16 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease, delay: reduce ? 0 : 0.18 }}
            >
              <a href="#soluciones" className="btn brand">
                Conoce nuestras soluciones <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#contacto" className="btn out brand-out">
                Contáctanos
              </a>
            </motion.div>
            <motion.ul
              className="valor-row"
              initial={heroVisible && !reduce ? { opacity: 0, y: 14 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease, delay: reduce ? 0 : 0.26 }}
            >
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
            </motion.ul>
          </div>

          <div className="hero-visual">
            <motion.div
              className="hero-photo-wrap"
              initial={heroVisible && !reduce ? { opacity: 0, scale: 0.97, x: 20 } : false}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.85, ease, delay: reduce ? 0 : 0.12 }}
            >
              <img
                src="/brand/hero-emprendedora.jpg"
                alt="Empresaria en su espacio de trabajo — sicr3p"
                width={1600}
                height={2397}
                fetchPriority="high"
              />
            </motion.div>
            <motion.p
              className="hero-script"
              initial={heroVisible && !reduce ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.45, duration: 0.55 }}
            >
              Empresas que transforman su entorno
            </motion.p>
            <motion.aside
              className="hero-float"
              aria-label="Finanzas sostenibles"
              initial={false}
              animate={reduce ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, -10, 0] }}
              transition={
                reduce
                  ? { duration: 0.4 }
                  : { y: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' } }
              }
            >
              <span className="hero-float-icon" aria-hidden="true">
                <Leaf size={20} />
              </span>
              <p>
                Finanzas sostenibles para un crecimiento real
                <span>Impulsamos oportunidades. Construimos futuro.</span>
              </p>
            </motion.aside>
          </div>
        </div>
      </section>

      <section className="sec soluciones" id="soluciones">
        <div className="c">
          <Reveal className="sec-head dual">
            <div>
              <span className="eyebrow brand">Una visión integrada</span>
              <h2>Soluciones para cada etapa del crecimiento</h2>
            </div>
            <p>
              Trabajamos con aliados especializados para acompañar a tu empresa desde el diagnóstico
              hasta la operación diaria, con una misma mirada de territorio.
            </p>
          </Reveal>
          <div className="sol-grid">
            {SOLUCIONES.map((s, i) => {
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
              const motionProps = {
                className: `sol-card tono-${s.tono}`,
                initial: reduce ? false : { opacity: 1, scale: 0.96, y: 16 },
                whileInView: { opacity: 1, scale: 1, y: 0 },
                viewport: { once: true, amount: 0.25 },
                transition: { duration: 0.55, ease, delay: reduce ? 0 : i * 0.07 },
                whileHover: reduce ? undefined : { y: -4, transition: { duration: 0.2 } },
              };
              return s.href ? (
                <motion.div key={s.key} {...motionProps}>
                  <Link href={s.href} className="sol-card-link">
                    {inner}
                  </Link>
                </motion.div>
              ) : (
                <motion.a key={s.key} href="#contacto" {...motionProps}>
                  {inner}
                </motion.a>
              );
            })}
          </div>
        </div>
      </section>

      <section className="sec sectores" id="sectores">
        <div className="c">
          <Reveal className="sec-head">
            <span className="eyebrow brand">Sectores</span>
            <h2>Donde acompañamos el crecimiento</h2>
            <p>Presencia con PYMEs y proveedores regionales en rubros clave del norte de Chile.</p>
          </Reveal>
          <Reveal>
            <ul className="sector-chips">
              {SECTORES.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="impacto" id="impacto" aria-label="Impacto">
        <img
          src="/brand/impact-andes.jpg"
          alt=""
          aria-hidden="true"
          width={2000}
          height={1333}
        />
        <div className="impacto-ov" aria-hidden="true" />
        <div className="c impacto-inner split-impact">
          <Reveal className="impacto-copy">
            <h2>Impacto que se mide</h2>
            <p>Trabajamos por un ecosistema empresarial más fuerte, dinámico y sostenible.</p>
          </Reveal>
          <ImpactStats items={IMPACTO} />
        </div>
      </section>

      <section className="sec ruta" id="sobre">
        <div className="c">
          <Reveal className="sec-head">
            <span className="eyebrow brand">Cómo funciona</span>
            <h2>Una ruta clara para avanzar</h2>
          </Reveal>
          <div className="ruta-wrap">
            <ol className="ruta-steps">
              {RUTA.map((paso, i) => (
                <motion.li
                  key={paso.n}
                  initial={reduce ? false : { opacity: 1, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.55, ease, delay: reduce ? 0 : i * 0.08 }}
                >
                  <span className={`ruta-n n-${paso.n}`}>{paso.n}</span>
                  {i < RUTA.length - 1 ? <span className="ruta-arrow" aria-hidden="true" /> : null}
                  <h3>{paso.titulo}</h3>
                  <p>{paso.desc}</p>
                </motion.li>
              ))}
            </ol>
            <Reveal delay={0.3}>
              <p className="ruta-script" aria-hidden="true">
                Tu crecimiento también genera un futuro mejor
              </p>
            </Reveal>
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
          <Reveal className="contacto-visual" y={0}>
            <img
              src="/brand/contact-costa.jpg"
              alt="Costa y territorio — norte de Chile"
              width={1600}
              height={1064}
            />
            <div className="contacto-visual-copy">
              <h2>Construyamos el próximo paso de tu empresa</h2>
              <SicrWordmark size="sm" contrast="light" animate={false} className="contacto-brand" />
              <span className="contacto-tag">Soluciones que impulsan empresas</span>
            </div>
          </Reveal>
          <LandingContactForm />
          <aside className="contacto-aside">
            <h4>O contáctanos directamente</h4>
            <p>
              <a href={`mailto:${legal.email}`}>{legal.email}</a>
              <br />
              <a href={`tel:${telefonoHref}`}>{telefono}</a>
              <br />
              {legal.direccion}
              <br />
              <span className="aside-soft">Con presencia en todo el país.</span>
            </p>
            {social.length > 0 ? (
              <div className="social-row" aria-label="Redes">
                {social.map((s) => (
                  <a
                    key={s.key}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    className={s.className}
                  >
                    {s.mark}
                  </a>
                ))}
              </div>
            ) : null}
            <p className="aside-note">
              Dueña: {legal.fundacion.razonSocial}
              <br />
              Operadora: {legal.razonSocial}
            </p>
          </aside>
        </div>
      </section>

      <footer className="site-foot mock-foot">
        <div className="c foot-bar">
          <div className="foot-brand">
            <SicrWordmark size="xs" contrast="dark" animate={false} />
          </div>
          <nav className="foot-inline" aria-label="Legal">
            <Link href="/terminos">Términos y Condiciones</Link>
            <Link href="/privacidad">Política de Privacidad</Link>
            <Link href="/legal">Aviso Legal</Link>
            <a href="#contacto">Contacto</a>
          </nav>
          <p className="foot-copy-inline">
            © {new Date().getFullYear()} sicr3p · Dueña {legal.fundacion.razonSocial} · Operadora{' '}
            {legal.razonSocial}
          </p>
          <a href="#inicio" className="to-top" aria-label="Volver arriba">
            <ArrowUp size={18} />
          </a>
        </div>
      </footer>
    </div>
  );
}
