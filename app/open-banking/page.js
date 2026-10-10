import Link from 'next/link';
import { ArrowRight, KeyRound, ShieldCheck, Workflow } from 'lucide-react';
import { obtenerUsuarioSesion } from '@/lib/auth';
import './ob.css';

export const metadata = {
  title: 'Open Banking — sicr3p/',
  description: 'API partner AIS/PIS: cuentas, consentimientos e iniciación de pagos sobre el rail BaaS.',
};

const CARDS = [
  {
    icon: KeyRound,
    title: 'OAuth client credentials',
    desc: 'Emite tokens con client_id + secret. Scopes accounts:read, transactions:read, payments:write.',
  },
  {
    icon: ShieldCheck,
    title: 'Consentimientos AIS',
    desc: 'Flujo AWAITING_AUTHORISATION → AUTHORISED. El partner solo ve datos del mandato autorizado.',
  },
  {
    icon: Workflow,
    title: 'PIS sobre dLocal',
    desc: 'Inicia pagos instruidos vía saldo merchant (simulador/sandbox). No custodia fondos del público.',
  },
];

export default async function OpenBankingLandingPage() {
  const usuario = await obtenerUsuarioSesion();
  const consoleHref =
    usuario && (usuario.rol === 'ADMIN' || usuario.rol === 'OPERADOR')
      ? '/open-banking/console'
      : '/ingresar';

  return (
    <div className="ob">
      <header className="ob-top">
        <div className="ob-c inner">
          <Link href="/open-banking" className="mark" aria-label="sicr3p open banking">
            sicr<span className="acc">3</span>p<span className="acc">/</span>
          </Link>
          <nav aria-label="Secciones">
            <a href="#producto">Producto</a>
            <Link href="/docs/open-banking">Docs</Link>
            <Link href="/terminos">Términos</Link>
          </nav>
          <div className="sp" />
          <Link href="/" className="ob-btn ghost sm">
            sicr3p home
          </Link>
          <Link href={consoleHref} className="ob-btn primary sm">
            {usuario ? 'Abrir console' : 'Ingresar'}
          </Link>
        </div>
      </header>

      <section className="ob-hero">
        <div className="ob-c">
          <span className="ob-eyebrow">Open Banking · AIS / PIS</span>
          <h1>Portal partner nuevo para Open Banking</h1>
          <p className="lead">
            Base de producto dedicada: consola, sandbox y API v1. Software y mandato para empresas —
            no banco, no billetera pública, no el panel ops legado.
          </p>
          <div className="cta">
            <Link href={consoleHref} className="ob-btn primary">
              Ir a la console <ArrowRight size={16} />
            </Link>
            <Link href="/docs/open-banking" className="ob-btn ghost">
              Ver documentación
            </Link>
          </div>

          <div className="ob-grid-3" id="producto">
            {CARDS.map((c) => {
              const Icon = c.icon;
              return (
                <article key={c.title} className="ob-card">
                  <div className="ico" aria-hidden="true">
                    <Icon size={20} />
                  </div>
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                </article>
              );
            })}
          </div>

          <div className="ob-card">
            <h3>Base URL</h3>
            <p className="ob-mono" style={{ marginTop: 8 }}>
              /api/open-banking/v1
            </p>
            <p style={{ marginTop: 12 }}>
              Demo e2e: <code className="ob-mono">npm run baas:e2e</code> ·{' '}
              <code className="ob-mono">node scripts/open-banking-e2e.mjs</code>
            </p>
          </div>
        </div>
      </section>

      <footer className="ob-foot">
        <div className="ob-c">
          © {new Date().getFullYear()} sicr3p/ Open Banking · Operadora SICR3P SpA · Dueña Fundación
          Entretodos
        </div>
      </footer>
    </div>
  );
}
