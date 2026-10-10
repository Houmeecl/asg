import Link from 'next/link';
import SicrLogo from './SicrLogo';
import SiteFooter from './SiteFooter';
import '../sicr-landing.css';

const LINKS = [
  { href: '/terminos', label: 'Términos' },
  { href: '/privacidad', label: 'Privacidad' },
  { href: '/legal', label: 'Datos PJ' },
  { href: '/contacto', label: 'Contacto' },
];

export default function LegalShell({ eyebrow, title, updated, children }) {
  return (
    <div className="sicr-lp min-h-screen">
      <header className="top">
        <div className="c">
          <Link href="/" className="brand-mark" aria-label="sicr3p/ inicio">
            <SicrLogo size="sm" contrast="dark" />
          </Link>
          <nav className="menu legal-nav" aria-label="Legal">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href}>{l.label}</Link>
            ))}
          </nav>
          <div className="sp" />
          <Link href="/ingresar" className="btn dark sm">Ingresar</Link>
        </div>
      </header>

      <section className="legal-hero">
        <div className="c">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          {updated ? <p className="legal-updated">{updated}</p> : null}
        </div>
      </section>

      <main className="sec legal-body">
        <div className="c legal-wrap">{children}</div>
      </main>

      <SiteFooter />
    </div>
  );
}
