import Link from 'next/link';
import LegalShell from '../components/LegalShell';
import { BAAS_LEGAL } from '@/lib/baas/config';
import { legalMeta } from '@/lib/baas/legal-copy';

export const metadata = {
  title: 'Datos de la sociedad — sicr3p/',
  description:
    'Fundación Entretodos (dueña) y SICR3P SpA (operadora administradora de sicr3p/).',
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
    fundacion,
  } = BAAS_LEGAL;

  return (
    <LegalShell
      eyebrow="Persona jurídica"
      title="Datos de la sociedad"
      updated={`Dueña: ${fundacion.razonSocial} · Operadora: ${razonSocial} · ${meta.updated}`}
    >
      <p className="legal-lead">
        La <strong>dueña</strong> de sicr3p/ es <strong>{fundacion.razonSocial}</strong> (RUT{' '}
        {fundacion.rut}). La plataforma la <strong>administra y opera</strong> comercialmente{' '}
        <strong>{razonSocial}</strong> (RUT {rut}), bajo la representación de {representanteLegal}.
      </p>

      <h2 className="legal-block-title">1. Dueña — {fundacion.razonSocial}</h2>
      <p className="legal-lead" style={{ marginBottom: 16 }}>
        Titular / dueña de propósito de sicr3p/. Persona jurídica tipo {fundacion.subTipo}.
      </p>
      <dl className="legal-dl">
        <div>
          <dt>Razón social</dt>
          <dd>{fundacion.razonSocial}</dd>
        </div>
        <div>
          <dt>RUT</dt>
          <dd>{fundacion.rut}</dd>
        </div>
        <div>
          <dt>Domicilio</dt>
          <dd>{fundacion.direccion}</dd>
        </div>
        <div>
          <dt>Capital</dt>
          <dd>{fundacion.capital}</dd>
        </div>
        <div>
          <dt>Representante (forma: cualquiera)</dt>
          <dd>
            {fundacion.representante}
            <br />
            <span style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
              RUT {fundacion.representanteRut} · incorporación {fundacion.incorporacionRepresentante}
            </span>
          </dd>
        </div>
        <div>
          <dt>Constitución / RUT</dt>
          <dd style={{ fontSize: 15, fontWeight: 500 }}>
            Escritura {fundacion.escritura}
            <br />
            RUT otorgado {fundacion.rutOtorgado} · folio {fundacion.folio}
          </dd>
        </div>
        <div>
          <dt>Certificado RUT</dt>
          <dd style={{ fontSize: 15, fontWeight: 500 }}>
            <a href={fundacion.pdfUrl} target="_blank" rel="noreferrer">
              Descargar PDF
            </a>
          </dd>
        </div>
      </dl>

      <h2 className="legal-block-title" style={{ marginTop: 40 }}>
        2. Operadora / administradora — {razonSocial}
      </h2>
      <p className="legal-lead" style={{ marginBottom: 16 }}>
        SpA que administra el servicio tecnológico sicr3p/ (portal, cobros y liquidaciones) por cuenta
        de la dueña.
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
          <dt>Email / teléfono (operación)</dt>
          <dd>
            <a href={`mailto:${email}`}>{email}</a>
            <br />
            <a href={`tel:${telefono.replace(/\s/g, '')}`}>{telefono}</a>
          </dd>
        </div>
        <div>
          <dt>Objeto (resumen)</dt>
          <dd style={{ fontSize: 15, fontWeight: 500 }}>
            Auxiliares de la intermediación financiera (excepto seguros), I+D, organizaciones
            empresariales, servicios informáticos y otras actividades de servicios.
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
