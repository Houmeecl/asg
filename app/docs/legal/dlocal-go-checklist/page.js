import Link from 'next/link';
import LegalShell from '../../../components/LegalShell';
import { BAAS_LEGAL } from '@/lib/baas/config';

export const metadata = {
  title: 'Checklist sitio dLocal Go — sicr3p/',
  description: 'Requisitos de sitio web para activación / revisión dLocal Go.',
};

const ITEMS = [
  {
    ok: true,
    label: 'Landing que representa la operación real',
    detail: 'Qué es sicr3p/, cómo se contrata, flujo portal → TUU → dLocal Go.',
    href: '/',
  },
  {
    ok: true,
    label: 'Términos y condiciones propios (servicios)',
    detail: 'No política de envíos de productos físicos; describe POS, lotes y payouts.',
    href: '/terminos',
  },
  {
    ok: true,
    label: 'Privacidad',
    detail: 'Tratamiento de datos del formulario y del panel.',
    href: '/privacidad',
  },
  {
    ok: true,
    label: 'Formulario de contacto activo',
    detail: 'Nombre, email, mensaje con confirmación de envío (API + persistencia).',
    href: '/contacto',
  },
  {
    ok: true,
    label: 'Datos de contacto visibles',
    detail: `${BAAS_LEGAL.email} · ${BAAS_LEGAL.telefono} en header/footer.`,
    href: '/legal',
  },
  {
    ok: !/XXXX|confirmar/i.test(`${BAAS_LEGAL.razonSocial}${BAAS_LEGAL.rut}`),
    label: 'Razón social + RUT coincidentes con cuenta dLocal Go',
    detail: `${BAAS_LEGAL.razonSocial} · ${BAAS_LEGAL.rut}`,
    href: '/legal',
  },
  {
    ok: !BAAS_LEGAL.social.linkedin && !BAAS_LEGAL.social.instagram,
    label: 'Redes solo si son reales (omitidas si vacías)',
    detail: 'Sin iconos placeholder muertos en footer.',
    href: '/',
  },
  {
    ok: Boolean(process.env.HUBSPOT_PRIVATE_APP_TOKEN || process.env.HUBSPOT_ACCESS_TOKEN),
    label: 'HubSpot CRM (opcional comercial)',
    detail: 'Token Private App → upsert lead desde /contacto. Ver docs/hubspot.md.',
    href: '/contacto',
  },
];

export default function DlocalChecklistPage() {
  return (
    <LegalShell
      eyebrow="Cumplimiento"
      title="Checklist sitio dLocal Go"
      updated="Usar antes de solicitar revisión a Bruna / activación live"
    >
      <p className="legal-lead">
        Fuente operativa interna. Marca en verde lo listo; el RUT/razón social oficiales bloquean el go-live
        hasta confirmarse.
      </p>
      <ul className="check-list">
        {ITEMS.map((item) => (
          <li key={item.label} className={item.ok ? 'ok' : 'pending'}>
            <span className="mark">{item.ok ? 'Listo' : 'Pendiente'}</span>
            <div>
              <strong>{item.label}</strong>
              <p>{item.detail}</p>
              <Link href={item.href}>Ver página</Link>
            </div>
          </li>
        ))}
      </ul>
    </LegalShell>
  );
}
