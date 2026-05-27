import type { Metadata } from 'next';
import './globals.css';
import GlitchIntro from '@/components/GlitchIntro';

export const metadata: Metadata = {
  title: 'esmegine — Plataforma de gestión',
  description: 'Plataforma centralizada para clientes de Index Technologies',
  icons: { icon: '/icon-index.png', apple: '/icon-index.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <GlitchIntro />
        {children}
      </body>
    </html>
  );
}
