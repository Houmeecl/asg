import { redirect } from 'next/navigation';
import { SiteHeader, SiteFooter } from '../SiteChrome';
import Onboarding from './Onboarding';
import { BASE } from '../data';
import { obtenerUsuarioSeguros } from '@/lib/segurosAuth';

export const metadata = { title: 'Onboarding demo — SICR3P Seguros' };

export default async function Page() {
  if (!(await obtenerUsuarioSeguros())) redirect(`${BASE}/ingresar?desde=onboarding`);

  return (
    <div className="min-h-screen bg-[#f6f5ef] text-[#0b1a12] flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-14">
        <Onboarding />
      </main>
      <SiteFooter />
    </div>
  );
}
