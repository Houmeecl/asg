import Link from 'next/link';
import LegalShell from '../components/LegalShell';
import { BAAS_LEGAL } from '@/lib/baas/config';
import { legalMeta } from '@/lib/baas/legal-copy';

export const metadata = {
  title: 'Datos de la sociedad — sicr3p/',
  description: 'Razón social, RUT y contacto para validación merchant (dLocal Go / TUU).',
};

export default function LegalPage() {
  const meta = legalMeta();
  const { razonSocial, rut, email, telefono, direccion } = BAAS_LEGAL;
  const pending = /confirmar|XXXX/i.test(`${razonSocial} ${rut}`);

  return (
    <LegalShell
      eyebrow="Persona jurídica"
      title="Datos de la sociedad"
      updated={`Visible para revisión merchant · ${meta.updated}`}
    >
      <p className="legal-lead">
        Información que debe coincidir con el registro en dLocal Go y con el comercio TUU. Los campos marcados
        como “dato a confirmar” no deben usarse para solicitar revisión live hasta completarlos.
      </p>

      {pending && (
        <div className="legal-banner warn">
          Hay placeholders pendientes (razón social / RUT). Completa variables{' '}
          <code>SICR3P_RAZON_SOCIAL</code>, <code>SICR3P_RUT</code>, <code>SICR3P_CONTACT_EMAIL</code> y{' '}
          <code>SICR3P_CONTACT_PHONE</code> antes de avisar a Bruna / dLocal Go.
        </div>
      )}

      <dl className="legal-dl">
        <div>
          <dt>Razón social</dt>
          <dd>{razonSocial}</dd>
        </div>
        <div>
          <dt>RUT</dt>
          <dd>{rut}</dd>
        </div>
        <div>
          <dt>Email de contacto</dt>
          <dd><a href={`mailto:${email}`}>{email}</a></dd>
        </div>
        <div>
          <dt>Teléfono</dt>
          <dd><a href={`tel:${telefono.replace(/\s/g, '')}`}>{telefono}</a></dd>
        </div>
        <div>
          <dt>Dirección / ciudad</dt>
          <dd>{direccion}</dd>
        </div>
        <div>
          <dt>Actividad declarada</dt>
          <dd>
            Comercio de servicios tecnológicos de pagos y liquidación operativa (software + mandato). Cobro
            presencial vía TUU; pay-in/payouts vía dLocal Go.
          </dd>
        </div>
      </dl>

      <p className="legal-lead" style={{ marginTop: 28 }}>
        Documentos relacionados:{' '}
        <Link href="/terminos">Términos</Link>
        {' · '}
        <Link href="/privacidad">Privacidad</Link>
        {' · '}
        <Link href="/contacto">Contacto</Link>
        {' · '}
        <Link href="/docs/legal/dlocal-go-checklist">Checklist dLocal Go</Link>
      </p>
    </LegalShell>
  );
}
