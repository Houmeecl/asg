import { redirect } from 'next/navigation';
import { obtenerUsuarioSesion } from '@/lib/auth';
import AntaiAdmin from './AntaiAdmin';

export const metadata = { title: 'Administración ANTĀi' };

export default async function AntaiAdminPage() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario || usuario.rol !== 'ADMIN') redirect('/ingresar');
  return <AntaiAdmin nombre={usuario.nombre} />;
}
