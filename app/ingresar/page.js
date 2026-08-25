'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import SicrLogo from '../components/SicrLogo';

export default function IngresarPage() {
  const [email, setEmail] = useState('admin@sicr3p.cl');
  const [password, setPassword] = useState('');
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
        router.push('/panel');
        router.refresh();
      } else {
        setError(data.error || 'No se pudo iniciar sesión.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 gap-8">
      <SicrLogo size="lg" />

      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Ingresar al panel</h1>
          <p className="text-xs text-slate-400">Acceso exclusivo para auditores habilitados de sicr3p.</p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-xs text-slate-400">Email</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500" required />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-xs text-slate-400">Contraseña</label>
          <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500" required />
        </div>

        {error && <div className="text-xs text-red-400 bg-red-950/40 border border-red-500/40 rounded p-2">{error}</div>}

        <button type="submit" disabled={cargando}
          className="bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
          <LogIn className="w-4 h-4" /> {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>

        <p className="text-[10px] text-slate-500 text-center">
          Demo: admin@sicr3p.cl / sicr3p2026
        </p>
      </form>
    </div>
  );
}
