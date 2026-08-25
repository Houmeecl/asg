'use client';

import { useState } from 'react';
import { Database, Truck, ShieldCheck } from 'lucide-react';
import ForenseModule from './components/ForenseModule';
import FlotaModule from './components/FlotaModule';

// Wordmark real de sicr3p.cl: "sicr3p" en minúsculas con un punto verde
// reemplazando el punto de la "i" — replicado con los colores oficiales
// (navy #0f1f2e / green #28a745), adaptado a texto claro para el tema oscuro interno.
function SicrLogo() {
  return (
    <div className="flex flex-col gap-0.5 leading-none">
      <div className="text-3xl font-bold tracking-tight text-white flex items-baseline">
        <span>s</span>
        <span className="relative inline-block">
          i
          <span aria-hidden="true" className="absolute -top-2 left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full" style={{ background: '#28a745' }} />
        </span>
        <span>cr3p</span>
      </div>
      <div className="text-[10px] font-bold text-slate-400">Tu evidencia, tu trazabilidad</div>
    </div>
  );
}

export default function Home() {
  const [vista, setVista] = useState('FORENSE'); // 'FORENSE' | 'FLOTAS'

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
