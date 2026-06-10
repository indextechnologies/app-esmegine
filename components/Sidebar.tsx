'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  DashIcon, ResIcon, UsersIcon, GlobeIcon, UtensilsIcon,
  SettingsIcon, CRMIcon,
} from './Icons';
import { useClients } from '../lib/use-clients';

type Props =
  | { mode: 'admin' }
  | { mode: 'tenant'; slug: string; name: string; industry: string; emoji: string; logoUrl?: string; modules: string[] };

export default function Sidebar(props: Props) {
  const path = usePathname();
  const router = useRouter();

  function logout() {
    sessionStorage.removeItem('esm-session');
    router.push('/login');
  }

  const { clients } = useClients();

  if (props.mode === 'admin') {
    const links = [
      { href: '/admin',          label: 'Dashboard', icon: <DashIcon size={16} />,    bnIcon: <DashIcon size={18} />,    exact: true },
      { href: '/admin/clientes', label: 'Clientes',  icon: <UsersIcon size={16} />,   bnIcon: <UsersIcon size={18} /> },
      { href: '/admin/reservas', label: 'Reservas',  icon: <ResIcon size={16} />,     bnIcon: <ResIcon size={18} /> },
      { href: '/admin/config',   label: 'Config',    icon: <SettingsIcon size={16} />, bnIcon: <SettingsIcon size={18} /> },
    ];

    return (
      <>
        <aside className="sidebar">
          <div className="sb-logo">
            <div className="sb-logo-row">
              <img src="/icon-index-transparent.png" alt="Index" style={{height:34,width:34,objectFit:'contain',flexShrink:0}} />
              <div className="sb-name">Index</div>
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
            {clients.filter(c => c.active).map(c => (
              <Link key={c.slug} href={`/${c.slug}/dashboard`} className="sb-item" style={{ fontSize: 12 }}>
                <span style={{ width: 16, textAlign: 'center', fontSize: 14 }}>{c.emoji}</span>
                {c.name}
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

        <nav className="bottom-nav">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`bn-item ${(l.exact ? path === l.href : path.startsWith(l.href)) ? 'active' : ''}`}
            >
              <span className="bn-ic">{l.bnIcon}</span>
              <span className="bn-label">{l.label}</span>
            </Link>
          ))}
        </nav>
      </>
    );
  }

  const { slug, name, industry, modules } = props;
  const base = `/${slug}`;

  // `core` modules are always shown; the rest only if enabled for this tenant in Notion.
  const allLinks = [
    { key: 'dashboard', core: true,  href: `${base}/dashboard`, label: 'Inicio',    icon: <DashIcon size={16} />,     bnIcon: <DashIcon size={18} /> },
    { key: 'reservas',  core: false, href: `${base}/reservas`,  label: 'Reservas',  icon: <ResIcon size={16} />,      bnIcon: <ResIcon size={18} /> },
    { key: 'menu',      core: false, href: `${base}/menu`,      label: 'Menú',      icon: <UtensilsIcon size={16} />, bnIcon: <UtensilsIcon size={18} /> },
    { key: 'contenido', core: false, href: `${base}/contenido`, label: 'Contenido', icon: <GlobeIcon size={16} />,    bnIcon: <GlobeIcon size={18} /> },
    { key: 'crm',       core: false, href: `${base}/crm`,       label: 'Clientes',  icon: <CRMIcon size={16} />,      bnIcon: <CRMIcon size={18} /> },
    { key: 'config',    core: true,  href: `${base}/config`,    label: 'Config',    icon: <SettingsIcon size={16} />, bnIcon: <SettingsIcon size={18} /> },
  ];

  const links = allLinks.filter(l => l.core || modules.includes(l.key));
  const bnLinks = links.slice(0, 5);

  return (
    <>
      <aside className="sidebar">
        <div className="sb-logo">
          <div className="sb-logo-row">
            <img src="/icon-index-transparent.png" alt="Index" style={{height:34,width:34,objectFit:'contain',flexShrink:0}} />
            <div className="sb-name">Index</div>
          </div>
        </div>

        <div className="sb-client-badge">
          {props.logoUrl && (
            <img src={props.logoUrl} alt={name} style={{height:30,width:'auto',maxWidth:'100%',objectFit:'contain',marginBottom:6,display:'block'}} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
          )}
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
          <button className="sb-user" onClick={logout} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <div className="sb-av">{name.slice(0, 2).toUpperCase()}</div>
            <div>
              <div className="sb-uname">{name}</div>
              <div className="sb-urole">Admin</div>
            </div>
          </button>
        </div>
      </aside>

      <nav className="bottom-nav">
        {bnLinks.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`bn-item ${path === l.href ? 'active' : ''}`}
          >
            <span className="bn-ic">{l.bnIcon}</span>
            <span className="bn-label">{l.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
