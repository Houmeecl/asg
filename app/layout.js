import { Lexend, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const display = Lexend({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "SICR3P — Evidencia industrial, CBAM y Corredor + EUDR",
  description: "Infraestructura de evidencia industrial para proveedores de la gran minería: expedientes, custodia SHA-256, CBAM preverificado y Corredor Bioceánico + EUDR.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
