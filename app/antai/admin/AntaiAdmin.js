'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, CircleDollarSign, CreditCard, FilePlus2, Plus, ReceiptText, Search, ShieldCheck, WalletCards, X } from 'lucide-react';

const money = (amount) => `$ ${Number(amount || 0).toLocaleString('es-CL')}`;
const initialForm = { rut: '', razon_social: '', email_contacto: '', telefono: '', tipo_cliente: 'PROVEEDOR' };

export default function AntaiAdmin({ nombre }) {
  const [clientes, setClientes] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [form, setForm] = useState(initialForm);
  const [nuevo, setNuevo] = useState(false);
  const [movimiento, setMovimiento] = useState({ tipo: 'CARGA', monto: '', descripcion: '', centro_costo: '' });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [tarjetasDemo, setTarjetasDemo] = useState({});

  async function api(url, options) {
    const response = await fetch(url, options);
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'No se pudo completar la operación.');
    return body;
  }
  async function loadClients(preferId) {
    setCargando(true);
    try {
      const data = await api('/api/antai/clientes');
      setClientes(data.clientes);
      const client = data.clientes.find((item) => item.id === preferId) || data.clientes[0];
      if (client) await loadDetail(client.id, false);
      else { setSeleccionado(null); setDetalle(null); }
    } catch (err) { setError(err.message); } finally { setCargando(false); }
  }
  async function loadDetail(id, setLoading = true) {
    if (setLoading) setCargando(true);
    try { const data = await api(`/api/antai/clientes/${id}`); setSeleccionado(data.cliente.id); setDetalle(data); }
    catch (err) { setError(err.message); } finally { if (setLoading) setCargando(false); }
  }
  useEffect(() => {
    let activo = true;
    fetch('/api/antai/clientes')
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'No se pudieron cargar los clientes.');
        return body;
      })
      .then(async (data) => {
        if (!activo) return;
        setClientes(data.clientes);
        const primerCliente = data.clientes[0];
        if (!primerCliente) return;
        const response = await fetch(`/api/antai/clientes/${primerCliente.id}`);
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'No se pudo abrir la cuenta.');
        if (activo) { setSeleccionado(body.cliente.id); setDetalle(body); }
      })
      .catch((err) => { if (activo) setError(err.message); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, []);
  const filtered = useMemo(() => clientes.filter((item) => `${item.razon_social} ${item.rut}`.toLowerCase().includes(busqueda.toLowerCase())), [clientes, busqueda]);
  function notify(text) { setMensaje(text); setError(''); window.setTimeout(() => setMensaje(''), 3500); }
  function emitirTarjetaDemo(cliente) {
    const lastFour = String(Math.floor(1000 + Math.random() * 9000));
    setTarjetasDemo((actual) => ({ ...actual, [cliente.id]: { id: `DEMO-${Date.now().toString(36).toUpperCase()}`, lastFour } }));
    notify(`Tarjeta virtual demo •••• ${lastFour} creada sólo para presentación.`);
  }
  async function createClient(event) {
    event.preventDefault(); setGuardando(true); setError('');
    try { const data = await api('/api/antai/clientes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); setForm(initialForm); setNuevo(false); notify(data.mensaje); await loadClients(data.clienteId); }
    catch (err) { setError(err.message); } finally { setGuardando(false); }
  }
  async function createMovement(event) {
    event.preventDefault(); if (!seleccionado) return; setGuardando(true); setError('');
    try { const data = await api(`/api/antai/clientes/${seleccionado}/movimientos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...movimiento, monto: Number(movimiento.monto) }) }); setMovimiento({ tipo: 'CARGA', monto: '', descripcion: '', centro_costo: '' }); notify(`${data.mensaje} Referencia ${data.referencia}.`); await loadClients(seleccionado); }
    catch (err) { setError(err.message); } finally { setGuardando(false); }
  }

  return <main className="min-h-screen bg-[#f5f7f5] text-[#102b4a]">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 lg:px-8"><Link href="/antai" className="flex items-center gap-3 text-sm font-bold"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#102b4a] text-lg font-black text-white">A<span className="text-[#35b425]">i</span></span><span>ANTĀi <span className="font-normal text-slate-400">/ Administración</span></span></Link><div className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 text-[#229719]" />Administrador: {nombre}</div></div></header>
    <div className="mx-auto max-w-[1500px] px-5 py-7 lg:px-8">
      <Link href="/antai" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#102b4a]"><ArrowLeft className="h-4 w-4" />Volver a ANTĀi</Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#229719]">Operación prepago</p><h1 className="mt-2 text-3xl font-black tracking-tight">Clientes y cuentas ANTĀi</h1><p className="mt-1 text-sm text-slate-500">Crea clientes, consulta saldos y registra cargas o cargos internos.</p></div><button onClick={() => { setNuevo(true); setError(''); }} className="inline-flex items-center gap-2 rounded-xl bg-[#35b425] px-4 py-3 text-sm font-bold text-white"><Plus className="h-4 w-4" />Nuevo cliente</button></div>
      {(error || mensaje) && <div className={`mt-5 rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'}`}>{error || mensaje}</div>}
      <div className="mt-7 grid gap-5 xl:grid-cols-[350px_minmax(0,1fr)_390px]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar cliente o RUT" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#35b425]" /></div><div className="mt-4 space-y-2">{cargando && <p className="p-3 text-sm text-slate-500">Cargando clientes…</p>}{!cargando && filtered.length === 0 && <p className="p-3 text-sm text-slate-500">Aún no hay clientes ANTĀi.</p>}{filtered.map((cliente) => <button key={cliente.id} onClick={() => loadDetail(cliente.id)} className={`w-full rounded-xl border p-3 text-left transition ${seleccionado === cliente.id ? 'border-[#35b425] bg-green-50' : 'border-transparent hover:bg-slate-50'}`}><div className="flex items-start justify-between gap-2"><span className="line-clamp-1 text-sm font-bold">{cliente.razon_social}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cliente.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'}`}>{cliente.estado}</span></div><p className="mt-1 text-xs text-slate-500">{cliente.rut} · {cliente.tipo_cliente}</p><p className="mt-3 text-sm font-black text-[#102b4a]">{money(cliente.saldo_disponible)}</p></button>)}</div></aside>
        <section className="min-w-0">{detalle ? <ClientAccount detail={detalle} tarjetaDemo={tarjetasDemo[detalle.cliente.id]} onEmitirDemo={() => emitirTarjetaDemo(detalle.cliente)} /> : <EmptyState />}</section>
        <aside>{detalle && <MovementForm value={movimiento} onChange={setMovimiento} onSubmit={createMovement} disabled={guardando || detalle.cliente.cuenta_estado !== 'ACTIVA'} />}</aside>
      </div>
    </div>
    {nuevo && <NewClientModal form={form} setForm={setForm} onClose={() => setNuevo(false)} onSubmit={createClient} saving={guardando} />}
  </main>;
}

function ClientAccount({ detail, tarjetaDemo, onEmitirDemo }) { const { cliente, movimientos } = detail; return <div className="space-y-5"><section className="rounded-2xl bg-[#102b4a] p-6 text-white shadow-xl"><div className="flex flex-wrap justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#73db65]">Cuenta prepago</p><h2 className="mt-2 text-2xl font-black">{cliente.razon_social}</h2><p className="mt-1 text-sm text-slate-300">{cliente.rut} · {cliente.cuenta_alias}</p></div><WalletCards className="h-9 w-9 text-[#73db65]" /></div><div className="mt-8 grid gap-4 border-t border-white/15 pt-5 sm:grid-cols-3"><div><p className="text-xs text-slate-300">Saldo disponible</p><p className="mt-1 text-3xl font-black">{money(cliente.saldo_disponible)}</p><p className="mt-1 text-xs text-[#73db65]">{cliente.moneda} · {cliente.cuenta_estado}</p></div><div><p className="text-xs text-slate-300">Tipo de cliente</p><p className="mt-1 text-sm font-bold">{cliente.tipo_cliente}</p></div><div><p className="text-xs text-slate-300">Contacto</p><p className="mt-1 truncate text-sm font-bold">{cliente.email_contacto || 'Sin correo registrado'}</p></div></div></section><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4"><div><h3 className="font-black">Tarjeta digital ANTĀi</h3><p className="mt-1 text-xs text-slate-500">Recurso visual de la demostración; no tiene datos bancarios ni opera pagos.</p></div>{!tarjetaDemo && <button onClick={onEmitirDemo} className="inline-flex items-center gap-2 rounded-xl bg-[#35b425] px-3 py-2 text-sm font-bold text-white"><CreditCard className="h-4 w-4" />Generar tarjeta demo</button>}</div>{tarjetaDemo && <div className="mt-5 max-w-sm rounded-2xl bg-gradient-to-br from-[#122f50] to-[#1f5f6a] p-5 text-white shadow-lg"><div className="flex justify-between text-xs font-bold tracking-[.14em]"><span>ANTĀi</span><span className="rounded bg-[#73db65] px-2 py-0.5 text-[9px] text-[#102b4a]">DEMO</span></div><CreditCard className="mt-7 h-8 w-8 text-[#73db65]" /><p className="mt-5 font-mono text-xl tracking-[.22em]">•••• •••• •••• {tarjetaDemo.lastFour}</p><div className="mt-5 flex justify-between text-[10px] text-slate-300"><span>{cliente.razon_social.slice(0, 22).toUpperCase()}</span><span>VIRTUAL · NO HABILITADA</span></div></div>}</section><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h3 className="font-black">Movimientos de cuenta</h3><p className="mt-1 text-xs text-slate-500">Registro administrativo interno, no comprobante bancario.</p></div><ReceiptText className="h-5 w-5 text-[#229719]" /></div><div className="mt-5 divide-y divide-slate-100">{movimientos.length === 0 && <p className="py-6 text-sm text-slate-500">Esta cuenta aún no tiene movimientos.</p>}{movimientos.map((item) => <div key={item.id} className="flex items-center gap-3 py-4"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.tipo === 'CARGO' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-[#229719]'}`}><CircleDollarSign className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-bold">{item.descripcion}</p><p className="truncate text-xs text-slate-500">{item.referencia} · {item.centro_costo || 'Sin centro de costo'} · {item.fecha_registro}</p></div><span className={`text-sm font-black ${item.tipo === 'CARGO' ? 'text-slate-800' : 'text-[#229719]'}`}>{item.tipo === 'CARGO' ? '-' : '+'} {money(item.monto)}</span></div>)}</div></section></div>; }
function MovementForm({ value, onChange, onSubmit, disabled }) { return <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><FilePlus2 className="h-5 w-5 text-[#229719]" /><div><h3 className="font-black">Registrar movimiento</h3><p className="text-xs text-slate-500">Modifica el saldo de esta cuenta.</p></div></div><label className="mt-5 block text-xs font-bold text-slate-500">TIPO<select value={value.tipo} onChange={(e) => onChange({ ...value, tipo: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-bold outline-none"><option value="CARGA">Carga de saldo</option><option value="CARGO">Cargo por servicio</option><option value="AJUSTE">Ajuste positivo</option></select></label><label className="mt-3 block text-xs font-bold text-slate-500">MONTO (CLP)<input required min="1" step="1" type="number" value={value.monto} onChange={(e) => onChange({ ...value, monto: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm font-bold outline-none" placeholder="Ej. 150000" /></label><label className="mt-3 block text-xs font-bold text-slate-500">DESCRIPCIÓN<input required value={value.descripcion} onChange={(e) => onChange({ ...value, descripcion: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none" placeholder="Ej. Carga Operación Norte" /></label><label className="mt-3 block text-xs font-bold text-slate-500">CENTRO DE COSTO<input value={value.centro_costo} onChange={(e) => onChange({ ...value, centro_costo: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none" placeholder="Opcional" /></label><button disabled={disabled} className="mt-5 w-full rounded-xl bg-[#102b4a] py-3 text-sm font-bold text-white disabled:opacity-50">Registrar movimiento</button></form>; }
function NewClientModal({ form, setForm, onClose, onSubmit, saving }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"><form onSubmit={onSubmit} className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#229719]">Administración ANTĀi</p><h2 className="mt-1 text-xl font-black">Crear cliente y cuenta</h2></div><button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><p className="mt-2 text-sm text-slate-500">Se crea una cuenta prepago en CLP con saldo inicial $0.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{[['rut', 'RUT', 'text'], ['razon_social', 'Razón social', 'text'], ['email_contacto', 'Correo contacto', 'email'], ['telefono', 'Teléfono', 'tel']].map(([key, label, type]) => <label key={key} className={key === 'razon_social' ? 'sm:col-span-2' : ''}><span className="text-xs font-bold text-slate-500">{label}{key === 'rut' || key === 'razon_social' ? ' *' : ''}</span><input required={key === 'rut' || key === 'razon_social'} type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-[#35b425]" /></label>)}<label className="sm:col-span-2"><span className="text-xs font-bold text-slate-500">Tipo de cliente</span><select value={form.tipo_cliente} onChange={(e) => setForm({ ...form, tipo_cliente: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm"><option value="PROVEEDOR">Proveedor</option><option value="MANDANTE">Mandante / minera</option><option value="SERVICIO_RUTA">Servicio de ruta</option></select></label></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600">Cancelar</button><button disabled={saving} className="rounded-xl bg-[#35b425] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Creando…' : 'Crear cliente'}</button></div></form></div>; }
function EmptyState() { return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><Building2 className="mx-auto h-8 w-8 text-slate-300" /><h2 className="mt-4 font-black">Selecciona o crea un cliente</h2><p className="mt-2 text-sm text-slate-500">Aquí verás su cuenta prepago y los movimientos registrados.</p></div>; }
