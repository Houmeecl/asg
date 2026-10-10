import Link from 'next/link';
import SicrLogo from '../components/SicrLogo';
import '../sicr-landing.css';
import './marca.css';

export const metadata = {
  title: 'Manual de marca — sicr3p/',
  description: 'Identidad visual oficial SICR3P v1.0: logo, colores, tipografía y uso.',
};

const COLORS = [
  { name: 'Azul Profundo', hex: '#0F1B3D', varName: '--sicr-navy', use: 'Texto, fondos oscuros, UI principal' },
  { name: 'Violeta SICR3P', hex: '#6B5CF6', varName: '--sicr-violet', use: 'Acento «3/», CTAs, highlights' },
  { name: 'Verde Sostenible', hex: '#00B67A', varName: '--sicr-green', use: 'Impacto, finanzas sostenibles' },
  { name: 'Azul Claro', hex: '#E6F0FF', varName: '--sicr-blue-soft', use: 'Fondos suaves, chips' },
  { name: 'Gris Neutro', hex: '#F4F5F9', varName: '--sicr-gray', use: 'Fondos secundarios' },
];

export default function MarcaPage() {
  return (
    <div className="sicr-lp marca-page min-h-screen">
      <header className="top">
        <div className="c">
          <Link href="/" className="brand-lockup" aria-label="sicr3p inicio">
            <SicrLogo size="sm" contrast="dark" compact />
          </Link>
          <nav className="menu" aria-label="Secciones">
            <a href="#logo">Logo</a>
            <a href="#color">Color</a>
            <a href="#tipo">Tipografía</a>
            <a href="#uso">Uso</a>
          </nav>
          <div className="sp" />
          <Link href="/" className="btn brand sm">
            Volver al sitio
          </Link>
        </div>
      </header>

      <main className="c marca-main">
        <p className="eyebrow brand">Manual de marca · v1.0 · Octubre 2026</p>
        <h1>Identidad visual sicr3p/</h1>
        <p className="lead marca-lead">
          Integramos desarrollo empresarial y finanzas sostenibles para impulsar el crecimiento de
          las PYMEs y contribuir al desarrollo de los territorios. Una iniciativa de Proveedor
          Regional.
        </p>

        <section id="logo" className="marca-sec">
          <h2>01 · Logotipo</h2>
          <p className="marca-note">
            Wordmark en minúsculas. El acento violeta vive en «3/». No alterar proporciones ni
            recolorear fuera de las variantes oficiales.
          </p>
          <div className="marca-logo-grid">
            <figure className="marca-swatch light">
              <SicrLogo size="lg" contrast="dark" compact />
              <figcaption>Primario · fondo claro</figcaption>
            </figure>
            <figure className="marca-swatch dark">
              <SicrLogo size="lg" contrast="light" compact />
              <figcaption>Inverso · fondo navy</figcaption>
            </figure>
            <figure className="marca-swatch light">
              <SicrLogo size="lg" contrast="dark" variant="mono" compact />
              <figcaption>Monocromo</figcaption>
            </figure>
            <figure className="marca-swatch light">
              <SicrLogo size="lg" contrast="dark" variant="isotype" />
              <figcaption>Isotipo 3/</figcaption>
            </figure>
          </div>
          <p className="marca-tagline">Desarrollamos empresas. Acercamos soluciones.</p>
        </section>

        <section id="color" className="marca-sec">
          <h2>02 · Paleta</h2>
          <div className="marca-colors">
            {COLORS.map((c) => (
              <article key={c.hex} className="marca-color">
                <div className="chip" style={{ background: c.hex }} />
                <h3>{c.name}</h3>
                <p className="hex">{c.hex}</p>
                <p className="var">{c.varName}</p>
                <p className="use">{c.use}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="tipo" className="marca-sec">
          <h2>03 · Tipografía</h2>
          <p className="marca-note">
            Familia principal: <strong>Inter</strong> (Light → Bold). Títulos y cuerpo comparten la
            misma familia; la jerarquía va por peso y tamaño.
          </p>
          <div className="marca-type">
            <p className="t-display">Empresas que avanzan, territorios que crecen.</p>
            <p className="t-body">
              Aa Bb Cc Dd Ee · 0123456789 · Light / Regular / Medium / Semibold / Bold
            </p>
          </div>
        </section>

        <section id="uso" className="marca-sec">
          <h2>04 · Uso en producto</h2>
          <ul className="marca-list">
            <li>
              Tokens CSS en <code>app/brand.css</code> — fuente única de verdad.
            </li>
            <li>
              Componente <code>SicrLogo</code> — variantes full / mono / isotype.
            </li>
            <li>
              Landing y portales deben consumir <code>--sicr-*</code>, no hex sueltos.
            </li>
            <li>CTA primario: violeta SICR3P. Impacto / sostenibilidad: verde.</li>
          </ul>
          <div className="marca-cta-row">
            <Link href="/" className="btn brand">
              Ver landing
            </Link>
            <Link href="/docs/open-banking" className="btn out brand-out">
              Open Banking docs
            </Link>
            <Link href="/docs/legal/checklist" className="btn out">
              Checklist sitio
            </Link>
          </div>
        </section>
      </main>

      <footer className="marca-foot">
        <div className="c">
          © {new Date().getFullYear()} SICR3P SpA · Manual de marca v1.0 · Dueña Fundación
          Entretodos · Iniciativa de Proveedor Regional
        </div>
      </footer>
    </div>
  );
}
