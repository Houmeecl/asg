import Link from 'next/link';
import LegalShell from '../components/LegalShell';
import { BAAS_LEGAL } from '@/lib/baas/config';
import { legalMeta } from '@/lib/baas/legal-copy';

export const metadata = {
  title: 'Datos de la sociedad — sicr3p/',
  description: 'SICR3P SpA (operador) y Fundación Entretodos (entidad relacionada).',
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
      updated={`Estatuto SpA · CVE ${estatutoCve} · ${meta.updated}`}
    >
      <p className="legal-lead">
        <strong>sicr3p/</strong> lo opera comercialmente <strong>{razonSocial}</strong>. Existe además{' '}
        <strong>{fundacion.razonSocial}</strong>, persona jurídica distinta (fundación), con el mismo
        representante. No son la misma entidad: la SpA administra el servicio; la Fundación es la entidad
        de propósito social relacionada.
      </p>

      <div className="legal-banner warn" style={{ marginBottom: 28 }}>
        Según el estatuto vigente de la SpA, las acciones fueron suscritas por la persona natural del
        gerente. Si la Fundación será dueña de la SpA, eso requiere cesión/aporte de acciones e
        actualización en el Registro / SII — hoy los documentos públicos muestran dos RUTs separados.
      </div>

      <h2 className="legal-block-title">1. Operador comercial — {razonSocial}</h2>
      <p className="legal-lead" style={{ marginBottom: 16 }}>
        Titular de la plataforma sicr3p/ (comercio + software).
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
          <dt>Email / teléfono</dt>
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

      <h2 className="legal-block-title" style={{ marginTop: 40 }}>
        2. Entidad relacionada — {fundacion.razonSocial}
      </h2>
      <p className="legal-lead" style={{ marginBottom: 16 }}>
        Fundación (subtipo SII: {fundacion.subTipo}). No es el RUT merchant de sicr3p/; es la entidad
        de propósito social asociada, administrada por el mismo representante.
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
