'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import '../open-banking/ob.css';

const NAV = [
  { href: '/open-banking/console', label: 'Overview', tab: 'overview' },
  { href: '/open-banking/console?tab=clients', label: 'Clients', tab: 'clients' },
  { href: '/open-banking/console?tab=consents', label: 'Consents', tab: 'consents' },
  { href: '/open-banking/console?tab=payments', label: 'Payments', tab: 'payments' },
  { href: '/open-banking/console?tab=sandbox', label: 'Sandbox', tab: 'sandbox' },
];

export default function ObShell({ title, subtitle, children, user, activeTab = 'overview' }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/ingresar');
    router.refresh();
  }

  return (
    <div className="ob">
      <div className="ob-shell">
        <aside className="ob-side">
          <div>
            <Link href="/open-banking" className="mark" aria-label="Open Banking">
              sicr<span className="acc">3</span>p<span className="acc">/</span>
            </Link>
            <div className="tag">Open Banking Console</div>
          </div>
          <nav>
            {NAV.map((item) => (
              <Link
                key={item.tab}
                href={item.href}
                className={activeTab === item.tab || (item.tab === 'overview' && pathname === '/open-banking/console' && !activeTab) ? 'on' : ''}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/docs/open-banking">API docs</Link>
            <Link href="/ops">Ops BaaS (legacy)</Link>
          </nav>
          <div className="meta">
            <div>{user?.nombre}</div>
            <div>{user?.email}</div>
            <div style={{ marginTop: 6 }}>{user?.rol}</div>
            <button type="button" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        </aside>
        <main className="ob-main">
          <h1>{title}</h1>
          {subtitle ? <p className="sub">{subtitle}</p> : null}
          {children}
        </main>
      </div>
    </div>
  );
}
