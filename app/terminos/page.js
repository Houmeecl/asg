import Link from 'next/link';
import SicrLogo from '../components/SicrLogo';
import SiteFooter from '../components/SiteFooter';
import { BAAS_LEGAL } from '@/lib/baas/config';
import '../sicr-landing.css';

export const metadata = {
  title: 'Términos y condiciones — sicr3p/',
  description: 'Términos del servicio tecnológico de pagos y liquidación sicr3p/.',
};

export default function TerminosPage() {
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
        <div className="c" style={{ maxWidth: 760 }}>
          <span className="eyebrow">Legal</span>
          <h1 style={{ fontSize: 36, margin: '8px 0 12px' }}>Términos y condiciones</h1>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 32 }}>
            Servicio tecnológico prestado por {BAAS_LEGAL.razonSocial} (RUT {BAAS_LEGAL.rut}). Última actualización: 2026-03-28.
          </p>

          <article className="legal-prose" style={{ display: 'flex', flexDirection: 'column', gap: 22, lineHeight: 1.6, fontSize: 15, color: 'var(--ink)' }}>
            <section>
              <h2 style={{ fontSize: 20 }}>1. Naturaleza del servicio</h2>
              <p>
                sicr3p/ es una <strong>plataforma tecnológica</strong> que permite a empresas clientes crear solicitudes de pago,
                generar códigos para cobro presencial, conciliar lotes y emitir instrucciones de liquidación.
                No somos banco, no captamos depósitos del público, no emitimos medios de pago con provisión de fondos
                ni operamos como billetera exigible a nombre de terceros.
              </p>
            </section>
            <section>
              <h2 style={{ fontSize: 20 }}>2. Proveedores de cobro y payout</h2>
              <p>
                El cobro presencial lo ejecuta el adquirente <strong>TUU</strong> (InterApp en terminales autorizados).
                El pay-in online (cuando aplique) y los payouts hacia cuentas bancarias de beneficiarios los ejecuta
                <strong> dLocal Go</strong> desde el saldo merchant del comercio SICR3P. SICR3P provee software, mandato
                del cliente y conciliación; no custodia fondos del público en una “cuenta sicr3p/”.
              </p>
            </section>
            <section>
              <h2 style={{ fontSize: 20 }}>3. Flujo operativo</h2>
              <ol>
                <li>La empresa crea una solicitud en el portal y obtiene un código.</li>
                <li>El cobro se realiza en POS TUU (o checkout dLocal Go en flujos online/turista).</li>
                <li>Los abonos llegan a la cuenta bancaria / treasury de SICR3P SpA como comercio.</li>
                <li>Ops fondea el saldo merchant dLocal Go y libera lotes FIFO mediante instrucciones de payout.</li>
                <li>El estado de cada operación se refleja en el panel (pendiente, cobrada, en lote, enviada, pagada o rechazada).</li>
              </ol>
            </section>
            <section>
              <h2 style={{ fontSize: 20 }}>4. Saldo mostrado en el panel</h2>
              <p>
                Las métricas de “saldo disponible” o similares se refieren al <strong>saldo merchant / operativo</strong>
                (p. ej. dLocal Go o conciliación interna), no a dinero exigible del público ni a una cuenta bancaria de clientes.
              </p>
            </section>
            <section>
              <h2 style={{ fontSize: 20 }}>5. Tarjeta / prepago</h2>
              <p>
                Cualquier tarjeta prepago física o emisión de medio de pago solo se ofrecerá con un
                <strong> emisor regulado</strong> y contrato aparte. La “tarjeta virtual” del panel es un identificador
                operativo de wallet interna y no constituye medio de pago con provisión de fondos emitido por SICR3P.
              </p>
            </section>
            <section>
              <h2 style={{ fontSize: 20 }}>6. Responsabilidades del cliente</h2>
              <p>
                El cliente garantiza la veracidad de datos de beneficiarios (RUT/documento, banco, cuenta), el origen lícito
                de los fondos y el cumplimiento de obligaciones tributarias y de prevención de lavado aplicables a su actividad.
                SICR3P puede suspender operaciones ante indicios de fraude o incumplimiento.
              </p>
            </section>
            <section>
              <h2 style={{ fontSize: 20 }}>7. Servicio personalizado</h2>
              <p>
                La contratación puede incluir parámetros de lote, corredores de payout habilitados, terminales POS y roles
                de usuario. Condiciones comerciales específicas se acuerdan por escrito o en la orden de servicio.
              </p>
            </section>
            <section>
              <h2 style={{ fontSize: 20 }}>8. Limitación</h2>
              <p>
                SICR3P no garantiza tiempos de acreditación de terceros (bancos, TUU, dLocal Go). No responde por rechazos
                del emisor de la tarjeta, datos bancarios incorrectos del beneficiario o cortes de red del terminal.
              </p>
            </section>
            <section>
              <h2 style={{ fontSize: 20 }}>9. Contacto</h2>
              <p>
                Consultas: <a href={`mailto:${BAAS_LEGAL.email}`}>{BAAS_LEGAL.email}</a> · {BAAS_LEGAL.telefono} ·{' '}
                <Link href="/contacto">formulario</Link>.
              </p>
            </section>
          </article>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
