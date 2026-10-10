import { Syne, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "sicr3p/ — Pagos y liquidación operativa",
  description:
    "Plataforma tecnológica sicr3p/: cobros en TUU, panel operativo y payouts vía dLocal Go. Software y mandato — no banco ni billetera.",
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
