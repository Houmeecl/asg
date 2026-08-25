import { redirect } from 'next/navigation';
import { obtenerUsuarioSesion } from '@/lib/auth';
import Dashboard from '../components/Dashboard';

export default async function PanelPage() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) redirect('/ingresar');

  return <Dashboard usuario={usuario} />;
}
