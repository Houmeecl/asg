import Link from 'next/link';
import SicrLogo from '../components/SicrLogo';
import SiteFooter from '../components/SiteFooter';
import { BAAS_LEGAL } from '@/lib/baas/config';
import '../sicr-landing.css';

export const metadata = {
  title: 'Datos de la sociedad — sicr3p/',
  description: 'Razón social y datos de contacto para validación dLocal Go.',
};

export default function LegalPage() {
  const { razonSocial, rut, email, telefono, direccion } = BAAS_LEGAL;
  return (
    <div className="sicr-lp min-h-screen">
      <header className="top">
        <div className="c">
          <Link href="/" className="brand-mark"><SicrLogo size="sm" contrast="dark" /></Link>
          <div className="sp" />
          <Link href="/contacto" className="btn out sm">Contacto</Link>
        </div>
      </header>
      <main className="sec" style={{ paddingTop: 48 }}>
        <div className="c" style={{ maxWidth: 720 }}>
          <span className="eyebrow">Persona jurídica</span>
          <h1 style={{ fontSize: 36, margin: '8px 0 12px' }}>Datos de la sociedad</h1>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 28 }}>
            Información visible para revisión de cuenta merchant (p. ej. dLocal Go). Los campos marcados como
            “dato a confirmar” deben alinearse con el registro oficial antes de solicitar activación live.
          </p>
          <dl style={{ display: 'grid', gap: 16, background: 'var(--bg)', padding: 24, borderRadius: 14 }}>
            <div>
              <dt style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>Razón social</dt>
              <dd style={{ margin: '4px 0 0', fontSize: 18, fontFamily: 'var(--fd)', color: 'var(--navy)' }}>{razonSocial}</dd>
            </div>
            <div>
              <dt style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>RUT</dt>
              <dd style={{ margin: '4px 0 0', fontSize: 18, fontFamily: 'var(--fd)', color: 'var(--navy)' }}>{rut}</dd>
            </div>
            <div>
              <dt style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>Email</dt>
              <dd style={{ margin: '4px 0 0' }}><a href={`mailto:${email}`}>{email}</a></dd>
            </div>
            <div>
              <dt style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>Teléfono</dt>
              <dd style={{ margin: '4px 0 0' }}><a href={`tel:${telefono.replace(/\s/g, '')}`}>{telefono}</a></dd>
            </div>
            <div>
              <dt style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>Dirección</dt>
              <dd style={{ margin: '4px 0 0' }}>{direccion}</dd>
            </div>
          </dl>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
