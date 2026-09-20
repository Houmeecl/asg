'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { guardarSesion } from '../demoSession';
import { BASE } from '../data';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');

  function entrar(datos) {
    guardarSesion(datos);
    router.push(`${BASE}/onboarding`);
  }

  return (
    <div className="mt-8 flex flex-col gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          entrar({ email, nombre: email.split('@')[0], poliza: null });
        }}
        className="flex flex-col gap-4"
      >
        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wider text-[#0b1a12]/60">
          Correo
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@empresa.cl" className="rounded-xl border border-[#0b1a12]/15 bg-white px-4 py-3 text-sm normal-case tracking-normal font-normal text-[#0b1a12]" />
        </label>
        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wider text-[#0b1a12]/60">
          Contraseña
          <input required type="password" value={clave} onChange={(e) => setClave(e.target.value)} placeholder="••••••••" className="rounded-xl border border-[#0b1a12]/15 bg-white px-4 py-3 text-sm normal-case tracking-normal font-normal text-[#0b1a12]" />
        </label>
        <button className="rounded-full bg-[#0b1a12] text-[#d7ff3f] font-semibold py-3.5 hover:bg-[#16301f]">Ingresar</button>
      </form>

      <div className="flex items-center gap-3 text-xs text-[#0b1a12]/40"><span className="h-px flex-1 bg-[#0b1a12]/10" />o<span className="h-px flex-1 bg-[#0b1a12]/10" /></div>

      <button onClick={() => entrar({ email: 'invitado@demo.cl', nombre: 'Invitado', poliza: null })} className="rounded-full border border-[#0b1a12] font-semibold py-3.5 hover:bg-white">
        Entrar como invitado
      </button>

      <p className="text-xs text-[#0b1a12]/50 leading-relaxed rounded-xl bg-[#d7ff3f]/40 px-4 py-3">
        Modo demo: no hay autenticación real. Cualquier correo y contraseña funcionan, y los datos se guardan solo en este navegador.
      </p>
    </div>
  );
}
