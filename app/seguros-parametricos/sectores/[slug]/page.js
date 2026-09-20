import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, MapPin } from 'lucide-react';
import { SiteHeader, SiteFooter } from '../../SiteChrome';
import { ICONOS } from '../../iconos';
import Cotizador from '../../Cotizador';
import { BASE, RIESGOS, SECTORES, sectorPorSlug } from '../../data';

export function generateStaticParams() {
  return SECTORES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const s = sectorPorSlug(slug);
  if (!s) return {};
  return {
    title: `${s.nombre} — Seguros paramétricos en el norte de Chile | SICR3P`,
    description: s.resumen,
  };
}

export default async function SectorPage({ params }) {
  const { slug } = await params;
  const sector = sectorPorSlug(slug);
  if (!sector) notFound();

  const Icono = ICONOS[sector.icon];
  const otros = SECTORES.filter((s) => s.slug !== sector.slug);

  return (
    <div className="min-h-screen bg-[#f6f5ef] text-[#0b1a12]">
      <SiteHeader />

      <section className="bg-[#0b1a12] text-white relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:56px_56px]" />
        <div aria-hidden className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full bg-[#d7ff3f]/15 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#d7ff3f] text-[#0b1a12] px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            <Icono size={14} /> Zona norte de Chile
          </span>
          <h1 className="mt-6 text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] max-w-3xl">
            Seguro paramétrico para <span className="text-[#d7ff3f]">{sector.nombre.toLowerCase()}.</span>
          </h1>
          <p className="mt-6 text-lg text-white/70 max-w-2xl">{sector.resumen}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {sector.zonas.map((z) => (
              <span key={z} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 text-xs"><MapPin size={12} /> {z}</span>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#cotizar" className="rounded-full bg-[#d7ff3f] text-[#0b1a12] font-semibold px-6 py-3.5 flex items-center gap-2 hover:bg-white">Cotizar para mi operación <ArrowRight size={16} /></a>
            <Link href={`${BASE}/onboarding`} className="rounded-full border border-white/40 font-semibold px-6 py-3.5 hover:bg-white/10">Probar el onboarding demo</Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">Lo que le pasa a tu operación cuando el clima golpea.</h2>
        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {sector.dolores.map(([t, d], i) => (
            <div key={t} className="rounded-2xl bg-white border border-[#0b1a12]/10 p-6">
              <span className="text-xs font-mono text-[#0b1a12]/35">0{i + 1}</span>
              <h3 className="mt-4 font-semibold text-lg">{t}</h3>
              <p className="mt-2 text-sm text-[#0b1a12]/65 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border-y border-[#0b1a12]/10">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Riesgos que puedes cubrir.</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {sector.riesgos.map((k) => {
              const r = RIESGOS[k];
              return (
                <div key={k} className="rounded-2xl border border-[#0b1a12]/10 p-6 flex flex-col gap-4">
                  <h3 className="font-semibold text-lg">{r.nombre}</h3>
                  <p className="text-sm text-[#0b1a12]/65 leading-relaxed">{sector.riesgoDetalle[k]}</p>
                  <dl className="mt-auto grid grid-cols-2 gap-3 text-sm border-t border-[#0b1a12]/10 pt-4">
                    <div><dt className="text-xs uppercase tracking-wider text-[#0b1a12]/50 font-semibold">Activa</dt><dd className="mt-0.5">{r.dir === 'menor' ? 'bajo' : 'sobre'} {r.umbral} {r.unidad}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wider text-[#0b1a12]/50 font-semibold">Pago total</dt><dd className="mt-0.5">{r.salida} {r.unidad}</dd></div>
                  </dl>
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-xs text-[#0b1a12]/50">Umbrales de ejemplo. Se calibran con el historial de la estación de referencia de tu ubicación.</p>
        </div>
      </section>

      <section id="cotizar" className="max-w-6xl mx-auto px-6 py-20 scroll-mt-16">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">Cotiza para {sector.nombre.toLowerCase()}.</h2>
        <p className="mt-4 mb-10 text-[#0b1a12]/65 max-w-2xl">Ya cargamos los riesgos y regiones típicos de este sector. Ajusta a tu operación.</p>
        <Cotizador riesgoInicial={sector.riesgoDefault} zonaInicial={sector.zonaDefault} riesgos={sector.riesgos} zonas={sector.zonas} />
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-xl font-semibold">Otros sectores del norte</h2>
        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {otros.map((s) => {
            const I = ICONOS[s.icon];
            return (
              <Link key={s.slug} href={`${BASE}/sectores/${s.slug}`} className="rounded-2xl border border-[#0b1a12]/10 bg-white p-5 hover:border-[#0b1a12] transition-colors">
                <I size={20} />
                <p className="mt-4 font-semibold">{s.nombre}</p>
                <p className="text-xs text-[#0b1a12]/60 mt-1">{s.corto}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
