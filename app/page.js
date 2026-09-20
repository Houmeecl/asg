import { redirect } from 'next/navigation';

// La raíz muestra el sitio de SICR3P. La landing anterior de contabilidad de carbono sigue en /contabilidad.
export default function Inicio() {
    redirect('/seguros-parametricos');
}
