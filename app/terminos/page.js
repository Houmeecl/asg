import LegalShell from '../components/LegalShell';
import { TERMINOS_SECTIONS, fillLegal, legalMeta } from '@/lib/baas/legal-copy';

export const metadata = {
  title: 'Términos y condiciones — sicr3p/',
  description:
    'Términos del servicio tecnológico sicr3p/ operado por SICR3P SpA. Software y mandato, no banco.',
};

export default function TerminosPage() {
  const meta = legalMeta();
  return (
    <LegalShell
      eyebrow="Legal"
      title="Términos y condiciones"
      updated={`Última actualización: ${meta.updated} · ${meta.razonSocial} · RUT ${meta.rut}`}
    >
      <p className="legal-lead">
        Condiciones del servicio <strong>sicr3p/</strong>: portal, cobro, lotes e instrucción de liquidación.
        Operado exclusivamente por {meta.razonSocial}. No es una plantilla genérica de ecommerce de productos físicos.
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
        Este texto orienta la operación comercial de sicr3p/. No sustituye asesoría legal ni el contrato
        firmado con cada cliente. Estatuto societario: CVE CRFgy53XBVxc (Registro de Empresas y Sociedades).
      </aside>
    </LegalShell>
  );
}
