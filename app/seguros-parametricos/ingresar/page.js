import { SiteHeader, SiteFooter } from '../SiteChrome';
import LoginForm from './LoginForm';

export const metadata = { title: 'Ingresar — SICR3P Seguros' };

export default function Ingresar() {
  return (
    <div className="min-h-screen bg-[#f6f5ef] text-[#0b1a12] flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-md w-full mx-auto px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Ingresar</h1>
        <p className="mt-2 text-sm text-[#0b1a12]/65">Accede a tu panel de coberturas paramétricas.</p>
        <LoginForm />
      </main>
      <SiteFooter />
    </div>
  );
}
