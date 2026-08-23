import React, { useState, useEffect } from 'react';
import { Building2, FolderKanban, ShieldCheck, UploadCloud, PlusCircle, Database, Cpu, FileText } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function App() {
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [expedientes, setExpedientes] = useState([]);
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState(null);

  // Estados para formularios
  const [nuevoCliente, setNuevoCliente] = useState({ rut: '', razon_social: '', sector_industrial: 'Minería / Proveedores' });
  const [nuevoExpediente, setNuevoExpediente] = useState({ periodo_fiscal: '2026', area_practica: 'SUSTAINABILITY_ASSURANCE' });
  const [archivoEvidencia, setArchivoEvidencia] = useState(null);
  const [categoriaAnalisis, setCategoriaAnalisis] = useState('ALCANCE_1');
  const [mensajeRespuesta, setMensajeRespuesta] = useState(null);

  // Estados para el módulo de IA (Ollama)
  const [textoContrato, setTextoContrato] = useState('');
  const [dictamenIA, setDictamenIA] = useState('');
  const [cargandoIA, setCargandoIA] = useState(false);

  useEffect(() => {
    cargarClientes();
  }, []);

  useEffect(() => {
    if (clienteSeleccionado) {
      cargarExpedientes(clienteSeleccionado.id);
    } else {
      setExpedientes([]);
      setExpedienteSeleccionado(null);
    }
  }, [clienteSeleccionado]);

  const cargarClientes = async () => {
    try {
      const res = await fetch(`${API_URL}/clientes`);
      const data = await res.json();
      setClientes(data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  const cargarExpedientes = async (clienteId) => {
    try {
      const res = await fetch(`${API_URL}/clientes/${clienteId}/expedientes`);
      const data = await res.json();
      setExpedientes(data);
    } catch (error) {
      console.error('Error cargando expedientes:', error);
    }
  };

  const handleCrearCliente = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoCliente)
      });
      if (res.ok) {
        setNuevoCliente({ rut: '', razon_social: '', sector_industrial: 'Minería / Proveedores' });
        cargarClientes();
      }
    } catch (error) {
      console.error('Error creando cliente:', error);
    }
  };

  const handleCrearExpediente = async (e) => {
    e.preventDefault();
    if (!clienteSeleccionado) return;
    try {
      const res = await fetch(`${API_URL}/expedientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proveedor_id: clienteSeleccionado.id,
          ...nuevoExpediente
        })
      });
      if (res.ok) {
        cargarExpedientes(clienteSeleccionado.id);
      }
    } catch (error) {
      console.error('Error creando expediente:', error);
    }
  };

  const handleSubirEvidencia = async (e) => {
    e.preventDefault();
    if (!expedienteSeleccionado || !archivoEvidencia) return;

    const formData = new FormData();
    formData.append('archivo', archivoEvidencia);
    formData.append('categoria_analisis', categoriaAnalisis);

    try {
      const res = await fetch(`${API_URL}/expedientes/${expedienteSeleccionado.id}/evidencia`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setMensajeRespuesta(`✅ Evidencia blindada. Hash SHA-256: ${data.hash_inmutabilidad.substring(0, 16)}...`);
        setArchivoEvidencia(null);
      } else {
        setMensajeRespuesta(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error subiendo evidencia:', error);
      setMensajeRespuesta('❌ Error de conexión con el servidor.');
    }
  };

  const handleAuditarConIA = async () => {
    if (!expedienteSeleccionado || !textoContrato) return;
    setCargandoIA(true);
    setDictamenIA('');

    try {
      const res = await fetch(`${API_URL}/expedientes/${expedienteSeleccionado.id}/auditar-ia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: textoContrato })
      });
      const data = await res.json();
      if (res.ok) {
        setDictamenIA(data.dictamen_ia);
      } else {
        setDictamenIA(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error en auditoría IA:', error);
      setDictamenIA('Error de conexión con el motor Ollama local.');
    } finally {
      setCargandoIA(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col gap-6">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-8 h-8" /> SICR3P — Assurance, Forensic & Sustainable Finance
          </h1>
          <p className="text-sm text-slate-400">Plataforma Independiente de Aseguramiento y Contabilidad Forense</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-xs flex items-center gap-2 text-emerald-400">
          <Database className="w-4 h-4" /> SQLite Criptográfico & Ollama (Llama 3) Activo
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA 1: Directorio de Clientes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-200">
            <Building2 className="w-5 h-5 text-emerald-400" /> Directorio de Proveedores
          </h2>
          
          <form onSubmit={handleCrearCliente} className="space-y-3 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
            <input 
              type="text" placeholder="RUT (ej: 76.543.210-K)" value={nuevoCliente.rut}
              onChange={e => setNuevoCliente({...nuevoCliente, rut: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200" required
            />
            <input 
              type="text" placeholder="Razón Social (ej: Maestranza Norte SpA)" value={nuevoCliente.razon_social}
              onChange={e => setNuevoCliente({...nuevoCliente, razon_social: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200" required
            />
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-2">
              <PlusCircle className="w-4 h-4" /> Registrar Proveedor
            </button>
          </form>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-72">
            {clientes.map(c => (
              <div 
                key={c.id} 
                onClick={() => { setClienteSeleccionado(c); setExpedienteSeleccionado(null); }}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${clienteSeleccionado?.id === c.id ? 'bg-emerald-950/30 border-emerald-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
              >
                <div className="font-semibold text-sm text-slate-200">{c.razon_social}</div>
                <div className="text-xs text-slate-400">RUT: {c.rut}</div>
              </div>
            ))}
            {clientes.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No hay proveedores registrados.</p>}
          </div>
        </div>

        {/* COLUMNA 2: Expedientes del Cliente */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-200">
            <FolderKanban className="w-5 h-5 text-emerald-400" /> Expedientes SICR3P
          </h2>

          {clienteSeleccionado ? (
            <>
              <div className="text-xs bg-slate-950 p-2.5 rounded border border-slate-800 text-emerald-300">
                Proveedor activo: <strong className="text-white">{clienteSeleccionado.razon_social}</strong>
              </div>

              <form onSubmit={handleCrearExpediente} className="space-y-3 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                <select 
                  value={nuevoExpediente.area_practica}
                  onChange={e => setNuevoExpediente({...nuevoExpediente, area_practica: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200"
                >
                  <option value="SUSTAINABILITY_ASSURANCE">1. Sustainability Assurance</option>
                  <option value="FORENSIC">2. Forensic & Investigations</option>
                  <option value="COMPLIANCE">3. Compliance & MPD Assurance</option>
                </select>
                <input 
                  type="text" placeholder="Periodo Fiscal (ej: 2026)" value={nuevoExpediente.periodo_fiscal}
                  onChange={e => setNuevoExpediente({...nuevoExpediente, periodo_fiscal: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200" required
                />
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-2">
                  <PlusCircle className="w-4 h-4" /> Abrir Expediente
                </button>
              </form>

              <div className="flex-1 overflow-y-auto space-y-2 max-h-60">
                {expedientes.map(exp => (
                  <div 
                    key={exp.id}
                    onClick={() => setExpedienteSeleccionado(exp)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${expedienteSeleccionado?.id === exp.id ? 'bg-blue-950/30 border-blue-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="text-xs font-bold text-blue-400">{exp.area_practica}</div>
                    <div className="text-sm text-slate-200">Periodo: {exp.periodo_fiscal}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Fase: {exp.estado}</div>
                  </div>
                ))}
                {expedientes.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Este proveedor no tiene expedientes.</p>}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs text-center p-6">
              Selecciona un proveedor del directorio izquierdo para gestionar sus expedientes de auditoría.
            </div>
          )}
        </div>

        {/* COLUMNA 3: Ingesta Forense & Hash SHA-256 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-200">
            <UploadCloud className="w-5 h-5 text-emerald-400" /> Cadena de Custodia Digital
          </h2>

          {expedienteSeleccionado ? (
            <div className="flex-1 flex flex-col gap-4">
              <div className="text-xs bg-slate-950 p-2.5 rounded border border-slate-800 text-blue-300">
                Expediente ID: <strong className="text-white">#{expedienteSeleccionado.id}</strong>
              </div>

              <form onSubmit={handleSubirEvidencia} className="space-y-3 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                <label className="text-xs text-slate-400 block">Categoría de Análisis:</label>
                <select 
                  value={categoriaAnalisis} onChange={e => setCategoriaAnalisis(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200"
                >
                  <option value="ALCANCE_1">Alcance 1 & 2 (Combustible / Energía)</option>
                  <option value="CAPITAL_NATURAL">Capital Natural / Estrés Hídrico</option>
                  <option value="COMPLIANCE_LEGAL">Contrato / Ley 21.595</option>
                  <option value="LEY_REP">Economía Circular / Ley REP</option>
                </select>

                <input 
                  type="file" onChange={e => setArchivoEvidencia(e.target.files[0])}
                  className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-emerald-950 file:text-emerald-300 cursor-pointer" 
                />
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded text-xs font-medium flex items-center justify-center gap-2">
                  <UploadCloud className="w-4 h-4" /> Blindar con Hash SHA-256
                </button>
              </form>

              {mensajeRespuesta && (
                <div className="p-2 bg-slate-950 border border-emerald-500/50 rounded text-[11px] text-slate-300">
                  {mensajeRespuesta}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs text-center p-6">
              Selecciona un expediente para cargar evidencias protegidas.
            </div>
          )}
        </div>

      </div>

      {/* SECCIÓN INFERIOR: Laboratorio de Análisis Forense con Ollama (Llama 3) */}
      {expedienteSeleccionado && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-emerald-400">
            <Cpu className="w-5 h-5" /> Motor de Auditoría Cognitiva (Ollama / Llama 3)
          </h2>
          <p className="text-xs text-slate-400">
            Pega extractos de contratos, políticas de cumplimiento o declaraciones de sostenibilidad para que la IA evalúe los riesgos bajo los marcos institucionales de SICR3P.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <textarea 
                rows="6"
                placeholder="Pega aquí el texto del contrato, acuerdo o política a auditar..."
                value={textoContrato}
                onChange={e => setTextoContrato(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <button 
                onClick={handleAuditarConIA}
                disabled={cargandoIA}
                className="bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <FileText className="w-4 h-4" /> {cargandoIA ? 'Analizando con Llama 3...' : 'Ejecutar Auditoría Forense con IA'}
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col h-64 overflow-y-auto">
              <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Dictamen Analítico Preliminar:</div>
              {cargandoIA && <div className="text-xs text-emerald-400 animate-pulse">Procesando materialidad, riesgos de la Ley 21.595 y controles internos...</div>}
              {!cargandoIA && dictamenIA && (
                <div className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {dictamenIA}
                </div>
              )}
              {!cargandoIA && !dictamenIA && (
                <div className="text-xs text-slate-600 italic">El dictamen generado por la IA aparecerá aquí para incorporarlo a tu Carta a la Gerencia.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}