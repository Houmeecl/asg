'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import SicrLogo from './SicrLogo';
import '../baas.css';

export default function BaasShell({ title, subtitle, nav, children, user }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/ingresar');
    router.refresh();
  }

  return (
    <div className="baas">
      <div className="baas-shell">
        <aside className="baas-side">
          <div className="brand">
            <Link href="/" aria-label="sicr3p inicio">
              <SicrLogo size="sm" contrast="light" compact />
            </Link>
          </div>
          <nav aria-label="Operación">
            {nav.map((item) => {
              const hrefs = nav.map((n) => n.href);
              const exact = pathname === item.href;
              const nested = pathname.startsWith(`${item.href}/`);
              // Avoid marking /ops active on /ops/open-banking (longer sibling wins).
              const longerMatch = hrefs.some(
                (h) => h !== item.href && h.startsWith(`${item.href}/`) && (pathname === h || pathname.startsWith(`${h}/`)),
              );
              const active = exact || (nested && !longerMatch);
              return (
                <Link key={item.href} href={item.href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="meta">
            <div className="who">
              <strong>{user?.nombre}</strong>
              <span>{user?.email}</span>
              {user?.rol ? <span className="rol">{user?.rol}</span> : null}
            </div>
            <button type="button" className="baas-logout" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        </aside>
        <main className="baas-main">
          <header className="baas-head">
            <h1>{title}</h1>
            {subtitle ? <p className="sub">{subtitle}</p> : null}
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}

export function formatClp(n) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(n || 0));
}

export function StatusPill({ estado }) {
  const map = {
    BORRADOR: 'info',
    PENDIENTE_REGISTRO: 'warn',
    PENDIENTE_COBRO: 'warn',
    COBRADA: 'info',
    EN_LOTE: 'info',
    ENVIADA: 'info',
    PAGADA: 'ok',
    RECHAZADA: 'bad',
    VIRTUAL: 'info',
    PENDIENTE: 'warn',
    EN_REVISION: 'warn',
    APROBADO: 'ok',
    RECHAZADO: 'bad',
    CONECTADO: 'ok',
    DESCONECTADO: 'info',
    EN_PRUEBA: 'warn',
    ALERTA: 'bad',
    CREATING: 'info',
    PENDING: 'warn',
    APPROVED: 'ok',
    BLOCKED: 'bad',
    CANCELED: 'info',
    REJECTED: 'bad',
  };
  return <span className={`baas-pill ${map[estado] || ''}`}>{estado}</span>;
}
