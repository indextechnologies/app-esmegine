'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, color: 'var(--text-2, #e2e8f0)' }}>
      <div style={{ fontSize: 32 }}>⚠️</div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>Error en el panel</div>
      <div style={{ fontSize: 13, color: 'var(--text-3, #94a3b8)' }}>No se pudo cargar el panel de administración.</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button onClick={reset} style={{ padding: '8px 20px', borderRadius: 8, background: 'var(--accent, #6366f1)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
          Reintentar
        </button>
        <button onClick={() => router.push('/login')} style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', color: 'var(--text-3, #94a3b8)', border: '1px solid var(--border, rgba(255,255,255,.1))', cursor: 'pointer', fontSize: 13 }}>
          Ir al login
        </button>
      </div>
    </div>
  );
}
