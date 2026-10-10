import Link from 'next/link';
import LegalShell from '../../components/LegalShell';

export const metadata = {
  title: 'Open Banking API — sicr3p/',
  description: 'API partner AIS/PIS sobre el BaaS sicr3p/ (cuentas, consentimientos, pagos).',
};

export default function OpenBankingDocsPage() {
  return (
    <LegalShell
      eyebrow="API partner"
      title="Open Banking — infraestructura abierta"
      updated="OAuth 2.0 · OpenAPI 3 · AIS/PIS sobre TUU → lote → dLocal Go"
    >
      <p className="legal-lead">
        Infraestructura para partners sobre estándares abiertos (RFC 6749, RFC 7662, OpenAPI). No es
        un banco ni billetera pública: expone saldo merchant operativo y pagos instruidos vía el
        rail BaaS.
      </p>

      <h2 className="legal-block-title">0. Descubrimiento</h2>
      <ul className="legal-prose">
        <li>
          <code>GET /api/open-banking/v1/discovery</code>
        </li>
        <li>
          <code>GET /api/open-banking/v1/openapi.json</code>
        </li>
        <li>
          <code>POST /api/open-banking/v1/auth/introspect</code> con <code>token</code>
        </li>
      </ul>

      <h2 className="legal-block-title">1. Flujo</h2>
      <ol className="legal-prose">
        <li>
          <code>POST /api/open-banking/v1/auth/token</code> con <code>client_id</code> +{' '}
          <code>client_secret</code>
        </li>
        <li>
          <code>POST /api/open-banking/v1/consents</code> → status{' '}
          <code>AWAITING_AUTHORISATION</code>
        </li>
        <li>
          <code>POST /api/open-banking/v1/consents/:id/authorise</code> (empresa o client demo)
        </li>
        <li>
          Nuevo token con <code>consent_id</code>
        </li>
        <li>
          AIS: <code>GET /accounts</code>, <code>GET /accounts/:id/transactions</code>
        </li>
        <li>
          PIS: <code>POST /payments</code>, <code>GET /payments/:id</code>
        </li>
      </ol>

      <h2 className="legal-block-title">2. Scopes</h2>
      <ul className="legal-prose">
        <li>
          <code>accounts:read</code> — cuentas merchant + wallets
        </li>
        <li>
          <code>transactions:read</code> — operaciones BaaS
        </li>
        <li>
          <code>payments:write</code> — iniciación de pago (simulador dLocal)
        </li>
      </ul>

      <h2 className="legal-block-title">3. Demo</h2>
      <p className="legal-lead">
        Credenciales demo en <Link href="/ops/open-banking">/ops/open-banking</Link> (rol ops/admin).
        Script: <code>node scripts/open-banking-e2e.mjs</code>.
      </p>

      <h2 className="legal-block-title">4. Ejemplo token</h2>
      <pre className="legal-note" style={{ whiteSpace: 'pre-wrap' }}>
        {`curl -sS -X POST http://127.0.0.1:3001/api/open-banking/v1/auth/token \\
  -H 'content-type: application/x-www-form-urlencoded' \\
  -u 'obc_…:obs_…' \\
  -d 'grant_type=client_credentials'`}
      </pre>

      <p className="legal-lead" style={{ marginTop: 28 }}>
        <Link href="/ops/open-banking">Panel ops</Link>
        {' · '}
        <Link href="/docs/legal/checklist">Checklist sitio</Link>
        {' · '}
        <Link href="/legal">Datos PJ</Link>
      </p>
    </LegalShell>
  );
}
