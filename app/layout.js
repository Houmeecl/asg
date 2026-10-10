import { Inter, Caveat } from 'next/font/google';
import './brand.css';
import './globals.css';

const inter = Inter({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
});

// Solo para los acentos manuscritos del mockup ("El desarrollo también se construye aquí").
const script = Caveat({
  variable: '--font-script',
  subsets: ['latin'],
  weight: ['600', '700'],
});

export const metadata = {
  title: 'sicr3p/ — Soluciones que impulsan empresas',
  description:
    'Desarrollo empresarial y finanzas sostenibles para PYMEs. Una iniciativa de Proveedor Regional. Operadora: SICR3P SpA.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable} ${script.variable} h-full antialiased`}>
      <body
        className="min-h-full flex flex-col bg-background text-foreground font-sans"
        style={{ fontFamily: 'var(--font-body), Inter, sans-serif' }}
      >
        {children}
      </body>
    </html>
  );
}
