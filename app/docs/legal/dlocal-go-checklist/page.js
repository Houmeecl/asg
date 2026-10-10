import Link from 'next/link';
import LegalShell from '../../../components/LegalShell';
import { BAAS_LEGAL } from '@/lib/baas/config';

export const metadata = {
  title: 'Checklist del sitio — sicr3p/',
  description: 'Requisitos de sitio web público de SICR3P SpA antes de activación merchant.',
};

const ITEMS = [
  {
    ok: true,
    label: 'Landing que representa la operación real',
    detail: 'Qué es sicr3p/, cómo se contrata y el flujo portal → cobro → liquidación.',
    href: '/',
  },
  {
    ok: true,
    label: 'Términos y condiciones propios (servicios)',
    detail: 'Solo nombran sicr3p/ / SICR3P SpA; describen POS, lotes y liquidación.',
    href: '/terminos',
  },
  {
    ok: true,
    label: 'Privacidad',
    detail: 'Tratamiento de datos del formulario y del panel sicr3p/.',
    href: '/privacidad',
  },
  {
    ok: true,
    label: 'Formulario de contacto activo',
    detail: 'Nombre, email, mensaje con confirmación de envío.',
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
    label: 'Razón social + RUT oficiales',
    detail: `${BAAS_LEGAL.razonSocial} · ${BAAS_LEGAL.rut} (CVE ${BAAS_LEGAL.estatutoCve})`,
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
    label: 'CRM de leads (opcional)',
    detail: 'Token de CRM configurado para /contacto, o modo simulador.',
    href: '/contacto',
  },
];

export default function SiteChecklistPage() {
  return (
    <LegalShell
      eyebrow="Cumplimiento"
      title="Checklist del sitio"
      updated="Usar antes de solicitar revisión / activación merchant"
    >
      <p className="legal-lead">
        Fuente operativa interna de sicr3p/. Marca en verde lo listo. El RUT y la razón social deben
        coincidir con el estatuto de SICR3P SpA.
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
