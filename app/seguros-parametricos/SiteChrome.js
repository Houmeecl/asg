import Link from 'next/link';
import Wordmark from './Wordmark';
import { BASE, SECTORES } from './data';
import { obtenerUsuarioSeguros } from '@/lib/segurosAuth';
import { ICONOS } from './iconos';
import { AVISO_SITIO } from './producto';

export async function SiteHeader() {
  const sesion = await obtenerUsuarioSeguros();

  return (
    <header className="sticky top-0 z-20 backdrop-blur bg-[#f4f7fa]/85 border-b border-[#0f1f2e]/10">
      {!process.env.OPINION_LEGAL_REF && (
        <p className="bg-[#0f1f2e] text-white/85 text-[11px] text-center px-4 py-1.5">{AVISO_SITIO}</p>
      )}
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link href={BASE} aria-label="SICR3P — inicio">
          <Wordmark />
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm">
          <div className="relative group">
            <Link href={`${BASE}#sectores`} className="hover:underline">Sectores</Link>
            <div className="absolute left-0 top-full pt-3 hidden group-hover:block group-focus-within:block">
              <div className="w-64 rounded-2xl bg-white border border-[#0f1f2e]/10 shadow-xl p-2">
                {SECTORES.map((s) => {
                  const I = ICONOS[s.icon];
                  return (
                    <Link key={s.slug} href={`${BASE}/sectores/${s.slug}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[#f4f7fa]">
                      <I size={16} /> {s.nombre}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          <Link href={`${BASE}#como-funciona`} className="hover:underline">Cómo funciona</Link>
          <Link href={`${BASE}#cotizar`} className="hover:underline">Cotizar</Link>
          <Link href={`${BASE}#faq`} className="hover:underline">Preguntas</Link>
        </nav>
        <div className="flex items-center gap-2 text-sm">
          {sesion ? (
            <>
            {sesion.rol === 'ADMIN' && <Link href={`${BASE}/admin`} className="hidden sm:block rounded-full border border-[#0f1f2e]/30 font-semibold px-5 py-2.5 hover:bg-white">Admin</Link>}
            <Link href={`${BASE}/panel`} className="rounded-full bg-[#0f1f2e] text-[#5ce08a] font-semibold px-5 py-2.5 hover:bg-[#1a3247]">Mi panel</Link>
            </>
          ) : (
            <>
              <Link href={`${BASE}/ingresar`} className="hidden sm:block rounded-full border border-[#0f1f2e]/30 font-semibold px-5 py-2.5 hover:bg-white">Ingresar</Link>
              <Link href={`${BASE}/onboarding`} className="rounded-full bg-[#0f1f2e] text-[#5ce08a] font-semibold px-5 py-2.5 hover:bg-[#1a3247]">Crear cuenta</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="max-w-6xl mx-auto px-6 py-10 text-sm text-[#0f1f2e]/60 flex flex-wrap justify-between gap-4">
      <span>© 2026 SICR3P. Producto ilustrativo; sujeto a suscripción del asegurador.</span>
      <span className="flex flex-wrap gap-5">
        {SECTORES.map((s) => (
          <Link key={s.slug} href={`${BASE}/sectores/${s.slug}`} className="hover:underline">{s.nombre}</Link>
        ))}
        <Link href={`${BASE}/ingresar`} className="hover:underline">Ingresar</Link>
      </span>
    </footer>
  );
}
