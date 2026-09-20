import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, MapPin } from 'lucide-react';
import { SiteHeader, SiteFooter } from '../../SiteChrome';
import { ICONOS } from '../../iconos';
import Cotizador from '../../Cotizador';
import TileGrid from '../../TileGrid';
import { MotionRoot, Reveal, Stagger, Item, Lift, Parallax } from '../../Motion';
import { ATRIBUCION } from '../../satelite';
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
    <MotionRoot>
    <div className="min-h-screen bg-[#f4f7fa] text-[#0f1f2e]">
      <SiteHeader />

      <section className="bg-[#0f1f2e] text-white relative overflow-hidden">
        <Parallax>
          <TileGrid lat={sector.lugar.lat} lon={sector.lugar.lon} z={sector.lugar.z} cols={6} rows={4} escala={1.1} prioridad atribuir={false} />
        </Parallax>
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#0f1f2e] via-[#0f1f2e]/75 to-[#0f1f2e]/10" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0f1f2e] to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6 py-24">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              <Icono size={14} className="text-[#5ce08a]" /> Zona norte de Chile
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-6 text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] max-w-3xl">
              Seguro paramétrico para <span className="text-[#5ce08a]">{sector.nombre.toLowerCase()}.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}><p className="mt-6 text-lg text-white/75 max-w-2xl">{sector.resumen}</p></Reveal>
          <Reveal delay={0.22} className="mt-6 flex flex-wrap gap-2">
            {sector.zonas.map((z) => (
              <span key={z} className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/5 backdrop-blur px-3 py-1 text-xs"><MapPin size={12} /> {z}</span>
            ))}
          </Reveal>
          <Reveal delay={0.3} className="mt-8 flex flex-wrap gap-3">
            <a href="#cotizar" className="rounded-full bg-[#5ce08a] text-[#0f1f2e] font-semibold px-6 py-3.5 flex items-center gap-2 hover:bg-white transition-colors">Cotizar para mi operación <ArrowRight size={16} /></a>
            <Link href={`${BASE}/onboarding`} className="rounded-full border border-white/40 font-semibold px-6 py-3.5 hover:bg-white/10 transition-colors">Probar el onboarding</Link>
          </Reveal>
          <p className="mt-10 text-[10px] text-white/50">Imagen satelital de referencia: {sector.lugar.nombre}. {ATRIBUCION}</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">Lo que le pasa a tu operación cuando el clima golpea.</h2>
        <Stagger className="mt-10 grid md:grid-cols-3 gap-5">
          {sector.dolores.map(([t, d], i) => (
            <Item key={t}>
              <Lift className="h-full rounded-2xl bg-white border border-[#0f1f2e]/10 p-6">
                <span className="text-xs font-mono text-[#0f1f2e]/35">0{i + 1}</span>
                <h3 className="mt-4 font-semibold text-lg">{t}</h3>
                <p className="mt-2 text-sm text-[#0f1f2e]/65 leading-relaxed">{d}</p>
              </Lift>
            </Item>
          ))}
        </Stagger>
      </section>

      <section className="bg-white border-y border-[#0f1f2e]/10">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Riesgos que puedes cubrir.</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {sector.riesgos.map((k) => {
              const r = RIESGOS[k];
              return (
                <div key={k} className="rounded-2xl border border-[#0f1f2e]/10 p-6 flex flex-col gap-4">
                  <h3 className="font-semibold text-lg">{r.nombre}</h3>
                  <p className="text-sm text-[#0f1f2e]/65 leading-relaxed">{sector.riesgoDetalle[k]}</p>
                  <dl className="mt-auto grid grid-cols-2 gap-3 text-sm border-t border-[#0f1f2e]/10 pt-4">
                    <div><dt className="text-xs uppercase tracking-wider text-[#0f1f2e]/50 font-semibold">Activa</dt><dd className="mt-0.5">{r.dir === 'menor' ? 'bajo' : 'sobre'} {r.umbral} {r.unidad}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wider text-[#0f1f2e]/50 font-semibold">Pago total</dt><dd className="mt-0.5">{r.salida} {r.unidad}</dd></div>
                  </dl>
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-xs text-[#0f1f2e]/50">Umbrales de ejemplo. Se calibran con el historial de la estación de referencia de tu ubicación.</p>
        </div>
      </section>

      <section id="cotizar" className="max-w-6xl mx-auto px-6 py-20 scroll-mt-16">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">Cotiza para {sector.nombre.toLowerCase()}.</h2>
        <p className="mt-4 mb-10 text-[#0f1f2e]/65 max-w-2xl">Ya cargamos los riesgos y regiones típicos de este sector. Ajusta a tu operación.</p>
        <Cotizador riesgoInicial={sector.riesgoDefault} zonaInicial={sector.zonaDefault} riesgos={sector.riesgos} zonas={sector.zonas} />
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-xl font-semibold">Otros sectores del norte</h2>
        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {otros.map((s) => {
            const I = ICONOS[s.icon];
            return (
              <Link key={s.slug} href={`${BASE}/sectores/${s.slug}`} className="rounded-2xl border border-[#0f1f2e]/10 bg-white p-5 hover:border-[#0f1f2e] transition-colors">
                <I size={20} />
                <p className="mt-4 font-semibold">{s.nombre}</p>
                <p className="text-xs text-[#0f1f2e]/60 mt-1">{s.corto}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <SiteFooter />
    </div>
    </MotionRoot>
  );
}
