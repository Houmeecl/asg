'use client';

import { useState, useEffect } from 'react';
import { Truck, Building2, PlusCircle, QrCode, FileCheck2, Gauge, Leaf, AlertTriangle } from 'lucide-react';

const API_URL = '/api';

const XML_USO_EJEMPLO = `<lectura>
  <patente>ABCD12</patente>
  <valor>1200</valor>
  <unidad>KM</unidad>
  <fecha>2026-08-24</fecha>
</lectura>`;

const XML_COMBUSTIBLE_EJEMPLO = `<lectura_combustible>
  <patente>ABCD12</patente>
  <litros>180</litros>
  <folio_dte>98765</folio_dte>
  <rut_emisor>77.888.999-1</rut_emisor>
  <fecha>2026-08-24</fecha>
</lectura_combustible>`;

export default function FlotaModule() {
  const [empresas, setEmpresas] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [activos, setActivos] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [contratoSeleccionado, setContratoSeleccionado] = useState(null);
  const [renovaciones, setRenovaciones] = useState([]);
  const [informeCO2, setInformeCO2] = useState(null);
  const [cargandoEmpresas, setCargandoEmpresas] = useState(true);
  const [cargandoDetalleEmpresa, setCargandoDetalleEmpresa] = useState(false);

  const [nuevaEmpresa, setNuevaEmpresa] = useState({ rut: '', razon_social: '', ciudad: '', tipo_negocio: 'RENT_A_CAR' });
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '' });
  const [nuevoActivo, setNuevoActivo] = useState({ patente: '', tipo_activo: 'VEHICULO', unidad_medida: 'KM', descripcion: '', tasa_referencia_litros: '', tipo_combustible: 'DIESEL' });
  const [nuevoContrato, setNuevoContrato] = useState({ activo_id: '', cliente_id: '', dias_renovacion: 30 });

  const [xmlUso, setXmlUso] = useState(XML_USO_EJEMPLO);
  const [xmlCombustible, setXmlCombustible] = useState(XML_COMBUSTIBLE_EJEMPLO);
  const [auditorFirmante, setAuditorFirmante] = useState('');
  const [certificado, setCertificado] = useState(null);
  const [errorRenovacion, setErrorRenovacion] = useState(null);
  const [cargandoRenovacion, setCargandoRenovacion] = useState(false);

  useEffect(() => { cargarEmpresas(); }, []);

  useEffect(() => {
    if (empresaSeleccionada) {
      cargarDetalleEmpresa(empresaSeleccionada.id);
    } else {
      setClientes([]); setActivos([]); setContratos([]); setInformeCO2(null);
    }
  }, [empresaSeleccionada]);

  useEffect(() => {
    if (contratoSeleccionado) {
      cargarRenovaciones(contratoSeleccionado.id);
      setCertificado(null);
      setErrorRenovacion(null);
    } else {
      setRenovaciones([]);
    }
  }, [contratoSeleccionado]);

  const cargarEmpresas = async () => {
    setCargandoEmpresas(true);
    try {
      const res = await fetch(`${API_URL}/flota/empresas`);
      setEmpresas(await res.json());
    } catch (e) { console.error('Error cargando empresas de flota:', e); }
    finally { setCargandoEmpresas(false); }
  };

  const cargarDetalleEmpresa = async (empresaId) => {
    setCargandoDetalleEmpresa(true);
    try {
      await Promise.all([
        cargarClientes(empresaId),
        cargarActivos(empresaId),
        cargarContratos(empresaId),
        cargarInformeCO2(empresaId),
      ]);
    } finally {
      setCargandoDetalleEmpresa(false);
    }
  };

  const cargarClientes = async (empresaId) => {
    try {
      const res = await fetch(`${API_URL}/flota/empresas/${empresaId}/clientes`);
      setClientes(await res.json());
    } catch (e) { console.error('Error cargando clientes de flota:', e); }
  };

  const cargarActivos = async (empresaId) => {
    try {
      const res = await fetch(`${API_URL}/flota/empresas/${empresaId}/activos`);
      setActivos(await res.json());
    } catch (e) { console.error('Error cargando activos:', e); }
  };

  const cargarContratos = async (empresaId) => {
    try {
      const res = await fetch(`${API_URL}/flota/empresas/${empresaId}/contratos`);
      setContratos(await res.json());
    } catch (e) { console.error('Error cargando contratos:', e); }
  };

  const cargarRenovaciones = async (contratoId) => {
    try {
      const res = await fetch(`${API_URL}/flota/contratos/${contratoId}/renovaciones`);
      setRenovaciones(await res.json());
    } catch (e) { console.error('Error cargando renovaciones:', e); }
  };

  const cargarInformeCO2 = async (empresaId) => {
    try {
      const res = await fetch(`${API_URL}/flota/empresas/${empresaId}/informe-co2`);
      setInformeCO2(await res.json());
    } catch (e) { console.error('Error cargando informe CO2:', e); }
  };

  const handleCrearEmpresa = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/flota/empresas`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nuevaEmpresa)
      });
      if (res.ok) {
        setNuevaEmpresa({ rut: '', razon_social: '', ciudad: '', tipo_negocio: 'RENT_A_CAR' });
        cargarEmpresas();
      }
    } catch (e) { console.error('Error creando empresa:', e); }
  };

  const handleCrearCliente = async (e) => {
    e.preventDefault();
    if (!empresaSeleccionada) return;
    try {
      const res = await fetch(`${API_URL}/flota/empresas/${empresaSeleccionada.id}/clientes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nuevoCliente)
      });
      if (res.ok) { setNuevoCliente({ nombre: '' }); cargarClientes(empresaSeleccionada.id); }
    } catch (e) { console.error('Error creando cliente:', e); }
  };

  const handleCrearActivo = async (e) => {
    e.preventDefault();
    if (!empresaSeleccionada) return;
    try {
      const res = await fetch(`${API_URL}/flota/empresas/${empresaSeleccionada.id}/activos`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...nuevoActivo, tasa_referencia_litros: Number(nuevoActivo.tasa_referencia_litros) })
      });
      if (res.ok) {
        setNuevoActivo({ patente: '', tipo_activo: 'VEHICULO', unidad_medida: 'KM', descripcion: '', tasa_referencia_litros: '', tipo_combustible: 'DIESEL' });
        cargarActivos(empresaSeleccionada.id);
      }
    } catch (e) { console.error('Error creando activo:', e); }
  };

  const handleCrearContrato = async (e) => {
    e.preventDefault();
    if (!nuevoContrato.activo_id || !nuevoContrato.cliente_id) return;
    try {
      const res = await fetch(`${API_URL}/flota/contratos`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nuevoContrato)
      });
      if (res.ok) {
        setNuevoContrato({ activo_id: '', cliente_id: '', dias_renovacion: 30 });
        cargarContratos(empresaSeleccionada.id);
      }
    } catch (e) { console.error('Error creando contrato:', e); }
  };

  const handleRenovar = async (e) => {
    e.preventDefault();
    if (!contratoSeleccionado) return;
    setCargandoRenovacion(true);
    setCertificado(null);
    setErrorRenovacion(null);
    try {
      const res = await fetch(`${API_URL}/flota/contratos/${contratoSeleccionado.id}/renovar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xml_uso: xmlUso, xml_combustible: xmlCombustible, auditor_firmante: auditorFirmante || undefined })
      });
      const data = await res.json();
      if (res.ok) {
        setCertificado(data);
        cargarRenovaciones(contratoSeleccionado.id);
        cargarInformeCO2(empresaSeleccionada.id);
      } else {
        setErrorRenovacion(data.error + (data.detalle ? `: ${data.detalle}` : ''));
      }
    } catch (e) {
      setErrorRenovacion('Error de conexión con el servidor.');
    } finally {
      setCargandoRenovacion(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUMNA 1: Empresas de flota */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-200">
            <Truck className="w-5 h-5 text-emerald-400" /> Rent a Car / Leasing / Maquinaria
          </h2>

          <form onSubmit={handleCrearEmpresa} className="space-y-3 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
            <input type="text" placeholder="RUT" value={nuevaEmpresa.rut}
              onChange={e => setNuevaEmpresa({ ...nuevaEmpresa, rut: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200" required />
            <input type="text" placeholder="Razón Social" value={nuevaEmpresa.razon_social}
              onChange={e => setNuevaEmpresa({ ...nuevaEmpresa, razon_social: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200" required />
            <input type="text" placeholder="Ciudad (ej: Antofagasta)" value={nuevaEmpresa.ciudad}
              onChange={e => setNuevaEmpresa({ ...nuevaEmpresa, ciudad: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200" required />
            <select value={nuevaEmpresa.tipo_negocio}
              onChange={e => setNuevaEmpresa({ ...nuevaEmpresa, tipo_negocio: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-200">
              <option value="RENT_A_CAR">Rent a Car</option>
              <option value="LEASING">Leasing</option>
              <option value="MAQUINARIA_PESADA">Maquinaria Pesada</option>
              <option value="TRANSPORTE">Transporte</option>
            </select>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-2">
              <PlusCircle className="w-4 h-4" /> Registrar Empresa
            </button>
          </form>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-72">
            {cargandoEmpresas && <p className="text-xs text-slate-500 text-center py-4 animate-pulse">Cargando empresas...</p>}
            {!cargandoEmpresas && empresas.map(emp => (
              <button key={emp.id} type="button" onClick={() => setEmpresaSeleccionada(emp)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${empresaSeleccionada?.id === emp.id ? 'bg-emerald-950/30 border-emerald-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}>
                <div className="font-semibold text-sm text-slate-200">{emp.razon_social}</div>
                <div className="text-xs text-slate-400">{emp.ciudad} · {emp.tipo_negocio}</div>
              </button>
            ))}
            {!cargandoEmpresas && empresas.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No hay empresas registradas.</p>}
          </div>
        </div>

        {/* COLUMNA 2: Clientes, activos y contratos */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-200">
            <Building2 className="w-5 h-5 text-emerald-400" /> Flota de Clientes
          </h2>

          {empresaSeleccionada ? (
            <>
              <form onSubmit={handleCrearCliente} className="space-y-2 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                <input type="text" placeholder="Nombre del cliente" value={nuevoCliente.nombre}
                  onChange={e => setNuevoCliente({ nombre: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200" required />
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded text-xs font-medium">+ Cliente</button>
              </form>

              <form onSubmit={handleCrearActivo} className="space-y-2 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Nuevo activo</div>
                <input type="text" placeholder="Patente" value={nuevoActivo.patente}
                  onChange={e => setNuevoActivo({ ...nuevoActivo, patente: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200" required />
                <div className="grid grid-cols-2 gap-2">
                  <select value={nuevoActivo.tipo_activo}
                    onChange={e => {
                      const tipo = e.target.value;
                      setNuevoActivo({ ...nuevoActivo, tipo_activo: tipo, unidad_medida: tipo === 'MAQUINARIA' ? 'HORAS' : 'KM' });
                    }}
                    className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200">
                    <option value="VEHICULO">Vehículo</option>
                    <option value="MAQUINARIA">Maquinaria</option>
                  </select>
                  <select value={nuevoActivo.tipo_combustible}
                    onChange={e => setNuevoActivo({ ...nuevoActivo, tipo_combustible: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200">
                    <option value="DIESEL">Diésel</option>
                    <option value="GASOLINA">Gasolina</option>
                  </select>
                </div>
                <input type="text" placeholder="Descripción (ej: Retroexcavadora CAT 320)" value={nuevoActivo.descripcion}
                  onChange={e => setNuevoActivo({ ...nuevoActivo, descripcion: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200" />
                <input type="number" step="0.001" placeholder={`Tasa referencia L/${nuevoActivo.unidad_medida === 'HORAS' ? 'hora' : 'km'}`}
                  value={nuevoActivo.tasa_referencia_litros}
                  onChange={e => setNuevoActivo({ ...nuevoActivo, tasa_referencia_litros: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200" required />
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded text-xs font-medium">+ Activo</button>
              </form>

              <form onSubmit={handleCrearContrato} className="space-y-2 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">Nuevo contrato</div>
                <select value={nuevoContrato.activo_id} onChange={e => setNuevoContrato({ ...nuevoContrato, activo_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200" required>
                  <option value="">Selecciona activo...</option>
                  {activos.map(a => <option key={a.id} value={a.id}>{a.patente} — {a.descripcion || a.tipo_activo}</option>)}
                </select>
                <select value={nuevoContrato.cliente_id} onChange={e => setNuevoContrato({ ...nuevoContrato, cliente_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200" required>
                  <option value="">Selecciona cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                <input type="number" placeholder="Días entre renovaciones" value={nuevoContrato.dias_renovacion}
                  onChange={e => setNuevoContrato({ ...nuevoContrato, dias_renovacion: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200" />
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded text-xs font-medium">+ Contrato</button>
              </form>

              <div className="flex-1 overflow-y-auto space-y-2 max-h-56">
                {cargandoDetalleEmpresa && <p className="text-xs text-slate-500 text-center py-2 animate-pulse">Cargando...</p>}
                {!cargandoDetalleEmpresa && contratos.map(c => (
                  <button key={c.id} type="button" onClick={() => setContratoSeleccionado(c)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all ${contratoSeleccionado?.id === c.id ? 'bg-blue-950/30 border-blue-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}>
                    <div className="text-xs font-bold text-blue-400">{c.patente}</div>
                    <div className="text-[11px] text-slate-300">{c.cliente_nombre}</div>
                    <div className="text-[10px] text-slate-500">{c.estado} · renovación c/{c.dias_renovacion}d</div>
                  </button>
                ))}
                {!cargandoDetalleEmpresa && contratos.length === 0 && <p className="text-xs text-slate-500 text-center py-2">Sin contratos aún.</p>}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs text-center p-6">
              Selecciona una empresa para gestionar su flota.
            </div>
          )}
        </div>

        {/* COLUMNA 3: Renovación (adhesivo/QR) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-200">
            <QrCode className="w-5 h-5 text-emerald-400" /> Renovación de Adhesivo
          </h2>

          {contratoSeleccionado ? (
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
              <div className="text-xs bg-slate-950 p-2.5 rounded border border-slate-800 text-blue-300">
                Contrato: <strong className="text-white">{contratoSeleccionado.patente}</strong> · {contratoSeleccionado.cliente_nombre}
              </div>

              <form onSubmit={handleRenovar} className="space-y-2 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                <label className="text-[10px] text-slate-500 uppercase" htmlFor="xml-uso">XML de uso (distancia/horómetro)</label>
                <textarea id="xml-uso" rows="5" value={xmlUso} onChange={e => setXmlUso(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-[10px] font-mono text-slate-300" />
                <label className="text-[10px] text-slate-500 uppercase" htmlFor="xml-combustible">XML de combustible</label>
                <textarea id="xml-combustible" rows="6" value={xmlCombustible} onChange={e => setXmlCombustible(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-[10px] font-mono text-slate-300" />
                <input type="text" placeholder="Nombre del Contador Auditor que firma (opcional para simular firma)"
                  value={auditorFirmante} onChange={e => setAuditorFirmante(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200" />
                <button type="submit" disabled={cargandoRenovacion}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                  <FileCheck2 className="w-4 h-4" /> {cargandoRenovacion ? 'Procesando...' : 'Generar Certificado'}
                </button>
              </form>

              {errorRenovacion && (
                <div className="p-2 bg-red-950/40 border border-red-500/50 rounded text-[11px] text-red-300">{errorRenovacion}</div>
              )}

              {certificado && (
                <div className="bg-slate-950 border border-emerald-500/40 rounded-lg p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <img src={certificado.qr_data_url} alt="Código QR del certificado de renovación" className="w-20 h-20 rounded bg-white p-1" />
                    <div className="text-[11px] text-slate-300">
                      <div className="font-bold text-emerald-400">{certificado.numero_adhesivo}</div>
                      <div>Estado firma: {certificado.estado_firma}</div>
                      <div>Vence: {new Date(certificado.fecha_vencimiento).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-900 rounded p-2">
                      <div className="text-slate-500 flex items-center gap-1"><Gauge className="w-3 h-3" /> Consumo</div>
                      <div className="text-slate-200">{certificado.lectura_combustible_litros} L declarados</div>
                      <div className="text-slate-500">Esperado: {certificado.consumo_esperado_litros} L</div>
                    </div>
                    <div className={`rounded p-2 ${Math.abs(certificado.discrepancia_pct) > 15 ? 'bg-amber-950/40' : 'bg-slate-900'}`}>
                      <div className="text-slate-500 flex items-center gap-1">
                        {Math.abs(certificado.discrepancia_pct) > 15 && <AlertTriangle className="w-3 h-3 text-amber-400" />} Discrepancia
                      </div>
                      <div className={Math.abs(certificado.discrepancia_pct) > 15 ? 'text-amber-300 font-bold' : 'text-slate-200'}>
                        {certificado.discrepancia_pct}%
                      </div>
                    </div>
                    <div className="bg-slate-900 rounded p-2">
                      <div className="text-slate-500 flex items-center gap-1"><Leaf className="w-3 h-3" /> CO2e</div>
                      <div className="text-slate-200">{certificado.co2_kg} kg</div>
                    </div>
                    <div className="bg-slate-900 rounded p-2">
                      <div className="text-slate-500">Alcance GHG</div>
                      <div className="text-slate-200">{certificado.alcance_ghg.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 break-all">Hash: {certificado.hash_evidencia}</div>
                  <a href={certificado.url_verificacion} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
                    Ver Pasaporte Digital público →
                  </a>
                  <div className="text-[10px] text-slate-500 italic">{certificado.aviso_legal}</div>
                </div>
              )}

              {renovaciones.length > 0 && (
                <div className="mt-1">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Historial (como revisión técnica)</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {renovaciones.map(r => (
                      <div key={r.id} className="text-[10px] bg-slate-950 border border-slate-800 rounded p-1.5 flex justify-between text-slate-400">
                        <span>{r.numero_adhesivo}</span>
                        <span>{new Date(r.fecha_renovacion).toLocaleDateString()}</span>
                        <span className={Math.abs(r.discrepancia_pct) > 15 ? 'text-amber-400' : ''}>{r.discrepancia_pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs text-center p-6">
              Selecciona un contrato para renovar su adhesivo/certificado.
            </div>
          )}
        </div>
      </div>

      {/* Informe agregado de flota */}
      {empresaSeleccionada && informeCO2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-emerald-400 mb-3">
            <Leaf className="w-5 h-5" /> Informe de Flota — CO2 por Alcance
          </h2>
          {informeCO2.por_alcance.length === 0 ? (
            <p className="text-xs text-slate-500">Aún no hay renovaciones registradas para esta empresa.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {informeCO2.por_alcance.map(a => (
                <div key={a.alcance_ghg} className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                  <div className="text-sm font-bold text-slate-200">{a.alcance_ghg.replace('_', ' ')}</div>
                  <div className="text-2xl font-bold text-emerald-400">{a.co2_kg_total.toFixed(1)} kg CO2e</div>
                  <div className="text-xs text-slate-400">{a.cantidad_renovaciones} renovaciones registradas</div>
                  {a.renovaciones_con_discrepancia_alta > 0 && (
                    <div className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3" /> {a.renovaciones_con_discrepancia_alta} con discrepancia &gt;15%
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-slate-500 italic mt-3">{informeCO2.nota}</p>
        </div>
      )}
    </div>
  );
}
