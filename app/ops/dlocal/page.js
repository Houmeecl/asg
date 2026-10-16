import { redirect } from 'next/navigation';
import { obtenerUsuarioSesion } from '@/lib/auth';
import { dlocalInfraStatus } from '@/lib/baas/dlocal-infra';
import DlocalInfraClient from './DlocalInfraClient';

export default async function DlocalInfraOpsPage() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario || (usuario.rol !== 'ADMIN' && usuario.rol !== 'OPERADOR')) {
    redirect('/ingresar');
  }

  const infra = dlocalInfraStatus();
  return <DlocalInfraClient initial={{ ...infra, usuario }} />;
}
