import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "GestorPro Unimetra",
  description: "Plataforma segura de saúde ocupacional para clínicas e empresas.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={GeistSans.variable}>
      <body className={GeistSans.className}>{children}</body>
    </html>
  );
}
