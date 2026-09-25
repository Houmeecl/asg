'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, UserPlus, Users } from 'lucide-react';

async function api(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'La operación no se pudo completar.');
  return data;
}

export default function UserModule() {
  const [usuarios, setUsuarios] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'AUDITOR', permisos: ['INDUSTRIAL'] });

  const cargarUsuarios = async () => {
    const data = await api('/api/usuarios');
    setUsuarios(data.usuarios);
  };

  useEffect(() => {
    (async () => {
      try {
        await cargarUsuarios();
      } catch (error) {
        setMensaje({ tipo: 'error', texto: error.message });
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const crear = async (event) => {
    event.preventDefault();
    setMensaje(null);
    try {
      await api('/api/usuarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      setForm({ nombre: '', email: '', password: '', rol: 'AUDITOR', permisos: ['INDUSTRIAL'] });
      await cargarUsuarios();
      setMensaje({ tipo: 'ok', texto: 'Usuario interno creado.' });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    }
  };

  if (cargando) return <p className="text-sm text-slate-400">Cargando usuarios...</p>;

  return <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-4">
    <form onSubmit={crear} className="panel-card">
      <h2><UserPlus /> Crear usuario</h2>
      <p>El acceso lo crea un administrador SICR3P. No existe registro publico abierto.</p>
      {mensaje && <div className={`rounded-lg border px-3 py-2 text-xs ${mensaje.tipo === 'error' ? 'border-red-400/50 bg-red-950/40 text-red-200' : 'border-emerald-400/40 bg-emerald-950/40 text-emerald-100'}`}>{mensaje.texto}</div>}
      <input required placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
      <input required type="email" placeholder="Correo" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input required type="password" minLength={10} placeholder="Contraseña temporal" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
        <option value="AUDITOR">Auditor</option>
        <option value="ADMIN">Administrador</option>
      </select>
      {form.rol !== 'ADMIN' && <div className="two-col">
        <label className="soft-card cursor-pointer"><span className="flex items-center gap-2"><input type="checkbox" checked={form.permisos.includes('INDUSTRIAL')} onChange={(event) => setForm({ ...form, permisos: event.target.checked ? [...new Set([...form.permisos, 'INDUSTRIAL'])] : form.permisos.filter((permiso) => permiso !== 'INDUSTRIAL') })} /> Proveedor / CBAM</span><small>Opera expedientes industriales y CBAM.</small></label>
        <label className="soft-card cursor-pointer"><span className="flex items-center gap-2"><input type="checkbox" checked={form.permisos.includes('CORREDOR')} onChange={(event) => setForm({ ...form, permisos: event.target.checked ? [...new Set([...form.permisos, 'CORREDOR'])] : form.permisos.filter((permiso) => permiso !== 'CORREDOR') })} /> Corredor + EUDR</span><small>Opera hitos de corredor y evaluación EUDR.</small></label>
      </div>}
      <button type="submit">Crear acceso</button>
    </form>

    <section className="panel-card">
      <h2><Users /> Usuarios SICR3P</h2>
      <p>Lista de cuentas habilitadas para crear expedientes, cargar evidencia y emitir informes desde el panel.</p>
      <div className="record-list">
        {usuarios.map((usuario) => <div className="record" key={usuario.id}>
          <strong>{usuario.nombre}</strong>
          <span>{usuario.email}</span>
          <small className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-400" /> {usuario.rol} · {(usuario.permisos || []).join(' + ') || 'sin permisos'} · creado {usuario.fecha_registro || 'sin fecha'}</small>
        </div>)}
      </div>
    </section>
  </div>;
}
