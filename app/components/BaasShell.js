'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
            sicr<span>3</span>p/
          </div>
          <nav>
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="meta">
            <div>{user?.nombre}</div>
            <div>{user?.email}</div>
            <div style={{ marginTop: 8 }}>{user?.rol}</div>
            <button type="button" onClick={logout} style={{ marginTop: 12, color: 'var(--lime)', background: 'none', border: 0, cursor: 'pointer', padding: 0, fontSize: 12 }}>
              Cerrar sesión
            </button>
          </div>
        </aside>
        <main className="baas-main">
          <h1>{title}</h1>
          {subtitle ? <p className="sub">{subtitle}</p> : null}
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
  };
  return <span className={`baas-pill ${map[estado] || ''}`}>{estado}</span>;
}
