'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import { BellIcon, SearchIcon } from '../../components/Icons';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('esm-session');
    if (!raw) { router.replace('/login'); return; }
    try {
      const session = JSON.parse(raw);
      if (session.role !== 'admin') { router.replace('/login'); return; }
    } catch {
      router.replace('/login');
      return;
    }
    setAuthChecked(true);
  }, [router]);

  if (!authChecked) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-3)' }}>
      Cargando…
    </div>
  );

  return (
    <div className="app-shell">
      <Sidebar mode="admin" />
      <div className="main-area">
        <header className="top-bar">
          <span className="bar-title" id="adminTitle">Panel Admin</span>
          <div className="search-bar">
            <SearchIcon size={13} />
            <input placeholder="Buscar..." />
          </div>
          <div className="bar-actions">
            <div className="icon-btn">
              <BellIcon size={14} />
              <div className="notif-dot" />
            </div>
            <div className="av-sm">IT</div>
          </div>
        </header>
        <main className="page-content stagger-in">{children}</main>
      </div>
    </div>
  );
}
