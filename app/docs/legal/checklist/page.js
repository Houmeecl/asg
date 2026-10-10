import Link from 'next/link';
import LegalShell from '../../../components/LegalShell';
import { BAAS_LEGAL } from '@/lib/baas/config';

export const metadata = {
  title: 'Checklist del sitio — sicr3p/',
  description: 'Requisitos de sitio web público de SICR3P SpA antes de activación merchant.',
};

const phoneLooksPlaceholder = /2123\s*4567|1234\s*5678|XXXX|confirmar/i.test(
  BAAS_LEGAL.telefono || '',
);

const ITEMS = [
  {
    ok: true,
    label: 'Logo oficial SicrLogo',
    detail: 'Wordmark sicr3p con grafismo “3” y triple impacto — no wordmarks mock.',
    href: '/',
  },
  {
    ok: true,
    label: 'Landing que representa la operación real',
    detail: 'Qué es sicr3p/, cómo se contrata y el flujo portal → cobro → liquidación.',
    href: '/',
  },
  {
    ok: true,
    label: 'Términos y condiciones propios (servicios)',
    detail:
      'Integración y desarrollo empresarial; no banco / crédito / prestamista. SpA + Fundación + Proveedor Regional.',
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
    label: 'Dueña + operadora visibles',
    detail: `Dueña ${BAAS_LEGAL.fundacion.razonSocial} (${BAAS_LEGAL.fundacion.rut}) · Operadora ${BAAS_LEGAL.razonSocial} (${BAAS_LEGAL.rut}).`,
    href: '/legal',
  },
  {
    ok: !/XXXX|confirmar/i.test(`${BAAS_LEGAL.razonSocial}${BAAS_LEGAL.rut}`),
    label: 'Razón social + RUT oficiales',
    detail: `${BAAS_LEGAL.razonSocial} · ${BAAS_LEGAL.rut} (CVE ${BAAS_LEGAL.estatutoCve})`,
    href: '/legal',
  },
  {
    ok: !phoneLooksPlaceholder,
    label: 'Teléfono de contacto confirmado',
    detail: phoneLooksPlaceholder
      ? `${BAAS_LEGAL.telefono} — reemplazar con SICR3P_CONTACT_PHONE real.`
      : `${BAAS_LEGAL.telefono} en footer / legal.`,
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
  {
    ok: Boolean(process.env.DLOCAL_API_KEY && process.env.DLOCAL_MODE && process.env.DLOCAL_MODE !== 'simulator'),
    label: 'dLocal Go sandbox/live (opcional)',
    detail: 'Sin claves: simulador local. Con DLOCAL_MODE=sandbox|live + API key: rail real.',
    href: '/docs/legal/checklist',
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
        Fuente operativa interna de sicr3p/. Marca en verde lo listo. Logo, dueña (Fundación
        Entretodos) y operadora (SICR3P SpA) deben coincidir con los documentos en{' '}
        <Link href="/legal">/legal</Link>.
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
