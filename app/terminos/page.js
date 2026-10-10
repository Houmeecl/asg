import LegalShell from '../components/LegalShell';
import { TERMINOS_SECTIONS, fillLegal, legalMeta } from '@/lib/baas/legal-copy';

export const metadata = {
  title: 'Términos y Condiciones — sicr3p/',
  description:
    'Términos de SICR3P: integración y desarrollo empresarial. No es banco, portal de crédito ni prestamista.',
};

export default function TerminosPage() {
  const meta = legalMeta();
  return (
    <LegalShell
      eyebrow="Legal"
      title="Términos y Condiciones"
      updated={`Última actualización: ${meta.updated} · ${meta.razonSocial} · RUT ${meta.rut}`}
    >
      <p className="legal-lead">
        SICR3P presta <strong>servicios de integración y desarrollo empresarial</strong> bajo la
        marca sicr3p/, operada por {meta.razonSocial}. No es un portal de crédito, banco ni
        prestamista. Dueña de la iniciativa: {meta.fundacionRazon}.
      </p>
      <article className="legal-prose">
        {TERMINOS_SECTIONS.map((s) => (
          <section key={s.id} id={s.id}>
            <h2>{s.title}</h2>
            <div dangerouslySetInnerHTML={{ __html: fillLegal(s.html, meta) }} />
          </section>
        ))}
      </article>
      <aside className="legal-note">
        Completar y publicar solo con los datos de la persona jurídica que contrata y factura.
        Este texto no sustituye asesoría legal ni el contrato firmado con cada cliente. La operación
        efectiva debe mantenerse coherente con el alcance descrito (Ley Fintec 21.521 / NCG 502
        cuando aplique). Estatuto SpA: CVE CRFgy53XBVxc.
      </aside>
    </LegalShell>
  );
}
