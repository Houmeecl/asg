import { redirect } from 'next/navigation';
import { SiteHeader, SiteFooter } from '../SiteChrome';
import PanelDemo from './PanelDemo';
import { BASE } from '../data';
import { obtenerUsuarioSeguros, listarPolizas } from '@/lib/segurosAuth';

export const metadata = { title: 'Mi panel — SICR3P Seguros' };

export default async function Page() {
  const usuario = await obtenerUsuarioSeguros();
  if (!usuario) redirect(`${BASE}/ingresar`);
  const polizas = listarPolizas(usuario.id);

  return (
    <div className="min-h-screen bg-[#f4f7fa] text-[#0f1f2e] flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
        <PanelDemo usuario={usuario} polizas={polizas} />
      </main>
      <SiteFooter />
    </div>
  );
}
