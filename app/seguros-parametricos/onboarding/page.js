import { SiteHeader, SiteFooter } from '../SiteChrome';
import Onboarding from './Onboarding';

export const metadata = { title: 'Onboarding demo — SICR3P Seguros' };

export default function Page() {
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
