'use client';
import { useParams, usePathname } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { BellIcon } from '../../components/Icons';
import { CLIENTS } from '../../lib/demo-data';

const PAGE_TITLES: Record<string, string> = {
  dashboard:  'Inicio',
  reservas:   'Reservas',
  website:    'Mi Sitio Web',
  crm:        'Clientes',
  analytics:  'Estadísticas',
  config:     'Configuración',
};

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const { tenant } = useParams<{ tenant: string }>();
  const path = usePathname();
  const client = CLIENTS.find(c => c.slug === tenant);

  if (!client) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-3)' }}>
        Cliente no encontrado
      </div>
    );
  }

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
