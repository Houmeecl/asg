import Link from 'next/link';
import { BAAS_LEGAL } from '@/lib/baas/config';

export default function SiteFooter() {
  const { razonSocial, rut, email, telefono, direccion, social } = BAAS_LEGAL;
  return (
    <footer className="site-foot">
      <div className="c foot-grid">
        <div>
          <div className="foot-brand">
            sicr<span>3</span>p<span className="slash">/</span>
          </div>
          <p className="foot-legal">
            {razonSocial}
            <br />
            RUT {rut}
            <br />
            {direccion}
          </p>
        </div>
        <div>
          <h4>Contacto</h4>
          <p>
            <a href={`mailto:${email}`}>{email}</a>
            <br />
            <a href={`tel:${telefono.replace(/\s/g, '')}`}>{telefono}</a>
          </p>
          {(social.linkedin || social.instagram) && (
            <p className="foot-social">
              {social.linkedin ? (
                <a href={social.linkedin} target="_blank" rel="noreferrer">
                  LinkedIn
                </a>
              ) : null}
              {social.linkedin && social.instagram ? ' · ' : null}
              {social.instagram ? (
                <a href={social.instagram} target="_blank" rel="noreferrer">
                  Instagram
                </a>
              ) : null}
            </p>
          )}
        </div>
        <div>
          <h4>Legal</h4>
          <p className="foot-links">
            <Link href="/terminos">Términos y condiciones</Link>
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/legal">Datos de la sociedad</Link>
            <Link href="/contacto">Contacto</Link>
          </p>
        </div>
      </div>
      <div className="c foot-copy">
        © {new Date().getFullYear()} sicr3p/ · plataforma tecnológica de pagos y liquidación vía proveedores autorizados
      </div>
    </footer>
  );
}
