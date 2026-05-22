import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'esmegine — Plataforma de gestión',
  description: 'Plataforma centralizada para clientes de Index Technologies',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
