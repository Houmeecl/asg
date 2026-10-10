import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import SicrLogo from './components/SicrLogo';
import SiteFooter from './components/SiteFooter';
import { obtenerUsuarioSesion, destinoTrasLogin } from '@/lib/auth';
import { BAAS_LEGAL } from '@/lib/baas/config';
import './sicr-landing.css';

const CAPAS = [
  {
    tag: 'Cobro presencial',
    titulo: 'Terminales TUU',
    desc: 'Código en el portal, cobro con tarjeta en POS vía InterApp. SICR3P no toca el PAN ni liquida comercios ajenos.',
  },
  {
    tag: 'Liquidación',
    titulo: 'Saldo merchant dLocal Go',
    desc: 'Los fondos operativos viven en el saldo merchant de dLocal Go. El panel instruye payouts B2C/B2B documentados.',
  },
  {
    tag: 'Panel operativo',
    titulo: 'Plataforma tecnológica',
    desc: 'Solicitudes, beneficiarios, cola y lotes FIFO. Sin billetera pública ni emisión de medios de pago propios.',
  },
];

const PASOS = [
  { n: '1', titulo: 'Solicitud en el portal', desc: 'La empresa crea el pago, elige corredor y obtiene un código para POS.' },
  { n: '2', titulo: 'Cobro en TUU', desc: 'El operador cobra en terminal autorizado; el abono llega a la cuenta del comercio SICR3P.' },
  { n: '3', titulo: 'Lote y fondeo', desc: 'Ops cierra lote y fondea el saldo merchant dLocal Go desde treasury.' },
  { n: '4', titulo: 'Payout instruido', desc: 'El software libera FIFO vía API dLocal Go hacia la cuenta del beneficiario.' },
];

export default async function LandingPage() {
  const usuario = await obtenerUsuarioSesion();
  const destino = usuario ? destinoTrasLogin(usuario) : '/ingresar';

  return (
    <div className="sicr-lp min-h-screen">
      <header className="top">
        <div className="c">
          <Link href="/" className="brand-mark" aria-label="sicr3p/ inicio">
            <SicrLogo size="sm" contrast="dark" />
          </Link>
          <nav className="menu" aria-label="Secciones">
            <a href="#producto">Producto</a>
            <a href="#como">Cómo opera</a>
            <a href="#cumplimiento">Cumplimiento</a>
            <Link href="/contacto">Contacto</Link>
          </nav>
          <div className="sp" />
          <a className="btn out sm" href={`mailto:${BAAS_LEGAL.email}`}>
            {BAAS_LEGAL.email}
          </a>
          <Link href={destino} className="btn dark sm">
            {usuario ? 'Abrir panel' : 'Ingresar'}
          </Link>
        </div>
      </header>

      <section className="hero" aria-label="Inicio">
        <img
          src="/brand/hero-industrial.jpg"
          alt="Operación sicr3p/: plataforma de pagos y liquidación"
          width={2400}
          height={1600}
          fetchPriority="high"
        />
        <div className="ov" aria-hidden="true" />
        <div className="c">
          <div className="brand-hero">
            sicr<span>3</span>p<span style={{ color: 'var(--lime)' }}>/</span>
          </div>
          <h1>
            Pagos y liquidación para tu operación.{' '}
            <em>Software, no banco.</em>
          </h1>
          <p className="lead">
            Panel operativo para solicitar cobros en TUU, conciliar lotes y ejecutar payouts vía dLocal Go — sin custodiar fondos del público.
          </p>
          <div className="cta">
            <Link href="/portal" className="btn lime">
              Portal empresas <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href={destino} className="btn ghost">
              {usuario ? 'Continuar sesión' : 'Ingresar'}
            </Link>
          </div>
        </div>
      </section>

      <section className="sec tint" id="producto">
        <div className="c">
          <div className="sh">
            <span className="eyebrow">Producto</span>
            <h2>Una plataforma tecnológica de pagos</h2>
            <p>
              sicr3p/ opera como comercio + software: cobro presencial con TUU, pay-in y payouts con dLocal Go.
              El “saldo disponible” del panel es saldo merchant / operativo, no una cuenta bancaria de clientes.
            </p>
          </div>
          <div className="flows">
            {CAPAS.map((f) => (
              <article key={f.titulo} className="flow">
                <span className="tag">{f.tag}</span>
                <h3>{f.titulo}</h3>
                <p>{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" id="como">
        <div className="c">
          <div className="sh">
            <span className="eyebrow">Operación</span>
            <h2>Del código POS al payout</h2>
            <p>Flujo real que describen los términos: portal → TUU → fondeo → instrucción dLocal Go.</p>
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

      <section className="sec navy" id="cumplimiento">
        <div className="c">
          <div className="sh">
            <span className="eyebrow" style={{ color: 'var(--lime)' }}>
              Posicionamiento
            </span>
            <h2>Fuera del perímetro de emisor o billetera</h2>
            <p>
              No emitimos tarjeta prepago propia, no prometemos depósito ni cuenta con provisión de fondos a nombre sicr3p/.
              Cobro y payout los ejecutan proveedores autorizados (TUU, dLocal Go). Nosotros proveemos mandato, software y conciliación.
            </p>
          </div>
          <div className="norm-row">
            <div className="norm">
              <div className="k">TUU</div>
              <h3>Adquirente presencial</h3>
              <p>InterApp en terminales SUNMI/KOZEN. Voucher y liquidación del comercio SICR3P SpA.</p>
            </div>
            <div className="norm">
              <div className="k">dLocal Go</div>
              <h3>Pay-in y payouts</h3>
              <p>Checkout online y envíos a CL, PE, BR, AR, MX, EC, PY, UY según corredores documentados.</p>
            </div>
            <div className="norm">
              <div className="k">Legal</div>
              <h3>Términos claros</h3>
              <p>
                <Link href="/terminos" style={{ color: 'var(--lime)' }}>
                  Términos
                </Link>
                {' · '}
                <Link href="/privacidad" style={{ color: 'var(--lime)' }}>
                  Privacidad
                </Link>
                {' · '}
                <Link href="/legal" style={{ color: 'var(--lime)' }}>
                  Datos PJ
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="c">
          <h2>Activa el panel operativo</h2>
          <p>
            Demo: empresa@sicr3p.cl · ops@sicr3p.cl · admin@sicr3p.cl — clave sicr3p2026
          </p>
          <div className="actions">
            <Link href="/ingresar" className="btn lime">
              Ingresar <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/contacto" className="btn ghost">
              Hablar con nosotros
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
