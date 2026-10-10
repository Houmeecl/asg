import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  Handshake,
  Leaf,
  Mail,
  MapPin,
  Phone,
  Settings2,
  Users,
} from 'lucide-react';
import LandingContactForm from './components/LandingContactForm';
import {
  Floating,
  HeroVisualMotion,
  Metric,
  MotionHeader,
  Reveal,
  Stagger,
  StaggerItem,
} from './components/LandingMotion';
import SicrLogo from './components/SicrLogo';
import { obtenerUsuarioSesion, destinoTrasLogin } from '@/lib/auth';
import { BAAS_LEGAL } from '@/lib/baas/config';
import { FOOTER_DISCLAIMER } from '@/lib/baas/legal-copy';
import './sicr-landing.css';
import './landing-mock.css';

const SOLUCIONES = [
  {
    key: 'desarrollo',
    tono: 'violeta',
    icon: Users,
    titulo: 'Desarrollo empresarial',
    desc: 'Capacidades, herramientas y acompañamiento para fortalecer tu negocio.',
  },
  {
    key: 'finanzas',
    tono: 'verde',
    icon: Leaf,
    titulo: 'Finanzas sostenibles',
    desc: 'Acercamos soluciones financieras para impulsar inversión, productividad y transición sostenible.',
  },
  {
    key: 'conexiones',
    tono: 'azul',
    icon: BarChart3,
    titulo: 'Oportunidades y conexiones',
    desc: 'Vinculación con empresas, programas y nuevas posibilidades de negocio.',
  },
  {
    key: 'operativas',
    tono: 'naranja',
    icon: Settings2,
    titulo: 'Soluciones operativas',
    desc: 'Herramientas que facilitan tu operación, cobranza y gestión diaria.',
    href: '/portal',
  },
];

const RUTA = [
  { n: 1, titulo: 'Conocemos', desc: 'Identificamos tus necesidades y oportunidades.' },
  { n: 2, titulo: 'Integramos', desc: 'Articulamos capacidades y soluciones.' },
  { n: 3, titulo: 'Activamos', desc: 'Te acompañamos en el proceso de implementación.' },
  { n: 4, titulo: 'Impulsamos', desc: 'Seguimos el progreso de tu empresa.' },
  { n: 5, titulo: 'Crecemos juntos', desc: 'Más empresas, más oportunidades, más territorio.' },
];

const IMPACTO = [
  { value: '+1.200', label: 'empresas conectadas', icon: Building2 },
  { value: '+350', label: 'oportunidades generadas', icon: Briefcase },
  { value: '+80', label: 'proyectos con enfoque sostenible', icon: Users },
  { value: '5', label: 'territorios en desarrollo', icon: Leaf },
];

const SECTORES = [
  'Comercio y servicios',
  'Alimentos y turismo',
  'Logística y transporte',
  'Industria y maestranza',
  'Energía y minería (proveedores)',
];

const SOCIAL_LINKS = [
  BAAS_LEGAL.social.linkedin
    ? { key: 'linkedin', href: BAAS_LEGAL.social.linkedin, label: 'LinkedIn', className: 'soc-li', mark: 'in' }
    : null,
  BAAS_LEGAL.social.instagram
    ? { key: 'instagram', href: BAAS_LEGAL.social.instagram, label: 'Instagram', className: 'soc-ig', mark: '◎' }
    : null,
].filter(Boolean);

export default async function LandingPage() {
  const usuario = await obtenerUsuarioSesion();
  const destino = usuario ? destinoTrasLogin(usuario) : '/ingresar';
  const telefono = BAAS_LEGAL.telefono;
  const telefonoHref = telefono.replace(/\s/g, '');

  return (
    <div className="sicr-lp lm min-h-screen">
      <MotionHeader className="lm-top">
        <div className="lm-c lm-top-in">
          <Link href="/" className="lm-brand" aria-label="sicr3p inicio">
            <SicrLogo size="md" contrast="dark" compact />
            <span className="lm-brand-div" aria-hidden="true" />
            <span className="lm-brand-tag">
              <strong>Soluciones que impulsan empresas</strong>
              <em>Una iniciativa de Proveedor Regional</em>
            </span>
          </Link>
          <nav className="lm-menu" aria-label="Secciones">
            <a href="#inicio" className="on">Inicio</a>
            <a href="#soluciones">Soluciones</a>
            <a href="#sectores">Sectores</a>
            <a href="#impacto">Impacto</a>
            <a href="#sobre">Sobre SICR3P</a>
            <a href="#recursos">Recursos</a>
            <a href="#contacto">Contacto</a>
          </nav>
          <Link href={destino} className="lm-login">
            {usuario ? 'Panel' : 'Ingresar'}
          </Link>
          <a href="#formulario" className="lm-btn solid lm-hablemos">
            Hablemos <ArrowRight size={16} />
          </a>
        </div>
      </MotionHeader>

      <section className="lm-hero" id="inicio" aria-label="Inicio">
        <div className="lm-c lm-hero-in">
          <Reveal className="lm-hero-copy">
            <p className="lm-eyebrow">Desarrollamos empresas. Acercamos soluciones.</p>
            <h1>
              Hoy más empresas
              <br />
              construyen <span className="g-a">un mejor</span> <span className="g-b">mañana</span>
            </h1>
            <p className="lm-lead">
              Integramos desarrollo empresarial y finanzas sostenibles para acercar soluciones que
              impulsan el crecimiento de las PYMEs y fortalecen el desarrollo de los territorios.
            </p>
            <div className="lm-cta">
              <a href="#soluciones" className="lm-btn solid">
                Conoce nuestras soluciones <ArrowRight size={16} />
              </a>
              <a href="#formulario" className="lm-btn outline">
                Contáctanos
              </a>
            </div>
          </Reveal>

          <HeroVisualMotion className="lm-hero-visual">
            <div className="lm-hero-shape" aria-hidden="true" />
            <img
              className="lm-hero-photo"
              src="/brand/hero-emprendedora.jpg"
              alt="Empresaria sonriendo en su espacio de trabajo — sicr3p"
              width={1600}
              height={2397}
              fetchPriority="high"
            />
            <p className="lm-hero-badge-blue">
              Empresas
              <br />
              más fuertes
              <br />
              Territorios
              <br />
              más prósperos
            </p>
            <ul className="lm-hero-values" aria-label="Valores">
              <li>Innovación</li>
              <li>Personas</li>
              <li>Sostenibilidad</li>
              <li>Oportunidades</li>
            </ul>
            <p className="lm-script lm-hero-script">
              El desarrollo
              <br />
              también se
              <br />
              construye aquí
            </p>
            <Floating className="lm-hero-pill-motion">
              <aside className="lm-hero-pill">
                <span className="ico" aria-hidden="true">
                  <Leaf size={20} />
                </span>
                <p>
                  Finanzas sostenibles
                  <br />
                  <span>para un crecimiento real</span>
                </p>
              </aside>
            </Floating>
          </HeroVisualMotion>
        </div>
      </section>

      <section className="lm-cards-sec" id="soluciones" aria-label="Soluciones">
        <div className="lm-c">
          <Stagger className="lm-cards">
            {SOLUCIONES.map((s) => {
              const Icon = s.icon;
              const body = (
                <>
                  <span className={`ico tono-${s.tono}`} aria-hidden="true">
                    <Icon size={34} strokeWidth={1.6} />
                  </span>
                  <div className="txt">
                    <h3>{s.titulo}</h3>
                    <p>{s.desc}</p>
                  </div>
                  <span className={`go tono-${s.tono}`} aria-hidden="true">
                    <ArrowRight size={16} />
                  </span>
                </>
              );
              return (
                <StaggerItem key={s.key} className="lm-card-motion">
                  {s.href ? (
                    <Link href={s.href} className={`lm-card tono-${s.tono}`}>
                      {body}
                    </Link>
                  ) : (
                    <a href="#formulario" className={`lm-card tono-${s.tono}`}>
                      {body}
                    </a>
                  )}
                </StaggerItem>
              );
            })}
          </Stagger>
          <Reveal className="lm-sectores" id="sectores">
            <span>Sectores</span>
            <ul>
              {SECTORES.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="lm-ruta" id="sobre" aria-label="Cómo lo hacemos">
        <div className="lm-c lm-ruta-in">
          <Reveal className="lm-ruta-head">
            <p className="lm-kicker">¿Cómo lo hacemos?</p>
            <h2>
              Una ruta clara
              <br />
              de crecimiento
            </h2>
            <span className="lm-uline" aria-hidden="true" />
            <p>
              Conectamos necesidades con soluciones para que más empresas puedan avanzar.
            </p>
          </Reveal>
          <Stagger className="lm-steps" as="ol">
            {RUTA.map((p, i) => (
              <StaggerItem key={p.n} as="li">
                <span className={`n n-${p.n}`}>{p.n}</span>
                {i < RUTA.length - 1 ? <ArrowRight className="arrow" size={20} aria-hidden="true" /> : null}
                <h3>{p.titulo}</h3>
                <p>{p.desc}</p>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal>
            <p className="lm-script lm-ruta-script" aria-hidden="true">
              Tu empresa
              <br />
              también deja
              <br />
              huella
            </p>
          </Reveal>
        </div>
      </section>

      <section className="lm-impact" id="impacto" aria-label="Impacto">
        <img src="/brand/impact-andes.jpg" alt="" aria-hidden="true" width={2000} height={1333} />
        <div className="lm-impact-ov" aria-hidden="true" />
        <div className="lm-c lm-impact-in">
          <Reveal className="lm-impact-title">
            <p>Nuestro impacto</p>
            <h2>
              Resultados que
              <br />
              impulsan territorios
            </h2>
          </Reveal>
          <Stagger className="lm-impact-grid">
            {IMPACTO.map((it) => {
              const Icon = it.icon;
              return (
                <Metric key={it.label} className="it">
                  <Icon size={26} strokeWidth={1.5} aria-hidden="true" />
                  <strong>{it.value}</strong>
                  <span>{it.label}</span>
                </Metric>
              );
            })}
          </Stagger>
          <Reveal className="lm-impact-end">
            <strong>
              Empresas que crecen.
              <br />
              Territorios que avanzan.
            </strong>
            <span className="lm-uline" aria-hidden="true" />
          </Reveal>
        </div>
      </section>

      <section className="lm-talk" id="contacto" aria-label="Contacto">
        <Reveal className="lm-c lm-talk-in">
          <div className="lm-talk-title">
            <h2>Hablemos</h2>
            <p>Cuéntanos cómo podemos trabajar juntos.</p>
            <a href="#formulario" className="go" aria-label="Ir al formulario">
              <ArrowRight size={18} />
            </a>
          </div>
          <a className="lm-talk-item" href={`mailto:${BAAS_LEGAL.email}`}>
            <Mail size={22} aria-hidden="true" />
            <span>{BAAS_LEGAL.email}</span>
          </a>
          <a className="lm-talk-item" href={`tel:${telefonoHref}`}>
            <Phone size={22} aria-hidden="true" />
            <span>{telefono}</span>
          </a>
          <div className="lm-talk-item">
            <MapPin size={22} aria-hidden="true" />
            <span>
              {BAAS_LEGAL.direccion.split(',')[0]}, Chile
              <br />
              <em>Con presencia en todo el país</em>
            </span>
          </div>
          {SOCIAL_LINKS.length > 0 ? (
            <div className="lm-social">
              <strong>Síguenos</strong>
              {SOCIAL_LINKS.map((s) => (
                <a key={s.key} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} className={s.className}>
                  {s.mark}
                </a>
              ))}
            </div>
          ) : null}
        </Reveal>
      </section>

      <section className="lm-form" id="formulario" aria-label="Formulario de contacto">
        <Reveal className="lm-c lm-form-in">
          <LandingContactForm />
        </Reveal>
      </section>

      <footer className="lm-foot" id="recursos">
        <div className="lm-c lm-foot-in">
          <div className="lm-foot-brand">
            <SicrLogo size="sm" contrast="dark" compact />
            <span>Una iniciativa de Proveedor Regional</span>
          </div>
          <nav className="lm-foot-links" aria-label="Legal">
            <Link href="/terminos">Términos y Condiciones</Link>
            <Link href="/privacidad">Política de Privacidad</Link>
            <Link href="/legal">Aviso Legal</Link>
            <a href="#contacto">Contacto</a>
          </nav>
          <p className="lm-foot-leaf">
            <Leaf size={30} strokeWidth={1.5} aria-hidden="true" />
            <span>
              Por empresas más sostenibles
              <br />y territorios con más oportunidades.
            </span>
          </p>
        </div>
        <div className="lm-c lm-foot-legal">
          <p>{FOOTER_DISCLAIMER}</p>
          <p>
            © {new Date().getFullYear()} {BAAS_LEGAL.razonSocial} · Dueña: {BAAS_LEGAL.fundacion.razonSocial} ·{' '}
            <Link href="/marca">Manual de marca</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
