import { obtenerUsuarioSesion, destinoTrasLogin } from '@/lib/auth';
import { BAAS_LEGAL } from '@/lib/baas/config';
import { FOOTER_DISCLAIMER } from '@/lib/baas/legal-copy';
import LandingFramer from './components/LandingFramer';
import './sicr-landing.css';

export default async function LandingPage() {
  const usuario = await obtenerUsuarioSesion();
  const destino = usuario ? destinoTrasLogin(usuario) : '/ingresar';

  return (
    <LandingFramer
      usuario={usuario}
      destino={destino}
      disclaimer={FOOTER_DISCLAIMER}
      legal={{
        razonSocial: BAAS_LEGAL.razonSocial,
        email: BAAS_LEGAL.email,
        telefono: BAAS_LEGAL.telefono,
        direccion: BAAS_LEGAL.direccion,
        fundacion: BAAS_LEGAL.fundacion,
        social: BAAS_LEGAL.social,
      }}
    />
  );
}
