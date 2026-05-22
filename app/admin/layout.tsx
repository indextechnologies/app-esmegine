import Sidebar from '../../components/Sidebar';
import { BellIcon, SearchIcon } from '../../components/Icons';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
