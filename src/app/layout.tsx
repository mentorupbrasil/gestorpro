import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GestorPro Unimetra",
  description: "Plataforma segura de saúde ocupacional em construção.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
