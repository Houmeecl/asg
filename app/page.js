'use client';

import { useState } from 'react';
import { ShieldCheck, Database, Truck } from 'lucide-react';
import ForenseModule from './components/ForenseModule';
import FlotaModule from './components/FlotaModule';

export default function Home() {
  const [vista, setVista] = useState('FORENSE'); // 'FORENSE' | 'FLOTAS'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col gap-6">
      <header className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-8 h-8" /> SICR3P — Assurance, Forensic & Sustainable Finance
          </h1>
          <p className="text-sm text-slate-400">Plataforma Independiente de Aseguramiento y Contabilidad Forense</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-xs flex items-center gap-2 text-emerald-400">
            <Database className="w-4 h-4" /> SQLite Criptográfico & Ollama (Llama 3) Activo
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
        </div>
      </header>

      {vista === 'FLOTAS' ? <FlotaModule /> : <ForenseModule />}
    </div>
  );
}
