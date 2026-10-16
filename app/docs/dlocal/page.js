import Link from 'next/link';
import LegalShell from '../../components/LegalShell';

export const metadata = {
  title: 'dLocal — infraestructura — sicr3p/',
  description: 'Infraestructura dLocal Go y Platforms sobre el rail BaaS SICR3P (TUU → lote → payout).',
};

export default function DlocalDocsPage() {
  return (
    <LegalShell
      eyebrow="Rail de pagos"
      title="dLocal — infraestructura"
      updated="Go + Platforms · sandbox/live · webhooks HTTPS · Chile BANK_TRANSFER"
    >
      <p className="legal-lead">
        Infraestructura de liquidación SICR3P: cobro TUU / pay-in dLocal Go → lote → payout a
        cuentas LATAM. Platforms onboardea vendedores. No es banco ni billetera pública.
      </p>

      <h2 className="legal-block-title">0. Descubrimiento</h2>
      <ul className="legal-prose">
        <li>
          <code>GET /api/baas/dlocal/infra</code> — mapa público (bases, webhooks, Chile)
        </li>
        <li>
          <code>GET /api/baas/dlocal/entorno</code> — modo activo; con sesión ops: slots prueba/live
        </li>
        <li>
          Panel ops: <Link href="/ops/dlocal">/ops/dlocal</Link>
        </li>
      </ul>

      <h2 className="legal-block-title">1. Productos</h2>
      <ul className="legal-prose">
        <li>
          <strong>dLocal Go</strong> — <code>POST /v1/payments</code>, <code>POST /v1/payouts</code>,
          auth <code>Bearer API_KEY:SECRET_KEY</code>
        </li>
        <li>
          <strong>dLocal for Platforms</strong> — <code>POST /v2/accounts</code> + documentos KYC;
          UI en <Link href="/ops/onboarding">/ops/onboarding</Link>
        </li>
      </ul>

      <h2 className="legal-block-title">2. Modos</h2>
      <ul className="legal-prose">
        <li>
          <code>simulator</code> — demo local SQLite, sin red
        </li>
        <li>
          <code>sandbox</code> / prueba — API real de prueba (<code>api-sbx.dlocalgo.com</code>)
        </li>
        <li>
          <code>live</code> — producción (solo después de sandbox)
        </li>
      </ul>
      <p className="legal-lead">
        Slots: <code>DLOCAL_SANDBOX_*</code> y <code>DLOCAL_LIVE_*</code> (Go);
        <code> DLOCAL_PLATFORMS_SANDBOX_*</code> / <code>LIVE_*</code>. Detalle en{' '}
        <code>docs/dlocal-entornos.md</code>.
      </p>

      <h2 className="legal-block-title">3. Webhooks</h2>
      <ul className="legal-prose">
        <li>
          Go: <code>POST /api/baas/webhooks/dlocal</code>
        </li>
        <li>
          Platforms: <code>POST /api/baas/webhooks/dlocal-platforms</code>
        </li>
        <li>Solo HTTPS puerto 443 / TLS 1.2+. Idempotencia recomendada.</li>
      </ul>

      <h2 className="legal-block-title">4. Chile</h2>
      <ul className="legal-prose">
        <li>
          <code>country=CL</code>, <code>currency=CLP</code>,{' '}
          <code>payment_method_id=BANK_TRANSFER</code>
        </li>
        <li>Documento RUT; códigos de banco en ops / discovery</li>
      </ul>

      <h2 className="legal-block-title">5. Ejemplo discovery</h2>
      <pre className="legal-note" style={{ whiteSpace: 'pre-wrap' }}>
        {`curl -sS http://127.0.0.1:3001/api/baas/dlocal/infra | jq .endpoints,.bases`}
      </pre>

      <p className="legal-lead">
        <Link href="/ops/dlocal">Panel ops</Link>
        {' · '}
        <Link href="/autorizar">Autorizar integración</Link>
        {' · '}
        <Link href="/docs/open-banking">Open Banking</Link>
        {' · '}
        <Link href="/docs/legal/checklist">Checklist sitio</Link>
      </p>
    </LegalShell>
  );
}
