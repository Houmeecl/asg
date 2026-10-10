import LegalShell from '../components/LegalShell';
import { PRIVACIDAD_SECTIONS, fillLegal, legalMeta } from '@/lib/baas/legal-copy';

export const metadata = {
  title: 'Privacidad — sicr3p/',
  description: 'Política de privacidad del servicio tecnológico sicr3p/.',
};

export default function PrivacidadPage() {
  const meta = legalMeta();
  return (
    <LegalShell
      eyebrow="Legal"
      title="Política de privacidad"
      updated={`Última actualización: ${meta.updated}`}
    >
      <p className="legal-lead">
        Tratamos solo los datos necesarios para operar el panel, responder contacto y ejecutar cobros/payouts
        a través de proveedores autorizados (TUU, dLocal Go).
      </p>
      <article className="legal-prose">
        {PRIVACIDAD_SECTIONS.map((s) => (
          <section key={s.id} id={s.id}>
            <h2>{s.title}</h2>
            <div dangerouslySetInnerHTML={{ __html: fillLegal(s.html, meta) }} />
          </section>
        ))}
      </article>
    </LegalShell>
  );
}
