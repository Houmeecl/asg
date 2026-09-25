'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, Factory, FilePlus2, FolderOpen, MapPinned, ShieldCheck, Upload, AlertTriangle, FileText, History, Leaf, BookOpenCheck, Scale, Sparkles, CheckCircle2 } from 'lucide-react';

const BLOQUES = [
  ['EMPRESA_INSTALACION', 'Empresa e instalación'], ['VENTA', 'Venta / OC / DTE'], ['MATERIAL', 'Materiales y lotes'],
  ['ENERGIA', 'Energía'], ['COMBUSTIBLE', 'Combustible'], ['PRODUCCION', 'Producción'], ['ENTREGA', 'Despacho y recepción'],
];
const ETAPAS = [['PRODUCTOR_ORIGEN', 'Productor / origen'], ['EXPORTADOR', 'Exportador'], ['TRANSPORTE', 'Transporte'], ['ADUANA_PUERTO', 'Aduana / puerto'], ['IMPORTADOR_DESTINO', 'Importador / destino']];

const NORMAS_BASE = {
  INDUSTRIAL: [
    { estado: 'Norma base', tipo: 'binding', titulo: 'CBAM', detalle: 'Define qué datos pedir del producto, instalación, energía, combustible, producción y despacho.' },
    { estado: 'Ayuda de uso', tipo: 'guide', titulo: 'Guías CBAM', detalle: 'Sirven para preparar el expediente y mostrar brechas antes del informe preverificado.' },
  ],
  CORREDOR: [
    { estado: 'Ruta documental', tipo: 'guide', titulo: 'Corredor Bioceánico', detalle: 'Ordena origen, transporte, aduana, país, actor responsable y documento esperado.' },
    { estado: 'Norma UE', tipo: 'binding', titulo: 'EUDR', detalle: 'Revisa si el producto puede exigir geolocalización, legalidad, riesgo y referencia DDS/TRACES.' },
  ],
};

const PASOS_FACILES = {
  INDUSTRIAL: [
    ['1', 'Registra el proveedor', 'RUT, razón social y sector.'],
    ['2', 'Abre el expediente', 'Instalación, producto, lote, período y código CN si aplica.'],
    ['3', 'Sube evidencia', 'Documentos, valores, fuente y responsable.'],
    ['4', 'Revisa salida', 'Cobertura, brechas, normas e informe preverificado.'],
  ],
  CORREDOR: [
    ['1', 'Registra la empresa', 'Actor de origen, transporte, exportación o trazabilidad.'],
    ['2', 'Abre ruta', 'Carga, países, lote/embarque y destino.'],
    ['3', 'Agrega hitos', 'Productor, transporte, aduana, documentos y fechas.'],
    ['4', 'Evalúa EUDR', 'Producto, país, legalidad, riesgo y DDS si existe.'],
  ],
};

const PLANTILLAS_EVIDENCIA = {
  INDUSTRIAL: [
    { nombre: 'Empresa base', bloque: 'EMPRESA_INSTALACION', concepto: 'Identificación de empresa e instalación productiva', unidad: 'documento', fuente: 'RUT, escritura, contrato, ficha de instalación o antecedente interno', responsable: 'Encargado administrativo / operaciones', nivel_respaldo: 'DECLARADO' },
    { nombre: 'Energía', bloque: 'ENERGIA', concepto: 'Consumo eléctrico del período informado', unidad: 'kWh', fuente: 'Factura eléctrica o reporte de medidor', responsable: 'Operaciones / mantenimiento', nivel_respaldo: 'DOCUMENTADO' },
    { nombre: 'Combustible', bloque: 'COMBUSTIBLE', concepto: 'Consumo de combustible asociado al producto/lote', unidad: 'L', fuente: 'Factura, guía, vale de combustible o registro interno', responsable: 'Bodega / operaciones', nivel_respaldo: 'DOCUMENTADO' },
    { nombre: 'Producción', bloque: 'PRODUCCION', concepto: 'Cantidad producida o fabricada del lote', unidad: 'kg / t / unidad', fuente: 'Orden de producción, parte diario o control de calidad', responsable: 'Jefe de producción', nivel_respaldo: 'DOCUMENTADO' },
  ],
  CORREDOR: [
    { nombre: 'Origen', bloque: 'EMPRESA_INSTALACION', concepto: 'Identificación del origen y actor responsable', unidad: 'documento', fuente: 'Registro de productor, proveedor, contrato u orden de compra', responsable: 'Coordinador de origen', nivel_respaldo: 'DECLARADO' },
    { nombre: 'Carga', bloque: 'MATERIAL', concepto: 'Descripción de carga, lote, peso y producto transportado', unidad: 'kg / t / unidad', fuente: 'Packing list, guía, manifiesto o documento de transporte', responsable: 'Exportador / operador logístico', nivel_respaldo: 'DOCUMENTADO' },
    { nombre: 'Aduana', bloque: 'ENTREGA', concepto: 'Documento de salida, tránsito o recepción fronteriza', unidad: 'documento', fuente: 'DUS, MIC/DTA, manifiesto, BL/AWB o comprobante aduanero', responsable: 'Agente de aduana / logística', nivel_respaldo: 'DOCUMENTADO' },
    { nombre: 'EUDR', bloque: 'MATERIAL', concepto: 'Antecedente para evaluar si el producto puede estar cubierto por EUDR', unidad: 'documento', fuente: 'Código HS/CN, origen, producto, geolocalización o declaración de no aplicabilidad', responsable: 'Responsable de cumplimiento', nivel_respaldo: 'DECLARADO' },
  ],
};

const PLANTILLAS_HITOS = [
  { nombre: 'Origen Chile', etapa: 'PRODUCTOR_ORIGEN', pais: 'CL', estado: 'PENDIENTE', actor: 'Productor / proveedor de origen', documento_requerido: 'Orden de compra, factura, guía, identificación de predio/instalación o lote', norma_referencia: 'Origen y trazabilidad documental del corredor' },
  { nombre: 'Transporte', etapa: 'TRANSPORTE', pais: 'AR', estado: 'PENDIENTE', actor: 'Transportista / operador logístico', documento_requerido: 'Carta porte, manifiesto, guía de despacho, control de carga o tracking', norma_referencia: 'Hito logístico y control documental' },
  { nombre: 'Aduana', etapa: 'ADUANA_PUERTO', pais: 'PY', estado: 'PENDIENTE', actor: 'Agente de aduana / puerto / frontera', documento_requerido: 'Documento aduanero de salida, tránsito o ingreso', norma_referencia: 'Control fronterizo y respaldo de tránsito' },
  { nombre: 'Destino', etapa: 'IMPORTADOR_DESTINO', pais: 'BR', estado: 'PENDIENTE', actor: 'Receptor / destino comercial', documento_requerido: 'Recepción, BL/AWB, comprobante de entrega o referencia comercial', norma_referencia: 'Recepción y cierre de cadena documental' },
];

function NormChip({ tipo, children }) {
  return <span className={`norm-chip ${tipo}`}>{children}</span>;
}

function BibliotecaNormativa({ esCorredor }) {
  const normas = esCorredor ? NORMAS_BASE.CORREDOR : NORMAS_BASE.INDUSTRIAL;
  return <div className="panel-card">
    <h2><BookOpenCheck /> Normas, en simple</h2>
    <p>Estas reglas solo indican qué revisar. El sistema te guía para juntar evidencia y mostrar faltantes sin prometer un certificado oficial.</p>
    <div className="norm-grid">
      {normas.map((norma) => <div className="norm-card" key={norma.titulo}>
        <NormChip tipo={norma.tipo}>{norma.estado}</NormChip>
        <strong>{norma.titulo}</strong>
        <span>{norma.detalle}</span>
      </div>)}
    </div>
  </div>;
}

function GuiaRapida({ esCorredor }) {
  const pasos = esCorredor ? PASOS_FACILES.CORREDOR : PASOS_FACILES.INDUSTRIAL;
  return <div className="easy-card">
    <div>
      <p className="easy-kicker">Flujo fácil</p>
      <h2>{esCorredor ? 'Para corredor: crea ruta, hitos y EUDR' : 'Para CBAM: crea expediente y respaldo'}</h2>
      <p>{esCorredor ? 'No necesitas saber toda la norma antes de empezar. Avanza por hitos y el sistema deja visibles los pendientes.' : 'Empieza con lo mínimo: proveedor, instalación, expediente y respaldo. Lo normativo aparece como guía de revisión.'}</p>
    </div>
    <div className="easy-steps">
      {pasos.map(([numero, titulo, texto]) => <div className="easy-step" key={numero}>
        <span>{numero}</span>
        <strong>{titulo}</strong>
        <small>{texto}</small>
      </div>)}
    </div>
  </div>;
}

function AutomatizacionPanel({ esCorredor, onExpediente, onEvidencia, onHito, onEudrNoAplica, detalle }) {
  const plantillas = esCorredor ? PLANTILLAS_EVIDENCIA.CORREDOR : PLANTILLAS_EVIDENCIA.INDUSTRIAL;
  const primeraPendiente = detalle?.plan_completitud?.pendientes?.[0]?.texto;
  return <div className="auto-card">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="easy-kicker">Automatización asistida</p>
        <h2><Sparkles className="w-5 h-5" /> Hazlo más rápido</h2>
        <p>Usa plantillas para llenar campos comunes. Después confirma los datos reales y adjunta respaldo.</p>
      </div>
      {primeraPendiente && <div className="next-action"><CheckCircle2 className="w-4 h-4" /><span>Siguiente: {primeraPendiente}</span></div>}
    </div>
    <div className="auto-grid">
      <button type="button" onClick={onExpediente}>Preparar expediente típico</button>
      {plantillas.map((plantilla) => <button type="button" key={plantilla.nombre} onClick={() => onEvidencia(plantilla)}>Plantilla: {plantilla.nombre}</button>)}
      {esCorredor && PLANTILLAS_HITOS.map((plantilla) => <button type="button" key={plantilla.nombre} onClick={() => onHito(plantilla)}>Hito: {plantilla.nombre}</button>)}
      {esCorredor && <button type="button" onClick={onEudrNoAplica}>EUDR: dejar no aplica preliminar</button>}
    </div>
  </div>;
}

function ReferenciasCbam({ referencias }) {
  if (!referencias) return null;
  return <div className="panel-card"><h2><Scale /> CBAM: qué norma se usó</h2><div className="norm-note">{referencias.aviso}</div>
    <div className="norm-grid mt-2">{referencias.fuentes.map((fuente) => <div className="norm-card" key={fuente.clave}><NormChip tipo={fuente.vinculante ? 'binding' : fuente.tipo === 'GUIA' ? 'guide' : 'reference'}>{fuente.vinculante ? 'Texto vinculante' : fuente.tipo === 'GUIA' ? 'Guía' : 'Referencia'}</NormChip><strong>{fuente.titulo}</strong><span>{fuente.referencia_legal} · versión {fuente.version || 'sin versión'}</span><small><a className="underline" href={fuente.url_oficial} target="_blank" rel="noreferrer">Fuente oficial</a>{fuente.nota_uso ? ` · ${fuente.nota_uso}` : ''}</small></div>)}</div>
    <div className="mt-4"><h3 className="font-semibold text-sm">Valores por defecto: {referencias.pais || 'país por identificar'}</h3>{referencias.valores_defecto.length ? <div className="record-list mt-2">{referencias.valores_defecto.map((valor, indice) => <div className="record" key={`${valor.codigo_cn}-${indice}`}><strong>CN {valor.codigo_cn} · {valor.descripcion}</strong><span>Directas {valor.emisiones_directas ?? 'N/D'} · Indirectas {valor.emisiones_indirectas ?? 'N/D'} · Total {valor.emisiones_totales ?? 'N/D'} {valor.unidad}</span><small>{valor.referencia_legal} · {valor.version}</small></div>)}</div> : <p className="text-xs text-slate-400 mt-2">Sin coincidencias hasta que se complete país de origen y código CN.</p>}</div>
    <div className="mt-4"><h3 className="font-semibold text-sm">Benchmarks de referencia</h3>{referencias.benchmarks.length ? <div className="record-list mt-2">{referencias.benchmarks.map((valor, indice) => <div className="record" key={`${valor.codigo_cn}-${indice}`}><strong>CN {valor.codigo_cn} · {valor.descripcion}</strong><span>A: {valor.benchmark_a ?? 'N/D'} {valor.ruta_benchmark_a || ''} · B: {valor.benchmark_b ?? 'N/D'} {valor.ruta_benchmark_b || ''}</span><small>{valor.referencia_legal} · {valor.version}</small></div>)}</div> : <p className="text-xs text-slate-400 mt-2">Ingresa un código CN para consultar benchmark.</p>}</div>
  </div>;
}

function MatrizPaisesCorredor({ paises }) {
  return <div className="panel-card"><h2><MapPinned /> Países y documentos esperados</h2><p>Úsalo como lista de chequeo por tramo. Marca qué actor, país y respaldo corresponde en cada hito.</p><div className="record-list mt-3">{paises.map((pais) => <div className="record" key={pais.codigo}><strong>{pais.codigo} · {pais.nombre}</strong><span>{pais.rol_logistico}</span><small>{pais.evidencia_base}</small></div>)}</div></div>;
}

function PlanCompletitud({ plan, onSiguiente }) {
  return <div className={plan.listo_para_revision ? 'panel-card ready-card' : 'panel-card emphasis'}><h2>{plan.listo_para_revision ? <CheckCircle2 /> : <AlertTriangle />} {plan.listo_para_revision ? 'Listo para revisión técnica' : 'Qué falta para preparar'}</h2><p>Cobertura: <strong>{plan.completitud_pct}%</strong>. {plan.listo_para_revision ? 'No quedan bloqueos estructurales; la conclusión técnica sigue siendo una decisión humana.' : `${plan.bloqueos_salida} requisito(s) estructural(es) aún bloquean la salida.`}</p>{plan.pendientes.length ? <ol className="mt-3 list-decimal pl-5 text-sm space-y-2 text-slate-700">{plan.pendientes.map((pendiente, indice) => <li key={`${pendiente.tipo}-${indice}`}>{pendiente.texto}</li>)}</ol> : <p className="mt-3 text-sm text-emerald-700">No hay pendientes estructurales detectados; corresponde la revisión técnica de cierre.</p>}{!plan.listo_para_revision && <button type="button" className="secondary-action" onClick={onSiguiente}>Ir al siguiente paso</button>}</div>;
}

function EstadoDeSalida({ detalle, onSiguiente, onPrepararRevision }) {
  const listo = detalle.plan_completitud?.listo_para_revision;
  const esCbam = detalle.flujo === 'CBAM';
  return <div className={listo ? 'panel-card ready-card' : 'panel-card'}>
    <p className="easy-kicker">Control de salida</p>
    <h2>{listo ? <CheckCircle2 /> : <AlertTriangle />} {listo ? 'Expediente listo para revisión' : 'Salida aún en preparación'}</h2>
    <p>{listo ? (esCbam ? 'La estructura está completa. El verificador registra su conclusión antes de cerrar y emitir el informe preverificado.' : 'La estructura de ruta está completa. Revisa la evidencia real antes de cerrar.') : 'El PDF es una vista de trabajo; completa los bloqueos antes de declararlo preparado o cerrado.'}</p>
    {listo ? <button type="button" onClick={onPrepararRevision} disabled={detalle.estado === 'PREPARADO_PARA_TERCERO' || detalle.estado === 'CERRADO'}>{detalle.estado === 'PREPARADO_PARA_TERCERO' || detalle.estado === 'CERRADO' ? 'En revisión o cerrado' : 'Marcar preparado para revisión'}</button> : <button type="button" className="secondary-action" onClick={onSiguiente}>Mostrar siguiente paso</button>}
  </div>;
}

function TrazabilidadAutomatica({ eventos }) {
  return <div className="panel-card">
    <h2><History /> Trazabilidad automática</h2>
    <p>Bitácora técnica encadenada por hash. Registra actor, acción y metadatos; no publica el contenido sensible de los respaldos.</p>
    {eventos?.length ? <div className="record-list mt-2">{eventos.slice(0, 12).map((evento) => <div className="record" key={evento.id}>
      <strong>{evento.accion.replaceAll('_', ' ')}</strong>
      <span>{evento.entidad}{evento.entidad_id ? ` #${evento.entidad_id}` : ''} · {evento.usuario_nombre || evento.usuario_email || 'Usuario no identificado'}</span>
      <small>{evento.fecha_registro} · SHA {evento.hash_evento.slice(0, 12)}...</small>
    </div>)}</div> : <p className="mt-2 text-xs text-slate-600">El primer evento se generara cuando se cree o actualice informacion del expediente.</p>}
  </div>;
}

function EudrCorredor({ eudr, nuevoEudr, setNuevoEudr, crearEudr }) {
  if (!eudr) return null;
  return <div className="panel-card">
    <h2><Leaf /> EUDR: evaluación simple</h2>
    <div className="norm-note">{eudr.aviso}</div>
    <div className="norm-card">
      <NormChip tipo="binding">Texto vinculante UE</NormChip>
      <strong>{eudr.fuente?.titulo || 'Reglamento EUDR'}</strong>
      <span>{eudr.fechas}</span>
      {eudr.fuente && <small><a className="underline" href={eudr.fuente.url_oficial} target="_blank" rel="noreferrer">{eudr.fuente.referencia_legal}</a> · {eudr.fuente.version}</small>}
    </div>
    <form id="form-eudr" onSubmit={crearEudr} className="space-y-2">
      <div className="two-col">
        <select value={nuevoEudr.aplica} onChange={(event) => setNuevoEudr({ ...nuevoEudr, aplica: event.target.value })}>
          <option value="PENDIENTE">Pendiente de análisis</option>
          <option value="NO_APLICA">No aplica</option>
          <option value="APLICA">Aplica</option>
        </select>
        <select value={nuevoEudr.producto_relevante} onChange={(event) => setNuevoEudr({ ...nuevoEudr, producto_relevante: event.target.value })}>
          <option value="">Producto EUDR</option>
          {eudr.productos_relevantes.map((producto) => <option value={producto} key={producto}>{producto}</option>)}
        </select>
      </div>
      <div className="two-col"><input placeholder="Código HS/CN" value={nuevoEudr.codigo_hs} onChange={(event) => setNuevoEudr({ ...nuevoEudr, codigo_hs: event.target.value })}/><input placeholder="Materia prima / derivado" value={nuevoEudr.materia_prima} onChange={(event) => setNuevoEudr({ ...nuevoEudr, materia_prima: event.target.value })}/></div>
      <div className="two-col"><input placeholder="País de producción" value={nuevoEudr.pais_produccion} onChange={(event) => setNuevoEudr({ ...nuevoEudr, pais_produccion: event.target.value })}/><select value={nuevoEudr.nivel_riesgo} onChange={(event) => setNuevoEudr({ ...nuevoEudr, nivel_riesgo: event.target.value })}><option value="NO_EVALUADO">Riesgo no evaluado</option><option value="BAJO">Bajo</option><option value="ESTANDAR">Estándar</option><option value="ALTO">Alto</option></select></div>
      <input placeholder="Geolocalización, polígono o referencia del predio" value={nuevoEudr.geolocalizacion} onChange={(event) => setNuevoEudr({ ...nuevoEudr, geolocalizacion: event.target.value })}/>
      <input placeholder="Documento de legalidad en país de producción" value={nuevoEudr.documento_legalidad} onChange={(event) => setNuevoEudr({ ...nuevoEudr, documento_legalidad: event.target.value })}/>
      <input placeholder="Referencia DDS / TRACES si existe" value={nuevoEudr.referencia_dds} onChange={(event) => setNuevoEudr({ ...nuevoEudr, referencia_dds: event.target.value })}/>
      <input placeholder="Observación" value={nuevoEudr.observacion} onChange={(event) => setNuevoEudr({ ...nuevoEudr, observacion: event.target.value })}/>
      <button type="submit">Registrar evaluación EUDR</button>
    </form>
    {eudr.registros.length > 0 && <div className="record-list mt-2">{eudr.registros.map((registro) => <div className="record" key={registro.id}>
      <strong>{registro.aplica.replaceAll('_', ' ')}</strong>
      <span>{registro.producto_relevante || 'Producto no informado'} · {registro.codigo_hs || 'HS/CN pendiente'} · riesgo {registro.nivel_riesgo.replaceAll('_', ' ')}</span>
      <small>{registro.pais_produccion || 'País pendiente'}{registro.referencia_dds ? ` · DDS ${registro.referencia_dds}` : ''}</small>
    </div>)}</div>}
  </div>;
}

function ModuleHero({ esCorredor, empresas, expedientesVisibles, selectedCompany, detalle }) {
  return <section className={`module-hero ${esCorredor ? 'corridor' : 'industrial'}`}>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">{esCorredor ? 'Sistema corredor' : 'Sistema proveedor / CBAM'}</p>
        <h1 className="text-2xl font-bold text-slate-950 mt-1">{esCorredor ? 'Corredor Bioceánico + EUDR' : 'Proveedor minero y CBAM preverificado'}</h1>
        <p className="text-sm text-slate-700 mt-2 max-w-2xl">{esCorredor ? 'Un tablero para seguir la ruta: quién participa, por qué país pasa, qué documento falta y si aplica EUDR.' : 'Un tablero para armar el expediente del proveedor: datos, documentos, cobertura y salida preverificada CBAM cuando corresponda.'}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto">
        <div className="metric-card"><span>Empresas</span><strong>{empresas.length}</strong></div>
        <div className="metric-card"><span>Expedientes</span><strong>{expedientesVisibles.length}</strong></div>
        <div className="metric-card"><span>Empresa activa</span><strong className="text-sm">{selectedCompany ? 'Sí' : 'No'}</strong></div>
      <div className="metric-card"><span>Salida</span><strong className="text-sm">{esCorredor ? 'Ruta + EUDR' : 'Informe'}</strong></div>
      </div>
    </div>
    {detalle && <div className="rounded-lg bg-white/70 border border-white/80 p-3 text-xs text-slate-700">
      Expediente activo #{detalle.id}: <strong>{detalle.producto}</strong> · {detalle.estado.replaceAll('_', ' ')} · cobertura {detalle.cobertura_pct}%.
    </div>}
  </section>;
}

async function api(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'La operación no se pudo completar.');
  return data;
}

export default function EvidenceModule({ initialMode = 'INDUSTRIAL' }) {
  const [empresas, setEmpresas] = useState([]);
  const [instalaciones, setInstalaciones] = useState([]);
  const [expedientes, setExpedientes] = useState([]);
  const [empresaId, setEmpresaId] = useState('');
  const [expedienteId, setExpedienteId] = useState('');
  const [detalle, setDetalle] = useState(null);
  const [datosExpediente, setDatosExpediente] = useState({ periodo: '', producto: '', lote: '', codigo_cn: '', pais_origen: 'CL', pais_destino: '' });
  const [evidencias, setEvidencias] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [nuevaEmpresa, setNuevaEmpresa] = useState({ rut: '', razon_social: '', sector_industrial: 'Metalmecánica / proveedor minero' });
  const [nuevaInstalacion, setNuevaInstalacion] = useState({ nombre: '', direccion: '', comuna: '', pais: 'CL' });
  const esCorredor = initialMode === 'CORREDOR';
  const [nuevoExpediente, setNuevoExpediente] = useState({ instalacion_id: '', flujo: esCorredor ? 'CORREDOR_BIOCEANICO' : 'PROVEEDOR_MINERO', periodo: '2026', producto: '', lote: '', codigo_cn: '', pais_origen: 'CL', pais_destino: '' });
  const [nuevaEvidencia, setNuevaEvidencia] = useState({ bloque: 'EMPRESA_INSTALACION', concepto: '', valor: '', unidad: '', periodo: '2026', fuente: '', responsable: '', nivel_respaldo: 'DECLARADO', archivo: null });
  const [nuevoHito, setNuevoHito] = useState({ etapa: 'PRODUCTOR_ORIGEN', actor: '', pais: 'CL', estado: 'PENDIENTE', referencia: '', norma_referencia: '', documento_requerido: '', fecha_hito: '' });
  const [nuevoEudr, setNuevoEudr] = useState({ aplica: 'PENDIENTE', producto_relevante: '', codigo_hs: '', materia_prima: '', pais_produccion: '', geolocalizacion: '', documento_legalidad: '', referencia_dds: '', nivel_riesgo: 'NO_EVALUADO', observacion: '' });

  const cargarEmpresas = async () => {
    const data = await api('/api/industrial/empresas');
    setEmpresas(data.empresas);
  };
  const cargarExpedientes = async (proveedorId = '') => {
    const data = await api(`/api/industrial/expedientes${proveedorId ? `?proveedor_id=${proveedorId}` : ''}`);
    setExpedientes(data.expedientes);
  };
  const cargarInstalaciones = async (proveedorId) => {
    if (!proveedorId) return setInstalaciones([]);
    const data = await api(`/api/industrial/instalaciones?proveedor_id=${proveedorId}`);
    setInstalaciones(data.instalaciones);
  };
  const cargarDetalle = async (id) => {
    if (!id) return;
    const [detalleData, evidenciaData] = await Promise.all([api(`/api/industrial/expedientes/${id}`), api(`/api/industrial/expedientes/${id}/evidencias`)]);
    const expediente = detalleData.expediente;
    setDetalle(expediente); setEvidencias(evidenciaData.evidencias);
    setDatosExpediente({ periodo: expediente.periodo || '', producto: expediente.producto || '', lote: expediente.lote || '', codigo_cn: expediente.codigo_cn || '', pais_origen: expediente.pais_origen || 'CL', pais_destino: expediente.pais_destino || '' });
  };
  useEffect(() => { (async () => { try { await Promise.all([cargarEmpresas(), cargarExpedientes()]); } catch (error) { setMensaje({ tipo: 'error', texto: error.message }); } finally { setCargando(false); } })(); }, []);

  const selectedCompany = useMemo(() => empresas.find((empresa) => String(empresa.id) === String(empresaId)), [empresas, empresaId]);
  const expedientesVisibles = useMemo(() => expedientes.filter((expediente) => esCorredor ? expediente.flujo === 'CORREDOR_BIOCEANICO' : expediente.flujo !== 'CORREDOR_BIOCEANICO'), [expedientes, esCorredor]);
  const submit = (handler) => async (event) => { event.preventDefault(); setMensaje(null); try { await handler(); } catch (error) { setMensaje({ tipo: 'error', texto: error.message }); } };

  const seleccionarEmpresa = async (id) => {
    setEmpresaId(id); setExpedienteId(''); setDetalle(null); setEvidencias([]);
    try { await Promise.all([cargarInstalaciones(id), cargarExpedientes(id)]); } catch (error) { setMensaje({ tipo: 'error', texto: error.message }); }
  };
  const seleccionarExpediente = async (id) => {
    setExpedienteId(id);
    try { await cargarDetalle(id); } catch (error) { setMensaje({ tipo: 'error', texto: error.message }); }
  };

  const crearEmpresa = submit(async () => { await api('/api/industrial/empresas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nuevaEmpresa) }); setNuevaEmpresa({ rut: '', razon_social: '', sector_industrial: 'Metalmecánica / proveedor minero' }); await cargarEmpresas(); setMensaje({ tipo: 'ok', texto: 'Proveedor registrado.' }); });
  const crearInstalacion = submit(async () => { await api('/api/industrial/instalaciones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...nuevaInstalacion, proveedor_id: Number(empresaId) }) }); setNuevaInstalacion({ nombre: '', direccion: '', comuna: '', pais: 'CL' }); await cargarInstalaciones(empresaId); setMensaje({ tipo: 'ok', texto: 'Instalación registrada.' }); });
  const crearExpediente = submit(async () => { const data = await api('/api/industrial/expedientes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...nuevoExpediente, flujo: esCorredor ? 'CORREDOR_BIOCEANICO' : nuevoExpediente.flujo, proveedor_id: Number(empresaId), instalacion_id: nuevoExpediente.instalacion_id ? Number(nuevoExpediente.instalacion_id) : null }) }); await cargarExpedientes(empresaId); await seleccionarExpediente(String(data.id)); setMensaje({ tipo: 'ok', texto: esCorredor ? 'Expediente del Corredor abierto. Ahora registra hitos, países y EUDR si aplica.' : 'Expediente abierto. Ahora incorpora la evidencia que respalda cada dato.' }); });
  const crearEvidencia = submit(async () => { const form = new FormData(); Object.entries(nuevaEvidencia).forEach(([key, value]) => { if (value !== null && value !== '') form.append(key, value); }); await api(`/api/industrial/expedientes/${expedienteId}/evidencias`, { method: 'POST', body: form }); setNuevaEvidencia({ bloque: nuevaEvidencia.bloque, concepto: '', valor: '', unidad: '', periodo: detalle?.periodo || '2026', fuente: '', responsable: '', nivel_respaldo: 'DECLARADO', archivo: null }); await cargarDetalle(expedienteId); setMensaje({ tipo: 'ok', texto: 'Evidencia registrada y vinculada al expediente.' }); });
  const crearHito = submit(async () => { await api(`/api/industrial/expedientes/${expedienteId}/hitos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nuevoHito) }); setNuevoHito({ etapa: 'PRODUCTOR_ORIGEN', actor: '', pais: 'CL', estado: 'PENDIENTE', referencia: '', norma_referencia: '', documento_requerido: '', fecha_hito: '' }); await cargarDetalle(expedienteId); setMensaje({ tipo: 'ok', texto: 'Hito del corredor registrado.' }); });
  const crearEudr = submit(async () => { await api(`/api/industrial/expedientes/${expedienteId}/eudr`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nuevoEudr) }); setNuevoEudr({ aplica: 'PENDIENTE', producto_relevante: '', codigo_hs: '', materia_prima: '', pais_produccion: '', geolocalizacion: '', documento_legalidad: '', referencia_dds: '', nivel_riesgo: 'NO_EVALUADO', observacion: '' }); await cargarDetalle(expedienteId); setMensaje({ tipo: 'ok', texto: 'Evaluación EUDR registrada en el expediente.' }); });
  const cambiarEstado = async (estado) => { try { await api('/api/industrial/expedientes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: Number(expedienteId), estado }) }); await cargarDetalle(expedienteId); await cargarExpedientes(empresaId); setMensaje({ tipo: 'ok', texto: 'Estado del expediente actualizado.' }); } catch (error) { setMensaje({ tipo: 'error', texto: error.message }); } };
  const actualizarDatosExpediente = submit(async () => { await api('/api/industrial/expedientes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: Number(expedienteId), accion: 'ACTUALIZAR_DATOS', ...datosExpediente }) }); await cargarDetalle(expedienteId); await cargarExpedientes(empresaId); setMensaje({ tipo: 'ok', texto: 'Datos del expediente actualizados y registrados en trazabilidad.' }); });
  const irASeccion = (id) => {
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
  };
  const irASiguientePendiente = () => {
    const pendiente = detalle?.plan_completitud?.pendientes?.find((item) => item.bloquea_salida) || detalle?.plan_completitud?.pendientes?.[0];
    if (!detalle) return irASeccion('form-expediente');
    const destinos = { ALCANCE: detalle.instalacion_id ? 'form-editar-expediente' : 'form-instalacion', EVIDENCIA: 'form-evidencia', NORMA: 'form-editar-expediente', CORREDOR: 'form-hito', EUDR: 'form-eudr', REVISION: 'estado-expediente' };
    irASeccion(destinos[pendiente?.tipo] || 'form-evidencia');
  };
  const prepararExpedienteTipico = () => {
    setNuevoExpediente((actual) => ({
      ...actual,
      flujo: esCorredor ? 'CORREDOR_BIOCEANICO' : actual.flujo,
      periodo: actual.periodo || '2026',
      pais_origen: actual.pais_origen || 'CL',
      pais_destino: actual.pais_destino || (esCorredor ? 'BR' : 'UE'),
      producto: actual.producto || (esCorredor ? 'Carga corredor bioceánico' : 'Producto industrial sujeto a revisión'),
      lote: actual.lote || 'Lote / embarque pendiente',
    }));
    setMensaje({ tipo: 'ok', texto: 'Plantilla de expediente preparada. Revisa los campos antes de guardar.' });
    irASeccion('form-expediente');
  };
  const aplicarPlantillaEvidencia = (plantilla) => {
    setNuevaEvidencia((actual) => ({ ...actual, ...plantilla, periodo: detalle?.periodo || actual.periodo || '2026', archivo: null }));
    setMensaje({ tipo: 'ok', texto: `Plantilla "${plantilla.nombre}" cargada en el formulario de evidencia.` });
    irASeccion('form-evidencia');
  };
  const aplicarPlantillaHito = (plantilla) => {
    setNuevoHito((actual) => ({ ...actual, ...plantilla, referencia: actual.referencia || '', fecha_hito: actual.fecha_hito || '' }));
    setMensaje({ tipo: 'ok', texto: `Plantilla de hito "${plantilla.nombre}" cargada.` });
    irASeccion('form-hito');
  };
  const marcarEudrNoAplica = () => {
    setNuevoEudr({ aplica: 'NO_APLICA', producto_relevante: '', codigo_hs: nuevoExpediente.codigo_cn || detalle?.codigo_cn || '', materia_prima: '', pais_produccion: nuevoExpediente.pais_origen || detalle?.pais_origen || 'CL', geolocalizacion: '', documento_legalidad: '', referencia_dds: '', nivel_riesgo: 'NO_EVALUADO', observacion: 'No aplicabilidad preliminar; confirmar con producto, código HS/CN y país de producción antes de cerrar.' });
    setMensaje({ tipo: 'ok', texto: 'Evaluación EUDR preliminar preparada. Guarda solo si corresponde.' });
    irASeccion('form-eudr');
  };

  if (cargando) return <p className="text-sm text-slate-600">Cargando núcleo de evidencia...</p>;
  return <div className="space-y-6">
    {mensaje && <div className={`rounded-lg border px-4 py-3 text-sm ${mensaje.tipo === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{mensaje.texto}</div>}
    <ModuleHero esCorredor={esCorredor} empresas={empresas} expedientesVisibles={expedientesVisibles} selectedCompany={selectedCompany} detalle={detalle} />
    <GuiaRapida esCorredor={esCorredor} />
    <AutomatizacionPanel esCorredor={esCorredor} onExpediente={prepararExpedienteTipico} onEvidencia={aplicarPlantillaEvidencia} onHito={aplicarPlantillaHito} onEudrNoAplica={marcarEudrNoAplica} detalle={detalle} />
    <BibliotecaNormativa esCorredor={esCorredor} />
    <section className="grid lg:grid-cols-3 gap-4">
      <form onSubmit={crearEmpresa} className="panel-card"><h2><Building2 /> 1. {esCorredor ? 'Empresa del corredor' : 'Proveedor industrial'}</h2><p>{esCorredor ? 'Empresa que participa en origen, logística, exportación o trazabilidad documental.' : 'El pagador inicial: maestranza o proveedor minero.'}</p><input required placeholder="RUT" value={nuevaEmpresa.rut} onChange={(e) => setNuevaEmpresa({ ...nuevaEmpresa, rut: e.target.value })}/><input required placeholder="Razón social" value={nuevaEmpresa.razon_social} onChange={(e) => setNuevaEmpresa({ ...nuevaEmpresa, razon_social: e.target.value })}/><input placeholder="Sector" value={nuevaEmpresa.sector_industrial} onChange={(e) => setNuevaEmpresa({ ...nuevaEmpresa, sector_industrial: e.target.value })}/><button>{esCorredor ? 'Registrar empresa' : 'Registrar proveedor'}</button></form>
      <div className="panel-card"><h2><FolderOpen /> {esCorredor ? 'Actores registrados' : 'Cartera registrada'}</h2><select value={empresaId} onChange={(e) => seleccionarEmpresa(e.target.value)}><option value="">Selecciona una empresa…</option>{empresas.map((empresa) => <option value={empresa.id} key={empresa.id}>{empresa.razon_social} · {empresa.rut}</option>)}</select>{selectedCompany ? <div className="soft-card"><strong>{selectedCompany.razon_social}</strong><span>{selectedCompany.instalaciones} instalación(es) · {selectedCompany.expedientes} expediente(s)</span></div> : <p>Selecciona o crea una empresa para abrir este flujo.</p>}</div>
      <div className={esCorredor ? 'panel-card corridor-emphasis' : 'panel-card emphasis'}><h2>{esCorredor ? <><MapPinned /> Corredor Bioceánico + EUDR</> : <><ShieldCheck /> Informe preverificado CBAM</>}</h2><p>{esCorredor ? 'Este flujo gestiona hitos por país, actor responsable, documento exigible y evaluación EUDR cuando el producto pueda estar cubierto.' : 'Para expedientes CBAM, el informe se identifica como validado por verificador registrado. La cobertura muestra evidencia revisada y brechas visibles.'}</p></div>
    </section>

    {empresaId && <section className="grid lg:grid-cols-2 gap-4">
      <form id="form-instalacion" onSubmit={crearInstalacion} className="panel-card"><h2><Factory /> 2. Instalación</h2><p>El hecho industrial nace en una instalación identificable.</p><input required placeholder="Nombre de instalación" value={nuevaInstalacion.nombre} onChange={(e) => setNuevaInstalacion({ ...nuevaInstalacion, nombre: e.target.value })}/><div className="two-col"><input placeholder="Dirección" value={nuevaInstalacion.direccion} onChange={(e) => setNuevaInstalacion({ ...nuevaInstalacion, direccion: e.target.value })}/><input placeholder="Comuna" value={nuevaInstalacion.comuna} onChange={(e) => setNuevaInstalacion({ ...nuevaInstalacion, comuna: e.target.value })}/></div><select value={nuevaInstalacion.pais} onChange={(e) => setNuevaInstalacion({ ...nuevaInstalacion, pais: e.target.value })}><option value="CL">Chile</option><option value="BR">Brasil</option><option value="PE">Perú</option><option value="PY">Paraguay</option><option value="AR">Argentina</option></select><button>Registrar instalación</button></form>
      <form id="form-expediente" onSubmit={crearExpediente} className="panel-card"><h2><FilePlus2 /> 3. Abrir expediente</h2><div className="two-col">{esCorredor ? <div className="soft-card"><strong>Corredor Bioceánico</strong><span>Hitos logísticos, países, evidencia documental y EUDR.</span></div> : <select value={nuevoExpediente.flujo} onChange={(e) => setNuevoExpediente({ ...nuevoExpediente, flujo: e.target.value })}><option value="PROVEEDOR_MINERO">Proveedor minero</option><option value="CBAM">CBAM / bien cubierto</option></select>}<select value={nuevoExpediente.instalacion_id} onChange={(e) => setNuevoExpediente({ ...nuevoExpediente, instalacion_id: e.target.value })}><option value="">Instalación pendiente</option>{instalaciones.map((instalacion) => <option key={instalacion.id} value={instalacion.id}>{instalacion.nombre}</option>)}</select></div><div className="two-col"><input required placeholder="Período (ej. 2026-Q1)" value={nuevoExpediente.periodo} onChange={(e) => setNuevoExpediente({ ...nuevoExpediente, periodo: e.target.value })}/><input required placeholder={esCorredor ? 'Carga / producto transportado' : 'Producto fabricado'} value={nuevoExpediente.producto} onChange={(e) => setNuevoExpediente({ ...nuevoExpediente, producto: e.target.value })}/></div><div className="two-col"><input placeholder="Lote / embarque" value={nuevoExpediente.lote} onChange={(e) => setNuevoExpediente({ ...nuevoExpediente, lote: e.target.value })}/><input placeholder={esCorredor ? 'Código HS/CN si aplica' : 'Código CN si aplica'} value={nuevoExpediente.codigo_cn} onChange={(e) => setNuevoExpediente({ ...nuevoExpediente, codigo_cn: e.target.value })}/></div><div className="two-col"><input placeholder="País origen" value={nuevoExpediente.pais_origen} onChange={(e) => setNuevoExpediente({ ...nuevoExpediente, pais_origen: e.target.value })}/><input placeholder="País destino" value={nuevoExpediente.pais_destino} onChange={(e) => setNuevoExpediente({ ...nuevoExpediente, pais_destino: e.target.value })}/></div><button>{esCorredor ? 'Abrir expediente del corredor' : 'Abrir expediente'}</button></form>
    </section>}

    {empresaId && <section className="panel-card"><h2><FolderOpen /> {esCorredor ? 'Expedientes del corredor' : 'Expedientes proveedor / CBAM'}</h2><div className="chip-list">{expedientesVisibles.length ? expedientesVisibles.map((expediente) => <button type="button" key={expediente.id} onClick={() => seleccionarExpediente(String(expediente.id))} className={String(expediente.id) === String(expedienteId) ? 'chip selected' : 'chip'}><span>{expediente.producto}</span><small>{expediente.flujo.replaceAll('_', ' ')} · {expediente.periodo}</small></button>) : <p>Aún no hay expedientes en este flujo.</p>}</div></section>}

    {detalle && <section className="grid xl:grid-cols-[1.15fr_.85fr] gap-4">
      <div className="space-y-4"><div className="panel-card"><div className="flex-title"><div><h2><FileText /> 4. Evidencia del expediente #{detalle.id}</h2><p>{detalle.proveedor} · {detalle.instalacion || 'Instalación por completar'} · cobertura {detalle.cobertura_pct}%</p></div><Link className="document-link" href={`/expediente/${detalle.id}`} target="_blank">{detalle.flujo === 'CBAM' ? (detalle.estado === 'CERRADO' ? 'Informe preverificado CBAM / PDF' : 'Borrador CBAM / PDF') : 'Documento / PDF'}</Link></div><div className="coverage-grid">{detalle.bloques.map((bloque) => <div className="soft-card" key={bloque.bloque}><strong>{BLOQUES.find(([key]) => key === bloque.bloque)?.[1]}</strong><span>{bloque.cantidad} registro(s)</span><small>D {bloque.declarado} · Doc {bloque.documentado} · Fuente {bloque.validado_en_fuente}</small></div>)}</div><div id="estado-expediente" className="status-actions"><span>Estado: <strong>{detalle.estado.replaceAll('_', ' ')}</strong></span><select value={detalle.estado} onChange={(e) => cambiarEstado(e.target.value)}><option value="ABIERTO">Abierto</option><option value="EN_REVISION">En revisión</option><option value="PREPARADO_PARA_TERCERO">Preparado para tercero</option><option value="CERRADO">Cerrado</option></select></div><details id="form-editar-expediente" className="edit-details"><summary>Editar producto, lote, códigos y países</summary><form onSubmit={actualizarDatosExpediente} className="mt-3 space-y-2"><div className="two-col"><input required placeholder="Período" value={datosExpediente.periodo} onChange={(e) => setDatosExpediente({ ...datosExpediente, periodo: e.target.value })}/><input required placeholder="Producto" value={datosExpediente.producto} onChange={(e) => setDatosExpediente({ ...datosExpediente, producto: e.target.value })}/></div><div className="two-col"><input placeholder="Lote / embarque" value={datosExpediente.lote} onChange={(e) => setDatosExpediente({ ...datosExpediente, lote: e.target.value })}/><input placeholder="Código CN o HS/CN" value={datosExpediente.codigo_cn} onChange={(e) => setDatosExpediente({ ...datosExpediente, codigo_cn: e.target.value })}/></div><div className="two-col"><input placeholder="País de origen" value={datosExpediente.pais_origen} onChange={(e) => setDatosExpediente({ ...datosExpediente, pais_origen: e.target.value })}/><input placeholder="País de destino" value={datosExpediente.pais_destino} onChange={(e) => setDatosExpediente({ ...datosExpediente, pais_destino: e.target.value })}/></div><button>Guardar datos del expediente</button></form></details></div>
      <form id="form-evidencia" onSubmit={crearEvidencia} className="panel-card"><h2><Upload /> Incorporar dato y respaldo</h2><div className="two-col"><select value={nuevaEvidencia.bloque} onChange={(e) => setNuevaEvidencia({ ...nuevaEvidencia, bloque: e.target.value })}>{BLOQUES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><select value={nuevaEvidencia.nivel_respaldo} onChange={(e) => setNuevaEvidencia({ ...nuevaEvidencia, nivel_respaldo: e.target.value })}><option value="DECLARADO">Declarado</option><option value="DOCUMENTADO">Documentado</option><option value="VALIDADO_EN_FUENTE">Validado en fuente</option></select></div><input required placeholder="Concepto o dato (ej. consumo eléctrico marzo)" value={nuevaEvidencia.concepto} onChange={(e) => setNuevaEvidencia({ ...nuevaEvidencia, concepto: e.target.value })}/><div className="two-col"><input placeholder="Valor" value={nuevaEvidencia.valor} onChange={(e) => setNuevaEvidencia({ ...nuevaEvidencia, valor: e.target.value })}/><input placeholder="Unidad" value={nuevaEvidencia.unidad} onChange={(e) => setNuevaEvidencia({ ...nuevaEvidencia, unidad: e.target.value })}/></div><div className="two-col"><input placeholder="Período" value={nuevaEvidencia.periodo} onChange={(e) => setNuevaEvidencia({ ...nuevaEvidencia, periodo: e.target.value })}/><input placeholder="Fuente" value={nuevaEvidencia.fuente} onChange={(e) => setNuevaEvidencia({ ...nuevaEvidencia, fuente: e.target.value })}/></div><input placeholder="Responsable que declara/carga" value={nuevaEvidencia.responsable} onChange={(e) => setNuevaEvidencia({ ...nuevaEvidencia, responsable: e.target.value })}/><input type="file" onChange={(e) => setNuevaEvidencia({ ...nuevaEvidencia, archivo: e.target.files?.[0] || null })}/><small>Documentado y validado en fuente requieren archivo original; se conserva por SHA-256.</small><button>Incorporar evidencia</button></form>
      {evidencias.length > 0 && <div className="panel-card"><h2>Registro de evidencia</h2><div className="record-list">{evidencias.map((evidencia) => <div className="record" key={evidencia.id}><strong>{evidencia.concepto}</strong><span>{evidencia.bloque.replaceAll('_', ' ')} · {evidencia.nivel_respaldo.replaceAll('_', ' ')}</span><small>{evidencia.fuente || 'Fuente no informada'} {evidencia.hash_sha256 ? `· SHA ${evidencia.hash_sha256.slice(0, 12)}…` : ''}</small></div>)}</div></div>}
      {detalle.flujo === 'CBAM' && <ReferenciasCbam referencias={detalle.referencias_cbam} />}
      <PlanCompletitud plan={detalle.plan_completitud} onSiguiente={irASiguientePendiente} />
      <TrazabilidadAutomatica eventos={detalle.trazabilidad} />
      </div>
      <aside className="space-y-4">
        <EstadoDeSalida detalle={detalle} onSiguiente={irASiguientePendiente} onPrepararRevision={() => cambiarEstado('PREPARADO_PARA_TERCERO')} />
        {detalle.flujo === 'CORREDOR_BIOCEANICO' ? <>
          <form id="form-hito" onSubmit={crearHito} className="panel-card"><h2><MapPinned /> 5. Hito del corredor</h2>
            <select value={nuevoHito.etapa} onChange={(e) => setNuevoHito({ ...nuevoHito, etapa: e.target.value })}>{ETAPAS.map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select>
            <input required placeholder="Actor responsable" value={nuevoHito.actor} onChange={(e) => setNuevoHito({ ...nuevoHito, actor: e.target.value })}/>
            <div className="two-col"><select value={nuevoHito.pais} onChange={(e) => setNuevoHito({ ...nuevoHito, pais: e.target.value })}>{detalle.paises_corredor.map((pais) => <option value={pais.codigo} key={pais.codigo}>{pais.nombre}</option>)}</select><select value={nuevoHito.estado} onChange={(e) => setNuevoHito({ ...nuevoHito, estado: e.target.value })}><option value="PENDIENTE">Pendiente</option><option value="DOCUMENTADO">Documentado</option><option value="VALIDADO_EN_FUENTE">Validado en fuente</option></select></div>
            <input placeholder="Documento / referencia" value={nuevoHito.referencia} onChange={(e) => setNuevoHito({ ...nuevoHito, referencia: e.target.value })}/>
            <input placeholder="Norma o requisito aplicable" value={nuevoHito.norma_referencia} onChange={(e) => setNuevoHito({ ...nuevoHito, norma_referencia: e.target.value })}/>
            <input placeholder="Evidencia requerida" value={nuevoHito.documento_requerido} onChange={(e) => setNuevoHito({ ...nuevoHito, documento_requerido: e.target.value })}/>
            <input type="date" value={nuevoHito.fecha_hito} onChange={(e) => setNuevoHito({ ...nuevoHito, fecha_hito: e.target.value })}/><button>Registrar hito</button>
          </form>
          <MatrizPaisesCorredor paises={detalle.paises_corredor} />
          <EudrCorredor eudr={detalle.eudr} nuevoEudr={nuevoEudr} setNuevoEudr={setNuevoEudr} crearEudr={crearEudr} />
        </> : <div className="panel-card emphasis"><h2><ShieldCheck /> Validación del expediente</h2><p>{detalle.flujo === 'CBAM' ? 'Este expediente puede emitirse como Informe Preverificado CBAM, validado por verificador registrado. No genera certificados CBAM ni reemplaza el informe formal aplicable.' : 'SICR3P ordena evidencia, cobertura y faltantes para la revisión que corresponda.'}</p></div>}
        {detalle.hitos.length > 0 && <div className="panel-card"><h2>Cadena de origen a destino</h2><div className="record-list">{detalle.hitos.map((hito) => <div className="record" key={hito.id}><strong>{hito.etapa.replaceAll('_', ' ')}</strong><span>{hito.actor} · {hito.pais}</span><small>{hito.estado.replaceAll('_', ' ')}{hito.norma_referencia ? ` · ${hito.norma_referencia}` : ''}</small></div>)}</div></div>}
      </aside>
    </section>}
  </div>;
}
