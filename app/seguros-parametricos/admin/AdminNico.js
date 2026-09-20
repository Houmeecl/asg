'use client';

import { useEffect, useState } from 'react';
import { RIESGOS, SECTORES, clp } from '../data';

const PESTANAS = [
  ['cotizaciones', 'Cotizaciones SICR3P'],
  ['polizas', 'Pólizas Nico'],
  ['leads', 'Leads Nico'],
  ['productos', 'Productos'],
  ['cuentas', 'Cuentas'],
  ['catalogos', 'Catálogos'],
  ['conexion', 'Conexión'],
];

const CATALOGOS = [['companias', 'Compañías'], ['ramos', 'Ramos'], ['rubros', 'Rubros'], ['regiones', 'Regiones'], ['comunas', 'Comunas'], ['planes_pago', 'Planes de pago']];

const inputCls = 'rounded-xl border border-[#0b1a12]/15 bg-white px-3 py-2.5 text-sm w-full';
const btn = 'rounded-full bg-[#0b1a12] text-[#d7ff3f] px-5 py-2.5 text-sm font-semibold hover:bg-[#16301f] disabled:opacity-40';

// La API de Nico devuelve { data: [...] }; algunos recursos usan { id, attributes }.
function filas(json) {
  const lista = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
  return lista.map((it) => (it && typeof it === 'object' ? { ...(it.attributes ?? {}), ...it } : { valor: it }));
}

const PRIORIDAD = ['id', 'policy_number', 'name', 'label', 'account_name', 'business_name', 'status', 'step', 'insurance_company', 'insurance_category', 'created_at'];

function columnas(rows) {
  const claves = new Set();
  rows.slice(0, 10).forEach((r) => Object.entries(r).forEach(([k, v]) => {
    if (k !== 'type' && k !== 'attributes' && (v === null || ['string', 'number', 'boolean'].includes(typeof v))) claves.add(k);
  }));
  const orden = [...PRIORIDAD.filter((k) => claves.has(k)), ...[...claves].filter((k) => !PRIORIDAD.includes(k))];
  return orden.slice(0, 6);
}

const celda = (v) => (v === null || v === undefined ? '—' : String(v).length > 60 ? `${String(v).slice(0, 57)}…` : String(v));

function TablaNico({ recurso }) {
  const [q, setQ] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [resultado, setResultado] = useState(null); // { clave, json?, error? }
  const [abierta, setAbierta] = useState(null);

  const clave = `${recurso}|${busqueda}|${pagina}`;

  useEffect(() => {
    let vigente = true;
    const p = new URLSearchParams({ display_length: '20', display_start: String(pagina) });
    if (busqueda) p.set('query', busqueda);
    fetch(`/api/seguros/admin/nico/${recurso}?${p}`)
      .then(async (r) => ({ ok: r.ok, json: await r.json().catch(() => null) }))
      .then(({ ok, json }) => vigente && setResultado(ok ? { clave, json } : { clave, error: json?.error ?? 'Error al consultar Nico.' }))
      .catch(() => vigente && setResultado({ clave, error: 'No hay conexión con el servidor.' }));
    return () => { vigente = false; };
  }, [clave, recurso, busqueda, pagina]);

  const cargando = resultado?.clave !== clave;
  const rows = cargando || resultado.error ? [] : filas(resultado.json);
  const cols = columnas(rows);

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={(e) => { e.preventDefault(); setPagina(1); setBusqueda(q.trim()); setAbierta(null); }} className="flex gap-2 max-w-md">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className={inputCls} />
        <button className={btn}>Buscar</button>
      </form>

      {cargando && <p className="text-sm text-[#0b1a12]/60">Consultando Nico…</p>}
      {!cargando && resultado.error && <p role="alert" className="text-sm text-red-700 rounded-xl bg-red-50 px-4 py-3">{resultado.error}</p>}
      {!cargando && !resultado.error && rows.length === 0 && <p className="text-sm text-[#0b1a12]/60">Sin resultados.</p>}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-[#0b1a12]/10 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-[#0b1a12]/50">
                {cols.map((c) => <th key={c} className="px-4 py-3 font-semibold">{c.replaceAll('_', ' ')}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id ?? i} onClick={() => setAbierta(abierta === i ? null : i)} className="border-t border-[#0b1a12]/10 hover:bg-[#f6f5ef] cursor-pointer align-top">
                  {cols.map((c) => <td key={c} className="px-4 py-3">{celda(r[c])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {abierta !== null && rows[abierta] && (
        <pre className="text-xs bg-[#0b1a12] text-[#d7ff3f] rounded-2xl p-4 overflow-x-auto max-h-80">{JSON.stringify(rows[abierta], null, 2)}</pre>
      )}

      <div className="flex items-center gap-3 text-sm">
        <button className="rounded-full border border-[#0b1a12]/30 px-4 py-2 disabled:opacity-30" disabled={pagina <= 1 || cargando} onClick={() => { setPagina((p) => p - 1); setAbierta(null); }}>Anterior</button>
        <span className="text-[#0b1a12]/60">Página {pagina}</span>
        <button className="rounded-full border border-[#0b1a12]/30 px-4 py-2 disabled:opacity-30" disabled={cargando || rows.length < 20} onClick={() => { setPagina((p) => p + 1); setAbierta(null); }}>Siguiente</button>
      </div>
    </div>
  );
}

function Conexion() {
  const [estado, setEstado] = useState(null);
  const [probando, setProbando] = useState(false);

  async function probar() {
    setProbando(true);
    try {
      const r = await fetch('/api/seguros/admin/nico-estado');
      setEstado(await r.json());
    } catch {
      setEstado({ ok: false, error: 'No hay conexión con el servidor.' });
    } finally {
      setProbando(false);
    }
  }

  return (
    <div className="max-w-xl flex flex-col gap-4">
      <p className="text-sm text-[#0b1a12]/70 leading-relaxed">
        SICR3P se conecta a la API de Nico desde el servidor, con las variables de entorno <code className="font-mono">NICO_API_EMAIL</code> y{' '}
        <code className="font-mono">NICO_API_PASSWORD</code>. Las credenciales nunca llegan al navegador.
      </p>
      <button onClick={probar} disabled={probando} className={`${btn} self-start`}>{probando ? 'Probando…' : 'Probar conexión'}</button>
      {estado && (
        <div role="status" className={`rounded-2xl px-5 py-4 text-sm ${estado.ok ? 'bg-[#d7ff3f]/50' : 'bg-red-50 text-red-800'}`}>
          <p className="font-semibold">{estado.ok ? 'Conectado a Nico' : !estado.configurado && estado.configurado !== undefined ? 'Sin configurar' : 'No se pudo conectar'}</p>
          <p className="mt-1 break-all">{estado.base}</p>
          {estado.error && <p className="mt-1">{estado.error}</p>}
          {estado.configurado === false && <p className="mt-1">Define NICO_API_EMAIL y NICO_API_PASSWORD en el entorno y reinicia el servidor.</p>}
        </div>
      )}
    </div>
  );
}

function etiqueta(it) {
  const a = { ...(it.attributes ?? {}), ...it };
  return a.name ?? a.label ?? a.business_name ?? a.account_name ?? `#${a.id}`;
}

function FormularioLead({ poliza, onListo, onCancelar }) {
  const [opciones, setOpciones] = useState(null); // { cuentas, ramos } | { error }
  const [f, setF] = useState({
    account_id: '', insurance_category_id: '', hiring_person_name: poliza.empresa,
    hiring_person_national_identification: '', hiring_person_address: '',
    responsible_email: poliza.usuario_email, currency: 'uf', estimated_net_prime: '', requested: false,
  });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let vigente = true;
    Promise.all(['cuentas', 'ramos'].map((r) =>
      fetch(`/api/seguros/admin/nico/${r}?display_length=100`).then(async (x) => {
        const j = await x.json().catch(() => null);
        if (!x.ok) throw new Error(j?.error ?? 'Error al consultar Nico.');
        return filas(j);
      })))
      .then(([cuentas, ramos]) => vigente && setOpciones({ cuentas, ramos }))
      .catch((e) => vigente && setOpciones({ error: e.message }));
    return () => { vigente = false; };
  }, []);

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      const r = await fetch('/api/seguros/admin/nico/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...f,
          polizaId: poliza.id,
          account_id: Number(f.account_id),
          insurance_category_id: Number(f.insurance_category_id),
          estimated_net_prime: f.estimated_net_prime === '' ? undefined : Number(f.estimated_net_prime),
        }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) return setError(typeof j?.error === 'string' ? j.error : JSON.stringify(j?.error ?? 'No se pudo enviar.'));
      onListo(poliza.id, j.leadId);
    } catch {
      setError('No hay conexión con el servidor.');
    } finally {
      setEnviando(false);
    }
  }

  if (!opciones) return <p className="text-sm text-[#0b1a12]/60 p-4">Cargando cuentas y ramos de Nico…</p>;
  if (opciones.error) return <p role="alert" className="text-sm text-red-700 p-4">{opciones.error}</p>;

  return (
    <form onSubmit={enviar} className="grid sm:grid-cols-2 gap-3 p-4 bg-[#f6f5ef]">
      <label className="text-xs font-semibold uppercase tracking-wider text-[#0b1a12]/60 flex flex-col gap-1.5">Cuenta en Nico
        <select required className={inputCls} value={f.account_id} onChange={(e) => set('account_id', e.target.value)}>
          <option value="">Elegir…</option>
          {opciones.cuentas.map((c) => <option key={c.id} value={c.id}>{etiqueta(c)}</option>)}
        </select>
      </label>
      <label className="text-xs font-semibold uppercase tracking-wider text-[#0b1a12]/60 flex flex-col gap-1.5">Ramo
        <select required className={inputCls} value={f.insurance_category_id} onChange={(e) => set('insurance_category_id', e.target.value)}>
          <option value="">Elegir…</option>
          {opciones.ramos.map((c) => <option key={c.id} value={c.id}>{etiqueta(c)}</option>)}
        </select>
      </label>
      <label className="text-xs font-semibold uppercase tracking-wider text-[#0b1a12]/60 flex flex-col gap-1.5">Contratante
        <input required className={inputCls} value={f.hiring_person_name} onChange={(e) => set('hiring_person_name', e.target.value)} />
      </label>
      <label className="text-xs font-semibold uppercase tracking-wider text-[#0b1a12]/60 flex flex-col gap-1.5">RUT contratante
        <input required className={inputCls} placeholder="12.345.678-5" value={f.hiring_person_national_identification} onChange={(e) => set('hiring_person_national_identification', e.target.value)} />
      </label>
      <label className="sm:col-span-2 text-xs font-semibold uppercase tracking-wider text-[#0b1a12]/60 flex flex-col gap-1.5">Dirección (dirección, comuna y ciudad)
        <input required className={inputCls} value={f.hiring_person_address} onChange={(e) => set('hiring_person_address', e.target.value)} />
      </label>
      <label className="text-xs font-semibold uppercase tracking-wider text-[#0b1a12]/60 flex flex-col gap-1.5">Correo del encargado
        <input required type="email" className={inputCls} value={f.responsible_email} onChange={(e) => set('responsible_email', e.target.value)} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#0b1a12]/60 flex flex-col gap-1.5">Moneda
          <select className={inputCls} value={f.currency} onChange={(e) => set('currency', e.target.value)}>
            <option value="uf">UF</option><option value="usd">USD</option>
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-wider text-[#0b1a12]/60 flex flex-col gap-1.5">Prima neta (opc.)
          <input type="number" min="0" step="any" className={inputCls} value={f.estimated_net_prime} onChange={(e) => set('estimated_net_prime', e.target.value)} />
        </label>
      </div>
      <label className="sm:col-span-2 flex items-start gap-2 text-sm">
        <input type="checkbox" checked={f.requested} onChange={(e) => set('requested', e.target.checked)} className="mt-1 accent-[#0b1a12]" />
        <span>Solicitar cotización a las aseguradoras ahora. <span className="text-[#0b1a12]/55">Si no, solo se guarda como oportunidad en Nico.</span></span>
      </label>
      {error && <p role="alert" className="sm:col-span-2 text-sm text-red-700">{error}</p>}
      <div className="sm:col-span-2 flex gap-2">
        <button disabled={enviando} className={btn}>{enviando ? 'Enviando…' : 'Enviar a Nico'}</button>
        <button type="button" onClick={onCancelar} className="rounded-full border border-[#0b1a12]/30 px-5 py-2.5 text-sm font-semibold">Cancelar</button>
      </div>
    </form>
  );
}

function Cotizaciones({ polizas: iniciales }) {
  const [polizas, setPolizas] = useState(iniciales);
  const [abierta, setAbierta] = useState(null);

  function enviada(id, leadId) {
    setPolizas((ps) => ps.map((p) => (p.id === id ? { ...p, nico_lead_id: String(leadId ?? 'sin-id') } : p)));
    setAbierta(null);
  }

  if (polizas.length === 0) return <p className="text-sm text-[#0b1a12]/60">Todavía no hay cotizaciones de clientes.</p>;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[#0b1a12]/65 max-w-2xl">Cotizaciones creadas por los clientes en el sitio. Envíalas como oportunidad (lead) a Nico; la acción escribe en el sistema de Nico, por eso es manual y única por cotización.</p>
      <div className="overflow-x-auto rounded-2xl border border-[#0b1a12]/10 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-[#0b1a12]/50">
              {['#', 'Cliente', 'Empresa', 'Sector', 'Riesgo', 'Monto', 'Nico', ''].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {polizas.map((p) => (
              <FilaCotizacion key={p.id} p={p} abierta={abierta === p.id} onAbrir={() => setAbierta(abierta === p.id ? null : p.id)} onListo={enviada} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilaCotizacion({ p, abierta, onAbrir, onListo }) {
  return (
    <>
      <tr className="border-t border-[#0b1a12]/10 align-top">
        <td className="px-4 py-3">{p.id}</td>
        <td className="px-4 py-3">{p.usuario_nombre}<span className="block text-xs text-[#0b1a12]/50">{p.usuario_email}</span></td>
        <td className="px-4 py-3">{p.empresa}<span className="block text-xs text-[#0b1a12]/50">{p.localidad}, {p.zona}</span></td>
        <td className="px-4 py-3">{SECTORES.find((s) => s.slug === p.sector)?.nombre ?? p.sector}</td>
        <td className="px-4 py-3">{RIESGOS[p.riesgo]?.nombre ?? p.riesgo}</td>
        <td className="px-4 py-3 whitespace-nowrap">{clp(p.monto)}</td>
        <td className="px-4 py-3">{p.nico_lead_id ? <span className="rounded-full bg-[#d7ff3f] px-3 py-1 text-xs font-semibold">Lead {p.nico_lead_id}</span> : <span className="text-[#0b1a12]/40">—</span>}</td>
        <td className="px-4 py-3 text-right">{!p.nico_lead_id && <button onClick={onAbrir} className="rounded-full border border-[#0b1a12] px-4 py-1.5 text-xs font-semibold hover:bg-[#f6f5ef]">{abierta ? 'Cerrar' : 'Enviar a Nico'}</button>}</td>
      </tr>
      {abierta && (
        <tr className="border-t border-[#0b1a12]/10"><td colSpan={8} className="p-0"><FormularioLead poliza={p} onListo={onListo} onCancelar={onAbrir} /></td></tr>
      )}
    </>
  );
}

export default function AdminNico({ usuario, polizas }) {
  const [tab, setTab] = useState('cotizaciones');
  const [catalogo, setCatalogo] = useState('companias');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-widest font-semibold text-[#0b1a12]/50">Administración</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Integración con Nico Seguros</h1>
        <p className="text-sm text-[#0b1a12]/60">{usuario.email} · rol administrador</p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {PESTANAS.map(([k, n]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-full text-sm font-medium border ${tab === k ? 'bg-[#0b1a12] text-[#d7ff3f] border-[#0b1a12]' : 'border-[#0b1a12]/15 hover:border-[#0b1a12]'}`}>
            {n}
          </button>
        ))}
      </div>

      {tab === 'cotizaciones' && <Cotizaciones polizas={polizas} />}
      {tab === 'conexion' && <Conexion />}
      {['polizas', 'leads', 'productos', 'cuentas'].includes(tab) && <TablaNico key={tab} recurso={tab} />}
      {tab === 'catalogos' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {CATALOGOS.map(([k, n]) => (
              <button key={k} onClick={() => setCatalogo(k)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${catalogo === k ? 'bg-[#d7ff3f] border-[#0b1a12]' : 'border-[#0b1a12]/15'}`}>{n}</button>
            ))}
          </div>
          <TablaNico key={catalogo} recurso={catalogo} />
        </div>
      )}
    </div>
  );
}
