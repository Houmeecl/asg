import { redirect } from 'next/navigation';
import { obtenerUsuarioSesion } from '@/lib/auth';

export default async function OpsLayout({ children }) {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) redirect('/ingresar');
  if (!['OPERADOR', 'ADMIN'].includes(usuario.rol)) {
    if (usuario.rol === 'EMPRESA') redirect('/portal');
    redirect('/panel');
  }
  return children;
}
