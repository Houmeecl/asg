'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Database, Truck, ShieldCheck, LogOut } from 'lucide-react';
import SicrLogo from './SicrLogo';
import ForenseModule from './ForenseModule';
import FlotaModule from './FlotaModule';

export default function Dashboard({ usuario }) {
  const [vista, setVista] = useState('FORENSE'); // 'FORENSE' | 'FLOTAS'
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/ingresar');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col gap-6">
      <header className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <SicrLogo />
          <span className="text-slate-600">|</span>
          <div>
            <div className="text-sm font-semibold text-emerald-400">Assurance, Forensic &amp; Sustainable Finance</div>
            <p className="text-xs text-slate-400">Plataforma Independiente de Aseguramiento y Contabilidad Forense</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-xs flex items-center gap-2 text-emerald-400">
            <Database className="w-4 h-4" /> SQLite Criptográfico &amp; Ollama (Llama 3) Activo
          </div>
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg overflow-hidden text-xs" role="tablist" aria-label="Módulos SICR3P">
            <button role="tab" aria-selected={vista === 'FORENSE'} onClick={() => setVista('FORENSE')}
              className={`px-3 py-2 flex items-center gap-1.5 ${vista === 'FORENSE' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              <ShieldCheck className="w-3.5 h-3.5" /> Forense
            </button>
            <button role="tab" aria-selected={vista === 'FLOTAS'} onClick={() => setVista('FLOTAS')}
              className={`px-3 py-2 flex items-center gap-1.5 ${vista === 'FLOTAS' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              <Truck className="w-3.5 h-3.5" /> Flotas ASG
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{usuario.nombre}</span>
            <button type="button" onClick={handleLogout} title="Cerrar sesión"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-red-500 hover:text-red-400 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {vista === 'FLOTAS' ? <FlotaModule /> : <ForenseModule />}
    </div>
  );
}
