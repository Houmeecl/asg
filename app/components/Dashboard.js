'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Database, LogOut, Factory, Users, MapPinned } from 'lucide-react';
import SicrLogo from './SicrLogo';
import EvidenceModule from './EvidenceModule';
import UserModule from './UserModule';

export default function Dashboard({ usuario }) {
  const puedeIndustrial = usuario.rol === 'ADMIN' || usuario.permisos?.includes('INDUSTRIAL');
  const puedeCorredor = usuario.rol === 'ADMIN' || usuario.permisos?.includes('CORREDOR');
  const [vista, setVista] = useState(puedeIndustrial ? 'INDUSTRIAL' : puedeCorredor ? 'CORREDOR' : 'SIN_PERMISOS');
  const subtitulo = usuario.rol === 'ADMIN'
    ? 'Proveedor minero · CBAM · Corredor + EUDR'
    : [puedeIndustrial ? 'Proveedor minero · CBAM' : null, puedeCorredor ? 'Corredor + EUDR' : null].filter(Boolean).join(' · ');
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/ingresar');
    router.refresh();
  };

  return (
    <div className="min-h-screen p-6 flex flex-col gap-6" style={{ background: 'var(--sicr-bg)', color: 'var(--sicr-ink)' }}>
      <header className="flex flex-wrap justify-between items-center gap-4 border-b pb-4" style={{ borderColor: 'var(--sicr-line)' }}>
        <div className="flex items-center gap-3">
          <Link href="/" title="Volver a la landing" className="rounded-xl px-3 py-2" style={{ background: 'var(--sicr-navy)' }}>
            <SicrLogo />
          </Link>
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--sicr-navy)', fontFamily: 'var(--font-display), sans-serif' }}>
              Infraestructura de evidencia industrial
            </div>
            <p className="text-xs" style={{ color: 'var(--sicr-ink-soft)' }}>{subtitulo || 'Sin permisos asignados'}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm" style={{ border: '1px solid var(--sicr-line)', color: 'var(--sicr-primary)' }}>
            <Database className="w-4 h-4" /> Custodia SHA-256 y acceso autenticado
          </div>
          <div className="flex bg-white rounded-xl overflow-hidden text-xs shadow-sm" style={{ border: '1px solid var(--sicr-line)' }} role="tablist" aria-label="Módulos SICR3P">
            {puedeIndustrial && <button role="tab" aria-selected={vista === 'INDUSTRIAL'} onClick={() => setVista('INDUSTRIAL')}
              className={`px-3 py-2 flex items-center gap-1.5 ${vista === 'INDUSTRIAL' ? 'text-white' : 'hover:opacity-80'}`}
              style={vista === 'INDUSTRIAL' ? { background: 'var(--sicr-primary)' } : { color: 'var(--sicr-ink-soft)' }}>
              <Factory className="w-3.5 h-3.5" /> Proveedor / CBAM
            </button>}
            {puedeCorredor && <button role="tab" aria-selected={vista === 'CORREDOR'} onClick={() => setVista('CORREDOR')}
              className={`px-3 py-2 flex items-center gap-1.5 ${vista === 'CORREDOR' ? 'text-white' : 'hover:opacity-80'}`}
              style={vista === 'CORREDOR' ? { background: '#0f4c5c' } : { color: 'var(--sicr-ink-soft)' }}>
              <MapPinned className="w-3.5 h-3.5" /> Corredor + EUDR
            </button>}
            {usuario.rol === 'ADMIN' && <button role="tab" aria-selected={vista === 'USUARIOS'} onClick={() => setVista('USUARIOS')}
              className={`px-3 py-2 flex items-center gap-1.5 ${vista === 'USUARIOS' ? 'text-white' : 'hover:opacity-80'}`}
              style={vista === 'USUARIOS' ? { background: 'var(--sicr-navy)' } : { color: 'var(--sicr-ink-soft)' }}>
              <Users className="w-3.5 h-3.5" /> Usuarios
            </button>}
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--sicr-ink-soft)' }}>
            <span>{usuario.nombre}</span>
            <button type="button" onClick={handleLogout} title="Cerrar sesión"
              className="p-2 rounded-xl bg-white transition-colors shadow-sm hover:text-red-600"
              style={{ border: '1px solid var(--sicr-line)' }}>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {vista === 'INDUSTRIAL' && puedeIndustrial ? <EvidenceModule key="industrial" initialMode="INDUSTRIAL" /> : vista === 'CORREDOR' && puedeCorredor ? <EvidenceModule key="corredor" initialMode="CORREDOR" /> : usuario.rol === 'ADMIN' ? <UserModule /> : <div className="panel-card"><h2>Sin permisos asignados</h2><p>Solicita a un administrador activar Proveedor/CBAM o Corredor/EUDR para esta cuenta.</p></div>}
    </div>
  );
}
