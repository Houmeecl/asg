import Link from 'next/link';
import LegalShell from '../components/LegalShell';
import { BAAS_LEGAL } from '@/lib/baas/config';
import { legalMeta } from '@/lib/baas/legal-copy';

export const metadata = {
  title: 'Datos de la sociedad — sicr3p/',
  description: 'Razón social, RUT y datos societarios de SICR3P SpA.',
};

export default function LegalPage() {
  const meta = legalMeta();
  const {
    razonSocial,
    nombreFantasia,
    rut,
    email,
    telefono,
    direccion,
    fechaConstitucion,
    capitalSocial,
    representanteLegal,
    representanteRut,
    estatutoCve,
    estatutoUrl,
  } = BAAS_LEGAL;

  return (
    <LegalShell
      eyebrow="Persona jurídica"
      title="Datos de la sociedad"
      updated={`Estatuto actualizado · CVE ${estatutoCve} · ${meta.updated}`}
    >
      <p className="legal-lead">
        Identificación de {razonSocial}, titular de la plataforma sicr3p/, conforme al Certificado de
        Estatuto Actualizado del Registro de Empresas y Sociedades.
      </p>

      <dl className="legal-dl">
        <div>
          <dt>Razón social</dt>
          <dd>{razonSocial}</dd>
        </div>
        <div>
          <dt>Nombre de fantasía</dt>
          <dd>{nombreFantasia}</dd>
        </div>
        <div>
          <dt>RUT</dt>
          <dd>{rut}</dd>
        </div>
        <div>
          <dt>Domicilio</dt>
          <dd>{direccion}</dd>
        </div>
        <div>
          <dt>Fecha de constitución</dt>
          <dd>{fechaConstitucion}</dd>
        </div>
        <div>
          <dt>Capital social</dt>
          <dd>{capitalSocial}</dd>
        </div>
        <div>
          <dt>Gerente general / representante SII</dt>
          <dd>
            {representanteLegal}
            <br />
            <span style={{ fontSize: 14, color: 'var(--ink-soft)' }}>RUT {representanteRut}</span>
          </dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd><a href={`mailto:${email}`}>{email}</a></dd>
        </div>
        <div>
          <dt>Teléfono</dt>
          <dd><a href={`tel:${telefono.replace(/\s/g, '')}`}>{telefono}</a></dd>
        </div>
        <div>
          <dt>Objeto (resumen estatutario)</dt>
          <dd style={{ fontSize: 15, fontWeight: 500 }}>
            Auxiliares de la intermediación financiera (excepto seguros), investigación y desarrollo,
            organizaciones empresariales, servicios informáticos y otras actividades de servicios.
          </dd>
        </div>
        <div>
          <dt>Estatuto</dt>
          <dd style={{ fontSize: 15, fontWeight: 500 }}>
            CVE {estatutoCve} ·{' '}
            <a href={estatutoUrl} target="_blank" rel="noreferrer">
              Descargar PDF
            </a>
          </dd>
        </div>
      </dl>

      <p className="legal-lead" style={{ marginTop: 28 }}>
        <Link href="/terminos">Términos</Link>
        {' · '}
        <Link href="/privacidad">Privacidad</Link>
        {' · '}
        <Link href="/contacto">Contacto</Link>
      </p>
    </LegalShell>
  );
}
