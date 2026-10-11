import { redirect } from 'next/navigation';
import { obtenerUsuarioSesion } from '@/lib/auth';
import { buildDashboardPayload } from '@/lib/baas/dashboard-data';
import PortalHomeClient from './PortalHomeClient';

export default async function PortalHomePage() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) redirect('/ingresar');
  if (usuario.rol !== 'EMPRESA' && usuario.rol !== 'ADMIN') redirect('/ops');
  return <PortalHomeClient initial={buildDashboardPayload(usuario)} />;
}
