import LegalShell from '../components/LegalShell';
import { TERMINOS_SECTIONS, fillLegal, legalMeta } from '@/lib/baas/legal-copy';

export const metadata = {
  title: 'Términos y condiciones — sicr3p/',
  description:
    'Términos del servicio tecnológico sicr3p/: cobros TUU, lotes y payouts dLocal Go. Software y mandato, no banco.',
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
        Estos términos describen el servicio real de la plataforma: portal → código/POS TUU → fondeo →
        instrucción de payout vía dLocal Go. No son una plantilla genérica de ecommerce de productos físicos.
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
        Este texto orienta la operación comercial y la revisión de sitio (p. ej. dLocal Go). No sustituye asesoría
        legal ni el contrato firmado con cada cliente. Validar RUT/razón social oficiales antes de solicitar
        activación live.
      </aside>
    </LegalShell>
  );
}
