import { redirect } from 'next/navigation';
import { obtenerUsuarioSesion } from '@/lib/auth';

export default async function PortalLayout({ children }) {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) redirect('/ingresar');
  if (!['EMPRESA', 'ADMIN'].includes(usuario.rol)) {
    if (usuario.rol === 'OPERADOR') redirect('/ops');
    redirect('/panel');
  }
  return children;
}
