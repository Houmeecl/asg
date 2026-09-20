import { notFound, redirect } from 'next/navigation';
import { SiteHeader, SiteFooter } from '../SiteChrome';
import AdminNico from './AdminNico';
import { BASE } from '../data';
import { obtenerUsuarioSeguros, esAdmin, listarTodasPolizas } from '@/lib/segurosAuth';

export const metadata = { title: 'Administración — SICR3P Seguros' };

export default async function Page() {
  const usuario = await obtenerUsuarioSeguros();
  if (!usuario) redirect(`${BASE}/ingresar`);
  // 404 y no 403: no se revela que existe un panel de administración.
  if (!esAdmin(usuario)) notFound();

  const polizas = listarTodasPolizas();

  return (
    <div className="min-h-screen bg-[#f4f7fa] text-[#0f1f2e] flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12">
        <AdminNico usuario={usuario} polizas={polizas} />
      </main>
      <SiteFooter />
    </div>
  );
}
