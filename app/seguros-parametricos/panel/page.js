import { SiteHeader, SiteFooter } from '../SiteChrome';
import PanelDemo from './PanelDemo';

export const metadata = { title: 'Mi panel — SICR3P Seguros' };

export default function Page() {
  return (
    <div className="min-h-screen bg-[#f6f5ef] text-[#0b1a12] flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
        <PanelDemo />
      </main>
      <SiteFooter />
    </div>
  );
}
