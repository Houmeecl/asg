import { redirect } from 'next/navigation';
import { SiteHeader, SiteFooter } from '../SiteChrome';
import LoginForm from './LoginForm';
import { BASE } from '../data';
import { obtenerUsuarioSeguros } from '@/lib/segurosAuth';

export const metadata = { title: 'Ingresar — SICR3P Seguros' };

export default async function Ingresar({ searchParams }) {
  const { desde } = await searchParams;
  // Destinos permitidos explícitamente: nunca se redirige a una URL arbitraria.
  const destino = desde === 'onboarding' ? `${BASE}/onboarding` : `${BASE}/panel`;
  if (await obtenerUsuarioSeguros()) redirect(destino);

  return (
    <div className="min-h-screen bg-[#f4f7fa] text-[#0f1f2e] flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-md w-full mx-auto px-6 py-16">
        <LoginForm destino={destino} />
      </main>
      <SiteFooter />
    </div>
  );
}
