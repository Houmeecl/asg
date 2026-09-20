'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const input = 'rounded-xl border border-[#0f1f2e]/15 bg-white px-4 py-3 text-sm normal-case tracking-normal font-normal text-[#0f1f2e]';
const label = 'flex flex-col gap-2 text-xs font-semibold uppercase tracking-wider text-[#0f1f2e]/60';

export default function LoginForm({ destino }) {
  const router = useRouter();
  const [modo, setModo] = useState('ingresar');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const registro = modo === 'registro';

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      const res = await fetch(`/api/seguros/${registro ? 'registro' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password: clave }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? 'No se pudo completar la solicitud.');
      router.push(destino);
      router.refresh();
    } catch {
      setError('No hay conexión con el servidor.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">{registro ? 'Crear cuenta' : 'Ingresar'}</h1>
      <p className="mt-2 text-sm text-[#0f1f2e]/65">
        {registro ? 'Crea tu cuenta para cotizar y guardar tus coberturas.' : 'Accede a tu panel de coberturas paramétricas.'}
      </p>

      <form onSubmit={enviar} className="mt-8 flex flex-col gap-4">
        {registro && (
          <label className={label}>Nombre
            <input required minLength={2} value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" className={input} />
          </label>
        )}
        <label className={label}>Correo
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="tu@empresa.cl" className={input} />
        </label>
        <label className={label}>Contraseña
          <input required type="password" minLength={registro ? 8 : undefined} value={clave} onChange={(e) => setClave(e.target.value)} autoComplete={registro ? 'new-password' : 'current-password'} className={input} />
          {registro && <span className="normal-case tracking-normal font-normal text-[#0f1f2e]/50">Mínimo 8 caracteres.</span>}
        </label>

        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

        <button disabled={enviando} className="rounded-full bg-[#0f1f2e] text-[#5ce08a] font-semibold py-3.5 hover:bg-[#1a3247] disabled:opacity-50">
          {enviando ? 'Un momento…' : registro ? 'Crear cuenta' : 'Ingresar'}
        </button>
      </form>

      <p className="mt-6 text-sm text-[#0f1f2e]/70">
        {registro ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'}{' '}
        <button type="button" onClick={() => { setModo(registro ? 'ingresar' : 'registro'); setError(''); }} className="font-semibold underline">
          {registro ? 'Ingresar' : 'Crear una'}
        </button>
      </p>

      <p className="mt-8 text-xs text-[#0f1f2e]/50 leading-relaxed rounded-xl bg-[#5ce08a]/40 px-4 py-3">
        Las pólizas de este sitio son una demostración: no tienen validez contractual ni respaldo de un asegurador.
      </p>
    </>
  );
}
