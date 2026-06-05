'use client';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <html lang="es">
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, fontFamily: 'system-ui, sans-serif', background: '#0a0a0f', color: '#e2e8f0' }}>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Algo salió mal</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Ocurrió un error inesperado</div>
          <button onClick={reset} style={{ marginTop: 8, padding: '8px 20px', borderRadius: 8, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
