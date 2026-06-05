'use client';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { BellIcon } from '../../components/Icons';
import { useClient } from '../../lib/use-clients';

const PAGE_TITLES: Record<string, string> = {
  dashboard:  'Inicio',
  reservas:   'Reservas',
  menu:       'Menú',
  contenido:  'Contenido',
  crm:        'Clientes',
  config:     'Configuración',
};

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const { tenant } = useParams<{ tenant: string }>();
  const path = usePathname();
  const router = useRouter();
  const { client, loading } = useClient(tenant);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('esm-session');
    if (!raw) { router.replace('/login'); return; }
    try {
      const session = JSON.parse(raw);
      if (session.role !== 'admin' && session.tenant !== tenant) {
        router.replace('/login');
        return;
      }
    } catch {
      router.replace('/login');
      return;
    }
    setAuthChecked(true);
  }, [tenant, router]);

  if (!authChecked || loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-3)' }}>
      Cargando…
    </div>
  );
  if (!client) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-3)', gap: 12 }}>
      <div style={{ fontSize: 13 }}>No se encontró el portal</div>
      <button onClick={() => router.replace('/login')} style={{ fontSize: 12, padding: '6px 16px', borderRadius: 8, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}>
        Volver al inicio
      </button>
    </div>
  );

  const segment = path.split('/').pop() ?? '';
  const pageTitle = PAGE_TITLES[segment] ?? client.name;

  return (
    <div className="app-shell">
      <Sidebar
        mode="tenant"
        slug={client.slug}
        name={client.name}
        industry={client.industry}
        emoji={client.emoji}
      />
      <div className="main-area">
        <header className="top-bar">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="bar-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pageTitle}
            </div>
            <div className="bar-sub">{client.name}</div>
          </div>
          <div className="bar-actions">
            <div className="icon-btn">
              <BellIcon size={14} />
              <div className="notif-dot" />
            </div>
            <div className="av-sm">{client.name.slice(0, 2).toUpperCase()}</div>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
