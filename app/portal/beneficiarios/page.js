'use client';

import { useEffect, useState } from 'react';
import BaasShell from '../../components/BaasShell';
import { CHILE_BANK_CODES, DLOCAL_PAYOUT_COUNTRIES } from '@/lib/baas/config';

const NAV = [
  { href: '/portal', label: 'Inicio' },
  { href: '/portal/solicitud', label: 'Nueva solicitud' },
  { href: '/portal/beneficiarios', label: 'Beneficiarios' },
  { href: '/portal/tarjetas', label: 'Cuenta / tarjeta' },
];

export default function BeneficiariosPage() {
  const [user, setUser] = useState(null);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    nombre: '',
    documento: '',
    pais: 'CL',
    bankCode: '1',
    bankAccount: '',
    bankAccountType: 'CHECKING',
  });
  const [msg, setMsg] = useState(null);

  function load() {
    fetch('/api/baas/dashboard').then((r) => r.json()).then((d) => setUser(d.usuario));
    fetch('/api/baas/beneficiarios').then((r) => r.json()).then((d) => setRows(d.beneficiarios || []));
  }

  useEffect(() => { load(); }, []);

  async function crear(e) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch('/api/baas/beneficiarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg({ ok: false, text: data.error });
      return;
    }
    setMsg({ ok: true, text: 'Beneficiario creado' });
    setForm({ ...form, nombre: '', documento: '', bankAccount: '' });
    load();
  }

  return (
    <BaasShell title="Beneficiarios" subtitle="Cuentas destino para payouts dLocal Go (RUT + bank_code en Chile)." nav={NAV} user={user}>
      <div className="baas-grid-2">
        <div className="baas-panel">
          <h2>Listado</h2>
          {!rows.length ? <p className="sub">Sin beneficiarios aún.</p> : (
            <table className="baas-tbl">
              <thead>
                <tr><th>Nombre</th><th>Documento</th><th>País</th><th>Banco</th><th>Cuenta</th></tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id}>
                    <td>{b.nombre}</td>
                    <td className="mono">{b.documento}</td>
                    <td>{b.pais}</td>
                    <td>{b.bank_code || '—'}</td>
                    <td className="mono">{b.bank_account || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <form className="baas-panel baas-form" onSubmit={crear}>
          <h2>Alta</h2>
          <div className="baas-field">
            <label>Nombre</label>
            <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div className="baas-field">
            <label>Documento (RUT en CL)</label>
            <input required value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} />
          </div>
          <div className="baas-field">
            <label>País</label>
            <select value={form.pais} onChange={(e) => setForm({ ...form, pais: e.target.value })}>
              {DLOCAL_PAYOUT_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
          {form.pais === 'CL' && (
            <>
              <div className="baas-field">
                <label>Banco (código dLocal)</label>
                <select value={form.bankCode} onChange={(e) => setForm({ ...form, bankCode: e.target.value })}>
                  {CHILE_BANK_CODES.map((b) => (
                    <option key={b.code} value={b.code}>{b.code} — {b.name}</option>
                  ))}
                </select>
              </div>
              <div className="baas-field">
                <label>Tipo de cuenta</label>
                <select value={form.bankAccountType} onChange={(e) => setForm({ ...form, bankAccountType: e.target.value })}>
                  <option value="CHECKING">CHECKING</option>
                  <option value="SAVINGS">SAVINGS</option>
                  <option value="VISTA">VISTA</option>
                </select>
              </div>
            </>
          )}
          <div className="baas-field">
            <label>Número de cuenta</label>
            <input value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} />
          </div>
          {msg && <div className={`baas-alert ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</div>}
          <button className="baas-btn" type="submit">Guardar</button>
        </form>
      </div>
    </BaasShell>
  );
}
