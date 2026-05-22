'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  DashIcon, ResIcon, UsersIcon, GlobeIcon,
  BarChartIcon, SettingsIcon, CRMIcon, ArrowLeft,
} from './Icons';

type Props =
  | { mode: 'admin' }
  | { mode: 'tenant'; slug: string; name: string; industry: string; emoji: string };

export default function Sidebar(props: Props) {
  const path = usePathname();
  const router = useRouter();

  function logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('esm_role');
      localStorage.removeItem('esm_tenant');
    }
    router.push('/login');
  }

  if (props.mode === 'admin') {
    const links = [
      { href: '/admin',          label: 'Dashboard',  icon: <DashIcon size={16} />, exact: true },
      { href: '/admin/clientes', label: 'Clientes',   icon: <UsersIcon size={16} /> },
      { href: '/admin/reservas', label: 'Reservas',   icon: <ResIcon size={16} /> },
      { href: '/admin/config',   label: 'Configuración', icon: <SettingsIcon size={16} /> },
    ];

    return (
      <aside className="sidebar">
        <div className="sb-logo">
          <div className="sb-logo-row">
            <div className="sb-gem">E</div>
            <div>
              <div className="sb-name">esmegine</div>
              <div className="sb-sub">Index Technologies</div>
            </div>
          </div>
        </div>

        <nav className="sb-nav">
          <div className="sb-sec">Panel principal</div>
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`sb-item ${(l.exact ? path === l.href : path.startsWith(l.href)) ? 'active' : ''}`}
            >
              <span className="sb-ic">{l.icon}</span>
              {l.label}
            </Link>
          ))}

          <div className="sb-sec" style={{ marginTop: 20 }}>Vista rápida</div>
          <div style={{ padding: '0 10px', fontSize: 12, color: 'var(--text-3)' }}>
            Accedé a un cliente:
          </div>
          {['bom-pain','la-pelu','divina-skybar'].map(slug => (
            <Link key={slug} href={`/${slug}/dashboard`} className="sb-item" style={{ fontSize: 12 }}>
              <span style={{ width: 16, textAlign: 'center' }}>›</span>
              {slug}
            </Link>
          ))}
        </nav>

        <div className="sb-foot">
          <button className="sb-user" onClick={logout} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <div className="sb-av">IT</div>
            <div>
              <div className="sb-uname">Index Technologies</div>
              <div className="sb-urole">Super Admin</div>
            </div>
          </button>
        </div>
      </aside>
    );
  }

  const { slug, name, industry } = props;
  const base = `/${slug}`;

  const links = [
    { href: `${base}/dashboard`,  label: 'Dashboard',  icon: <DashIcon size={16} /> },
    { href: `${base}/reservas`,   label: 'Reservas',   icon: <ResIcon size={16} /> },
    { href: `${base}/website`,    label: 'Website',    icon: <GlobeIcon size={16} /> },
    { href: `${base}/crm`,        label: 'Clientes',   icon: <CRMIcon size={16} /> },
    { href: `${base}/analytics`,  label: 'Analytics',  icon: <BarChartIcon size={16} /> },
    { href: `${base}/config`,     label: 'Configuración', icon: <SettingsIcon size={16} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sb-logo">
        <div className="sb-logo-row">
          <div className="sb-gem">E</div>
          <div>
            <div className="sb-name">esmegine</div>
            <div className="sb-sub">by Index Technologies</div>
          </div>
        </div>
      </div>

      <div className="sb-client-badge">
        <div className="sb-client-name">{name}</div>
        <div className="sb-client-type">{industry}</div>
      </div>

      <nav className="sb-nav">
        <div className="sb-sec">Módulos</div>
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`sb-item ${path === l.href ? 'active' : ''}`}
          >
            <span className="sb-ic">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="sb-foot">
        <Link href="/admin" className="sb-item" style={{ fontSize: 12, marginBottom: 8 }}>
          <span className="sb-ic"><ArrowLeft size={14} /></span>
          Panel Admin
        </Link>
        <button className="sb-user" onClick={logout} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
          <div className="sb-av">{name.slice(0, 2).toUpperCase()}</div>
          <div>
            <div className="sb-uname">{name}</div>
            <div className="sb-urole">Admin</div>
          </div>
        </button>
      </div>
    </aside>
  );
}
