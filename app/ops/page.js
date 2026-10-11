import { redirect } from 'next/navigation';
import { obtenerUsuarioSesion } from '@/lib/auth';
import { buildDashboardPayload } from '@/lib/baas/dashboard-data';
import OpsColaClient from './OpsColaClient';

export default async function OpsColaPage() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) redirect('/ingresar');
  if (usuario.rol !== 'OPERADOR' && usuario.rol !== 'ADMIN') redirect('/portal');
  return <OpsColaClient initial={buildDashboardPayload(usuario)} />;
}
