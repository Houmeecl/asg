'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export default function LandingContactForm() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setCargando(true);
    setEstado(null);
    try {
      const res = await fetch('/api/baas/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, mensaje, empresa }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo enviar');
      setEstado({ ok: true, msg: 'Mensaje recibido. Te contactaremos a la brevedad.' });
      setNombre('');
      setEmail('');
      setEmpresa('');
      setMensaje('');
    } catch (err) {
      setEstado({ ok: false, msg: err.message });
    } finally {
      setCargando(false);
    }
  }

  return (
    <form className="hablamos-form" onSubmit={onSubmit}>
      <h3>Hablemos</h3>
      <label>
        Nombre completo
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre"
          required
          autoComplete="name"
        />
      </label>
      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@empresa.cl"
          required
          autoComplete="email"
        />
      </label>
      <label>
        Empresa
        <input
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
          placeholder="Nombre de tu empresa"
          autoComplete="organization"
        />
      </label>
      <label>
        Mensaje
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Cuéntanos en qué podemos acompañarte"
          rows={4}
          required
        />
      </label>
      {estado ? (
        <p className={`form-msg ${estado.ok ? 'ok' : 'err'}`}>{estado.msg}</p>
      ) : null}
      <button type="submit" className="btn brand" disabled={cargando}>
        {cargando ? 'Enviando…' : 'Enviar mensaje'}
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}
