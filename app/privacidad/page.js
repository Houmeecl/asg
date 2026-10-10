import Link from 'next/link';
import SicrLogo from '../components/SicrLogo';
import SiteFooter from '../components/SiteFooter';
import { BAAS_LEGAL } from '@/lib/baas/config';
import '../sicr-landing.css';

export const metadata = {
  title: 'Privacidad — sicr3p/',
  description: 'Política de privacidad del servicio tecnológico sicr3p/.',
};

export default function PrivacidadPage() {
  return (
    <div className="sicr-lp min-h-screen">
      <header className="top">
        <div className="c">
          <Link href="/" className="brand-mark"><SicrLogo size="sm" contrast="dark" /></Link>
          <div className="sp" />
          <Link href="/terminos" className="btn out sm">Términos</Link>
        </div>
      </header>
      <main className="sec" style={{ paddingTop: 48 }}>
        <div className="c" style={{ maxWidth: 760 }}>
          <span className="eyebrow">Legal</span>
          <h1 style={{ fontSize: 36, margin: '8px 0 12px' }}>Política de privacidad</h1>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 32 }}>
            {BAAS_LEGAL.razonSocial} · RUT {BAAS_LEGAL.rut}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, lineHeight: 1.6, fontSize: 15 }}>
            <section>
              <h2 style={{ fontSize: 20 }}>Datos que tratamos</h2>
              <p>
                Identificación de usuarios del panel (nombre, email, rol), datos de contacto del formulario,
                datos de beneficiarios necesarios para payouts (documento, banco, cuenta), identificadores de
                operaciones y registros de KYC demo asociados a wallets virtuales.
              </p>
            </section>
            <section>
              <h2 style={{ fontSize: 20 }}>Finalidad</h2>
              <p>
                Prestar el servicio tecnológico, autenticar accesos, conciliar cobros TUU y payouts dLocal Go,
                responder contactos comerciales y cumplir obligaciones legales aplicables.
              </p>
            </section>
            <section>
              <h2 style={{ fontSize: 20 }}>Encargados / proveedores</h2>
              <p>
                Datos de pago presencial y liquidación pueden tratarse por TUU y dLocal Go según sus propias
                políticas y contratos de merchant. No vendemos datos personales.
              </p>
            </section>
            <section>
              <h2 style={{ fontSize: 20 }}>Conservación y derechos</h2>
              <p>
                Conservamos datos el tiempo necesario para la operación y exigencias legales. Para ejercer acceso,
                rectificación o eliminación (cuando proceda), escribe a{' '}
                <a href={`mailto:${BAAS_LEGAL.email}`}>{BAAS_LEGAL.email}</a>.
              </p>
            </section>
            <section>
              <h2 style={{ fontSize: 20 }}>Formulario de contacto</h2>
              <p>
                El mensaje enviado en <Link href="/contacto">/contacto</Link> se almacena para seguimiento comercial
                y no se usa para marketing no solicitado.
              </p>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
