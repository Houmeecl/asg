'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, LogIn } from 'lucide-react';
import SicrLogo from '../components/SicrLogo';
import '../sicr-landing.css';

const DEMOS = [
  { email: 'empresa@sicr3p.cl', rol: 'Empresa → /portal' },
  { email: 'ops@sicr3p.cl', rol: 'Operador → /ops' },
  { email: 'admin@sicr3p.cl', rol: 'Admin → /ops' },
];

export default function IngresarPage() {
  const [email, setEmail] = useState('empresa@sicr3p.cl');
  const [password, setPassword] = useState('sicr3p2026');
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        const dest = data.destino || '/portal';
        router.push(dest);
        router.refresh();
      } else {
        setError(data.error || 'No se pudo iniciar sesión.');
      }
    } catch {
      setError('Error de conexión con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="sicr-lp min-h-screen grid lg:grid-cols-2">
      <aside
        className="relative hidden lg:flex flex-col justify-end p-10 text-white overflow-hidden"
        style={{ background: 'var(--navy)' }}
      >
        <img
          src="/brand/hero-industrial.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-45"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(15,31,46,.35) 0%, rgba(15,31,46,.92) 70%)',
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 max-w-md">
          <div className="text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: 'var(--fd)' }}>
            sicr<span style={{ color: 'var(--lime)' }}>3</span>p
            <span style={{ color: 'var(--lime)' }}>/</span>
          </div>
          <p className="text-lg leading-relaxed" style={{ color: 'rgba(241,245,242,.88)' }}>
            Acceso unificado: portal empresas, operaciones POS/lotes y administración.
            Pagos vía TUU + dLocal Go.
          </p>
        </div>
      </aside>

      <main className="flex flex-col justify-center px-6 py-12 sm:px-12 bg-[var(--bg)]">
        <div className="w-full max-w-md mx-auto flex flex-col gap-8">
          <div>
            <Link href="/" className="inline-block mb-6">
              <SicrLogo size="sm" contrast="dark" />
            </Link>
            <h1
              className="text-2xl font-semibold text-[var(--navy)]"
              style={{ fontFamily: 'var(--fd)' }}
            >
              Ingresar
            </h1>
            <p className="text-sm mt-2 text-[var(--ink-soft)]">
              Empresa, operador o admin — te llevamos al panel correcto.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white border border-[var(--line)] rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-[var(--ink-soft)]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-[var(--line)] rounded-xl px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(40,167,69,0.15)]"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-[var(--ink-soft)]">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-[var(--line)] rounded-xl px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(40,167,69,0.15)]"
                required
              />
            </div>

            {error && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="btn lime w-full disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {cargando ? 'Ingresando...' : 'Ingresar'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-[11px] text-[var(--ink-soft)] space-y-1">
              <p className="font-semibold">Cuentas demo (clave sicr3p2026):</p>
              {DEMOS.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  className="block w-full text-left hover:text-[var(--navy)]"
                  onClick={() => {
                    setEmail(d.email);
                    setPassword('sicr3p2026');
                  }}
                >
                  {d.email} — {d.rol}
                </button>
              ))}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
