'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ArrowUpRight, BadgeCheck, Bell, ChevronRight, CircleDollarSign,
  ClipboardCheck, CreditCard, Fuel, LockKeyhole, MapPin, Menu, PackageCheck,
  QrCode, ReceiptText, ShieldCheck, Smartphone, Store, UsersRound,
  WalletCards, X, Zap,
} from 'lucide-react';

const movements = [
  { icon: Fuel, name: 'Estación Ruta 5 Norte', type: 'Combustible', amount: '- $ 84.500', time: 'Hoy · 08:42', color: 'bg-orange-100 text-orange-700' },
  { icon: Store, name: 'Casino Base Sierra', type: 'Alimentación', amount: '- $ 12.800', time: 'Ayer · 19:16', color: 'bg-sky-100 text-sky-700' },
  { icon: CircleDollarSign, name: 'Carga aprobada', type: 'Saldo prepago', amount: '+ $ 300.000', time: '02 sep · 16:04', color: 'bg-emerald-100 text-emerald-700' },
];

function NavItem({ id, children, view, onChoose }) {
  return <button onClick={() => onChoose(id)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${view === id ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{children}</button>;
}

export default function AntaiExperience() {
  const [view, setView] = useState('cuenta');
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [ticket, setTicket] = useState(null);

  function act(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3300);
  }

  const chooseView = (id) => { setView(id); setMenuOpen(false); };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f7f4] text-[#102b4a]">
      {notice && <div role="status" className="fixed right-5 top-5 z-50 flex items-center gap-2 rounded-2xl bg-[#102b4a] px-4 py-3 text-sm font-medium text-white shadow-2xl"><BadgeCheck className="h-4 w-4 text-[#35b425]" />{notice}</div>}

      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-[#f6f7f4]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-8">
          <a href="#inicio" aria-label="ANTĀi inicio" className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#102b4a] text-lg font-black tracking-tighter text-white">A<span className="text-[#35b425]">i</span></span><span className="text-xl font-black tracking-[-0.08em]">ANTĀ<span className="text-[#35b425]">i</span></span></a>
          <nav className="hidden items-center gap-1 md:flex"><NavItem id="cuenta" view={view} onChoose={chooseView}>Cuenta</NavItem><NavItem id="terreno" view={view} onChoose={chooseView}>POS terreno</NavItem><a href="#como-funciona" className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cómo funciona</a></nav>
          <div className="hidden items-center gap-3 md:flex"><a href="/antai/admin" className="rounded-full border border-[#102b4a] px-4 py-2 text-sm font-semibold hover:bg-slate-100">Administración</a><a href="/antai/reserva" className="rounded-full bg-[#35b425] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-green-700/20">Reservar cupo</a></div>
          <button aria-label="Abrir menú" onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg p-2 md:hidden">{menuOpen ? <X /> : <Menu />}</button>
        </div>
        {menuOpen && <nav className="border-t border-slate-200 bg-white px-5 py-3 md:hidden"><div className="grid gap-1"><NavItem id="cuenta" view={view} onChoose={chooseView}>Panel de cuenta</NavItem><NavItem id="terreno" view={view} onChoose={chooseView}>POS para terreno</NavItem><a className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600" href="#como-funciona">Cómo funciona</a><a className="rounded-xl px-4 py-2 text-sm font-bold text-[#102b4a]" href="/antai/admin">Administración</a><a className="rounded-xl px-4 py-2 text-sm font-bold text-[#229719]" href="/antai/reserva">Reservar cupo</a></div></nav>}
      </header>

      <section id="inicio" className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-16 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pb-24 lg:pt-24">
        <div className="relative z-10 flex flex-col items-start justify-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-green-800"><span className="h-2 w-2 rounded-full bg-[#35b425]" />Pagos que avanzan contigo</div>
          <h1 className="max-w-3xl text-5xl font-black leading-[.95] tracking-[-.065em] text-[#102b4a] md:text-7xl">La ruta minera,<br />ahora <span className="text-[#35b425]">prepago.</span></h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-slate-600">ANTĀi centraliza saldo, cobros y rendición de gastos para quienes mantienen la operación en movimiento. Desde la cuenta hasta el POS en terreno.</p>
          <div className="mt-8 flex flex-wrap gap-3"><button onClick={() => setView('cuenta')} className="group flex items-center gap-2 rounded-full bg-[#102b4a] px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-slate-900/15">Ver cuenta ANTĀi <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></button><a href="#como-funciona" className="rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 hover:border-[#35b425]">Conocer la solución</a></div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm font-semibold text-slate-500"><span className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#35b425]" />Control por operación</span><span className="flex items-center gap-2"><QrCode className="h-5 w-5 text-[#35b425]" />Cobro trazable</span><span className="flex items-center gap-2"><Zap className="h-5 w-5 text-[#35b425]" />Uso en terreno</span></div>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-[#c4f0bd] blur-3xl" /><div className="absolute -bottom-10 -left-8 h-44 w-44 rounded-full bg-sky-100 blur-3xl" />
          <div className="relative rounded-[2rem] border border-white/80 bg-white p-3 shadow-2xl shadow-[#102b4a]/10">
            <div className="rounded-[1.55rem] bg-[#102b4a] p-6 text-white">
              <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-300">Saldo disponible</p><p className="mt-2 text-4xl font-black tracking-tight">$ 482.700</p></div><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10"><WalletCards className="h-6 w-6 text-[#73db65]" /></div></div>
              <div className="mt-7 flex justify-between border-t border-white/15 pt-4 text-xs text-slate-300"><span>Cuenta Operación Norte</span><span>•••• 2719</span></div>
            </div>
            <div className="p-3 pt-5"><div className="mb-4 flex items-center justify-between"><div><p className="font-bold">Movimiento reciente</p><p className="text-xs text-slate-500">Controla cada gasto de ruta</p></div><button onClick={() => setView('cuenta')} className="text-xs font-bold text-[#229719]">Ver cuenta</button></div>{movements.slice(0, 2).map(({ icon: Icon, name, type, amount, color }) => <div key={name} className="mb-3 flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{name}</p><p className="text-xs text-slate-500">{type}</p></div><span className="text-sm font-bold text-slate-700">{amount}</span></div>)}</div>
          </div>
          <div className="absolute -right-7 top-9 hidden h-28 w-40 overflow-hidden rounded-2xl bg-white shadow-xl sm:block"><Image src="/antai-logo.jpeg" alt="Logo ANTĀi" fill sizes="160px" className="object-cover object-[center_61%]" /></div>
          <div className="absolute -bottom-7 -left-5 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-[#229719]"><PackageCheck className="h-5 w-5" /></span><div><p className="text-xs font-bold">Pago autorizado</p><p className="text-[11px] text-slate-500">Ruta y centro de costo</p></div></div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-7"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 text-sm font-bold text-slate-500 lg:px-8"><span>Diseñado para la operación que no se detiene.</span><div className="flex items-center gap-6 text-xs uppercase tracking-[.13em]"><span>Rutas</span><span>Servicios</span><span>Faena</span><span>Proveedores</span></div></div></section>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8" id="producto">
        <div className="mb-9 max-w-2xl"><p className="text-sm font-bold uppercase tracking-[.16em] text-[#229719]">Una sola operación</p><h2 className="mt-3 text-4xl font-black tracking-[-.05em] md:text-5xl">Cuenta para administrar. POS para cobrar.</h2><p className="mt-4 text-slate-600">La misma lógica prepago acompaña al administrador y al equipo que opera donde ocurre el servicio.</p></div>
        <div className="mb-6 inline-flex rounded-full border border-slate-200 bg-white p-1"><button onClick={() => setView('cuenta')} className={`rounded-full px-4 py-2 text-sm font-bold ${view === 'cuenta' ? 'bg-[#102b4a] text-white' : 'text-slate-500'}`}>Panel de cuenta</button><button onClick={() => setView('terreno')} className={`rounded-full px-4 py-2 text-sm font-bold ${view === 'terreno' ? 'bg-[#102b4a] text-white' : 'text-slate-500'}`}>POS terreno</button></div>
        {view === 'cuenta' ? <AccountPanel action={act} /> : <PosPanel ticket={ticket} setTicket={setTicket} action={act} />}
      </section>

      <section id="como-funciona" className="bg-[#102b4a] py-20 text-white"><div className="mx-auto max-w-7xl px-5 lg:px-8"><p className="text-sm font-bold uppercase tracking-[.16em] text-[#73db65]">Simple de usar. Claro de revisar.</p><h2 className="mt-3 max-w-2xl text-4xl font-black tracking-[-.05em] md:text-5xl">El flujo de un pago en ruta, sin caja negra.</h2><div className="mt-12 grid gap-5 md:grid-cols-3">{[["01", "Define el saldo", "La empresa asigna fondos prepago a la cuenta, operación o equipo."], ["02", "Paga o cobra en terreno", "El POS registra el servicio, centro de costo y comprobante digital."], ["03", "Revisa y rinde", "Cada movimiento vuelve al panel para control y conciliación."]].map(([n, title, desc]) => <article key={n} className="rounded-3xl border border-white/15 bg-white/5 p-6"><span className="text-3xl font-black text-[#73db65]">{n}</span><h3 className="mt-12 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-relaxed text-slate-300">{desc}</p></article>)}</div></div></section>

      <section id="demo" className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="rounded-[2rem] bg-[#d9f6d5] px-7 py-10 md:flex md:items-center md:justify-between md:px-12"><div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[.15em] text-[#218e18]">ANTĀi para tu operación</p><h2 className="mt-3 text-4xl font-black tracking-[-.05em] text-[#102b4a]">Haz que cada peso llegue más lejos en la ruta.</h2><p className="mt-4 text-slate-600">Conversemos sobre una implementación prepago ajustada a tus servicios, puntos de cobro y equipos en terreno.</p></div><button onClick={() => act('Gracias. Prepararemos una demostración de ANTĀi para tu operación.')} className="mt-6 shrink-0 rounded-full bg-[#102b4a] px-6 py-3.5 text-sm font-bold text-white md:mt-0">Solicitar demostración</button></div></section>

      <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs text-slate-500 md:flex-row md:items-center md:justify-between lg:px-8"><div className="flex items-center gap-2 font-black text-[#102b4a]"><span className="text-lg tracking-[-.08em]">ANTĀ<span className="text-[#35b425]">i</span></span><span className="font-normal">innovación · futuro · impacto</span></div><p>© 2026 ANTĀi. Diseño conceptual de producto.</p></div></footer>
    </main>
  );
}

function AccountPanel({ action }) {
  return <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="flex items-start justify-between"><div><p className="text-sm font-bold text-slate-500">Cuenta Operación Norte</p><h3 className="mt-1 text-3xl font-black tracking-tight">$ 482.700</h3><p className="mt-1 text-xs text-[#229719]">Saldo prepago disponible</p></div><button onClick={() => action('Solicitud de carga registrada para revisión.')} className="rounded-full bg-[#35b425] px-4 py-2 text-sm font-bold text-white">Cargar saldo</button></div><div className="mt-7 grid grid-cols-3 gap-3 border-y border-slate-100 py-5 text-sm"><div><p className="text-xs text-slate-500">Asignado</p><p className="mt-1 font-black">$ 600.000</p></div><div><p className="text-xs text-slate-500">Usado</p><p className="mt-1 font-black">$ 117.300</p></div><div><p className="text-xs text-slate-500">Operaciones</p><p className="mt-1 font-black">18</p></div></div><div className="mt-5 flex gap-2"><button onClick={() => action('Tarjeta virtual preparada para la demostración.')} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-bold hover:bg-slate-50"><CreditCard className="h-4 w-4 text-[#229719]" />Tarjeta</button><button onClick={() => action('Reporte mensual preparado para descarga.')} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-bold hover:bg-slate-50"><ReceiptText className="h-4 w-4 text-[#229719]" />Reporte</button></div></section><section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-black">Movimientos</h3><p className="text-xs text-slate-500">Últimos cargos y cargas</p></div><Bell className="h-5 w-5 text-slate-400" /></div><div className="space-y-4">{movements.map(({ icon: Icon, name, type, amount, time, color }) => <div key={name} className="flex items-center gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{name}</p><p className="text-xs text-slate-500">{type} · {time}</p></div><span className="text-sm font-bold">{amount}</span></div>)}</div></section></div>;
}

function PosPanel({ ticket, setTicket, action }) {
  const [amount, setAmount] = useState('84.500');
  function charge() { const clean = amount.replace(/[^0-9]/g, ''); if (!clean) return action('Ingresa un monto para continuar.'); setTicket({ id: 'AT-' + Math.floor(100000 + Math.random() * 899999), amount: Number(clean).toLocaleString('es-CL') }); action('Cobro prepago registrado en la demostración.'); }
  return <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><aside className="rounded-[2rem] bg-[#102b4a] p-7 text-white"><Smartphone className="h-7 w-7 text-[#73db65]" /><h3 className="mt-8 text-2xl font-black">POS ANTĀi</h3><p className="mt-3 text-sm leading-relaxed text-slate-300">Una web app pensada para señal intermitente, operación rápida y comprobante trazable.</p><div className="mt-8 space-y-4">{[[MapPin, 'Punto de venta', 'Base Sierra · Ruta 5 Norte'], [UsersRound, 'Operador', 'María González · Turno A'], [LockKeyhole, 'Control', 'Centro de costo obligatorio']].map(([Icon, label, text]) => <div key={label} className="flex gap-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#73db65]" /><p className="text-xs"><span className="block font-bold text-white">{label}</span><span className="text-slate-300">{text}</span></p></div>)}</div></aside><section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.13em] text-[#229719]">Nuevo cobro</p><h3 className="mt-1 text-xl font-black">Registrar servicio</h3></div><QrCode className="h-8 w-8 text-slate-300" /></div><label className="mt-6 block text-xs font-bold text-slate-500">MONTO A COBRAR</label><div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4"><span className="text-2xl font-black text-slate-400">$</span><input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" className="w-full bg-transparent py-4 pl-3 text-3xl font-black outline-none" aria-label="Monto a cobrar" /></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="rounded-xl border border-slate-200 p-3 text-xs text-slate-500">Servicio<select className="mt-1 w-full bg-transparent text-sm font-bold text-slate-800 outline-none"><option>Combustible diésel</option><option>Alimentación</option><option>Peaje y ruta</option></select></label><label className="rounded-xl border border-slate-200 p-3 text-xs text-slate-500">Centro de costo<select className="mt-1 w-full bg-transparent text-sm font-bold text-slate-800 outline-none"><option>OP-NORTE-01</option><option>FAENA-SIERRA</option></select></label></div><button onClick={charge} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#35b425] py-4 text-sm font-black text-white shadow-lg shadow-green-700/15">Cobrar saldo prepago <ChevronRight className="h-4 w-4" /></button>{ticket && <div className="mt-5 flex items-center gap-3 rounded-xl bg-green-50 p-3 text-sm text-green-900"><ClipboardCheck className="h-5 w-5 text-[#229719]" /><span><b>Comprobante {ticket.id}</b><br />Cobro por $ {ticket.amount} registrado.</span></div>}</section></div>;
}
