'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CLIENTS, RESERVATIONS } from '../../../lib/demo-data';
import { GlobeIcon, BarChartIcon, CRMIcon, ExternalIcon } from '../../../components/Icons';

const TODAY = new Date().toISOString().slice(0, 10);
const STATUS_LABEL: Record<string, string> = { confirmed: 'Confirmada', pending: 'Pendiente', cancelled: 'Cancelada' };

export default function TenantDashboard() {
  const { tenant } = useParams<{ tenant: string }>();
  const client = CLIENTS.find(c => c.slug === tenant);
  const reservas = RESERVATIONS.filter(r => r.tenant === tenant);

  if (!client) return null;

  const total     = reservas.length;
  const todayRs   = reservas.filter(r => r.date === TODAY).length;
  const confirmed = reservas.filter(r => r.status === 'confirmed').length;
  const pending   = reservas.filter(r => r.status === 'pending').length;
  const cancelled = reservas.filter(r => r.status === 'cancelled').length;

  const recent = [...reservas]
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
    .slice(0, 6);

  const quickLinks = [
    { href: `/${tenant}/website`,   icon: <GlobeIcon size={16} />,    label: 'Editar Website',  sub: 'Menú, horarios, galería' },
    { href: `/${tenant}/analytics`, icon: <BarChartIcon size={16} />, label: 'Analytics',       sub: 'Visitas, SEO, fuentes'   },
    { href: `/${tenant}/crm`,       icon: <CRMIcon size={16} />,      label: 'Mis Clientes',    sub: `${RESERVATIONS.filter(r => r.tenant === tenant).length} registros` },
  ];

  return (
    <>
      <div className="pg-title a1">
        {client.emoji} {client.name}
      </div>
      <div className="pg-sub a1">
        {new Date().toLocaleDateString('es', { weekday:'long', day:'numeric', month:'long' })} · {todayRs} reservas hoy
        {client.website && (
          <a href={client.website} target="_blank" rel="noopener" style={{ marginLeft: 12, color: 'var(--accent-1)', textDecoration: 'none', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <ExternalIcon size={11} /> Ver sitio web
          </a>
        )}
      </div>

      {/* Stats */}
      <div className="stats-row">
        {[
          { l:'Total reservas', v:total,     c:'var(--accent-1)', ic:'📊', ch:'↑ 18% este mes',    cls:'ch-up'   },
          { l:'Hoy',            v:todayRs,   c:'var(--green)',    ic:'📅', ch:'↑ 2 vs ayer',       cls:'ch-up'   },
          { l:'Pendientes',     v:pending,   c:'var(--yellow)',   ic:'⏳', ch:'↑ 2 nuevas hoy',    cls:'ch-warn' },
          { l:'Confirmadas',    v:confirmed, c:'var(--green)',    ic:'✓',  ch:`${Math.round(confirmed/Math.max(total,1)*100)}% tasa`, cls:'ch-up' },
        ].map(s => (
          <div key={s.l} className="stat-card">
            <div className="stat-ic" style={{ background: s.c + '22', color: s.c }}>
              <span style={{ fontSize: 16 }}>{s.ic}</span>
            </div>
            <div className="stat-val" style={{ color: s.c }}>{s.v}</div>
            <div className="stat-lbl">{s.l}</div>
            <div className={`stat-change ${s.cls}`}>{s.ch}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14 }}>

        {/* Recent reservations */}
        <div className="card a2">
          <div className="card-hd">
            <div className="card-title">Reservas recientes</div>
            <Link href={`/${tenant}/reservas`} className="card-link">Ver todas →</Link>
          </div>
          {recent.length === 0 ? (
            <div className="empty">Sin reservas aún</div>
          ) : recent.map(r => (
            <div key={r.id} className="act-item">
              <div className={`act-dot ${r.status}`} />
              <div className="act-body">
                <div className="act-text"><strong>{r.client}</strong> · {r.service}</div>
                <div className="act-time">{r.date} · {r.time} · <span style={{ color: r.status === 'confirmed' ? 'var(--green)' : r.status === 'pending' ? 'var(--yellow)' : 'var(--red)' }}>{STATUS_LABEL[r.status]}</span></div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick links + info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card a3">
            <div className="card-title" style={{ marginBottom: 12 }}>Acceso rápido</div>
            {quickLinks.map(l => (
              <Link key={l.href} href={l.href} className="sb-item" style={{ marginBottom: 4 }}>
                <span className="sb-ic">{l.icon}</span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)' }}>{l.label}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{l.sub}</div>
                </div>
              </Link>
            ))}
          </div>

          <div className="card a4">
            <div className="card-title" style={{ marginBottom: 12 }}>Datos del negocio</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              {[
                { label: '📧 Email',     val: client.email     },
                { label: '📱 Instagram', val: client.instagram },
                { label: '📍 Dirección', val: client.address   },
                { label: '📋 Plan',      val: client.plan      },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--text-3)', minWidth: 85 }}>{row.label}</span>
                  <span style={{ color: 'var(--text-1)' }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
