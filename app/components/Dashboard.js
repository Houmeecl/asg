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
    <div className="min-h-screen bg-slate-50 text-slate-950 p-6 flex flex-col gap-6">
      <header className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/" title="Volver a la landing" className="rounded-lg bg-slate-950 px-3 py-2">
            <SicrLogo />
          </Link>
          <div>
            <div className="text-sm font-semibold text-slate-950">Infraestructura de evidencia industrial</div>
            <p className="text-xs text-slate-500">{subtitulo || 'Sin permisos asignados'}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-xs flex items-center gap-2 text-emerald-700 shadow-sm">
            <Database className="w-4 h-4" /> Custodia SHA-256 y acceso autenticado
          </div>
          <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden text-xs shadow-sm" role="tablist" aria-label="Módulos SICR3P">
            {puedeIndustrial && <button role="tab" aria-selected={vista === 'INDUSTRIAL'} onClick={() => setVista('INDUSTRIAL')}
              className={`px-3 py-2 flex items-center gap-1.5 ${vista === 'INDUSTRIAL' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:text-slate-950'}`}>
              <Factory className="w-3.5 h-3.5" /> Proveedor / CBAM
            </button>}
            {puedeCorredor && <button role="tab" aria-selected={vista === 'CORREDOR'} onClick={() => setVista('CORREDOR')}
              className={`px-3 py-2 flex items-center gap-1.5 ${vista === 'CORREDOR' ? 'bg-sky-700 text-white' : 'text-slate-600 hover:text-slate-950'}`}>
              <MapPinned className="w-3.5 h-3.5" /> Corredor + EUDR
            </button>}
            {usuario.rol === 'ADMIN' && <button role="tab" aria-selected={vista === 'USUARIOS'} onClick={() => setVista('USUARIOS')}
              className={`px-3 py-2 flex items-center gap-1.5 ${vista === 'USUARIOS' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-950'}`}>
              <Users className="w-3.5 h-3.5" /> Usuarios
            </button>}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>{usuario.nombre}</span>
            <button type="button" onClick={handleLogout} title="Cerrar sesión"
              className="p-2 rounded-lg bg-white border border-slate-200 hover:border-red-500 hover:text-red-600 transition-colors shadow-sm">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {vista === 'INDUSTRIAL' && puedeIndustrial ? <EvidenceModule key="industrial" initialMode="INDUSTRIAL" /> : vista === 'CORREDOR' && puedeCorredor ? <EvidenceModule key="corredor" initialMode="CORREDOR" /> : usuario.rol === 'ADMIN' ? <UserModule /> : <div className="panel-card"><h2>Sin permisos asignados</h2><p>Solicita a un administrador activar Proveedor/CBAM o Corredor/EUDR para esta cuenta.</p></div>}
    </div>
  );
}
