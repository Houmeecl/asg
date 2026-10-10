'use client';

import { useEffect, useState } from 'react';
import BaasShell, { StatusPill } from '../../components/BaasShell';

const NAV = [
  { href: '/portal', label: 'Inicio' },
  { href: '/portal/solicitud', label: 'Nueva solicitud' },
  { href: '/portal/beneficiarios', label: 'Beneficiarios' },
  { href: '/portal/tarjetas', label: 'Cuenta / tarjeta' },
];

export default function TarjetasPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/baas/dashboard').then((r) => r.json()).then(setData);
  }, []);

  const wallets = data?.wallets || [];

  return (
    <BaasShell
      title="Cuenta y tarjeta"
      subtitle="Wallet virtual operativa (identificador). Prepago físico solo con emisor regulado."
      nav={NAV}
      user={data?.usuario}
    >
      <div className="baas-panel">
        <div className="baas-alert info" style={{ marginBottom: 16 }}>
          Estado prepago: <strong>En evaluación con emisor regulado</strong>. No hay emisión propia de medio de pago con provisión de fondos a nombre sicr3p/.
        </div>
        <h2>Wallets virtuales</h2>
        {!wallets.length ? (
          <p className="sub">Se crean al completar KYC desde el QR del POS (RUT no registrado).</p>
        ) : (
          <table className="baas-tbl">
            <thead>
              <tr>
                <th>Persona</th>
                <th>RUT</th>
                <th>Wallet</th>
                <th>Tarjeta virtual</th>
                <th>Estado</th>
                <th>KYC</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((w) => (
                <tr key={w.id}>
                  <td>{w.nombre}</td>
                  <td className="mono">{w.rut}</td>
                  <td className="mono">{w.wallet_id}</td>
                  <td className="mono">{w.tarjeta_virtual_id}</td>
                  <td><StatusPill estado={w.estado} /></td>
                  <td><StatusPill estado={w.kyc_estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </BaasShell>
  );
}
