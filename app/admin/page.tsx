'use client';
import Link from 'next/link';
import { CLIENTS, RESERVATIONS } from '../../lib/demo-data';

const TODAY = new Date().toISOString().slice(0, 10);

function stat(label: string, val: number | string, color: string, icon: string, change: string, chClass: string) {
  return (
    <div className="stat-card">
      <div className="stat-ic" style={{ background: color + '22', color }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
      </div>
      <div className="stat-val" style={{ color }}>{val}</div>
      <div className="stat-lbl">{label}</div>
      <div className={`stat-change ${chClass}`}>{change}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const active  = CLIENTS.filter(c => c.active).length;
  const todayRs = RESERVATIONS.filter(r => r.date === TODAY).length;
  const pending = RESERVATIONS.filter(r => r.status === 'pending').length;
  const total   = RESERVATIONS.length;

  const byClient = CLIENTS.map(c => ({
    ...c,
    count: RESERVATIONS.filter(r => r.tenant === c.slug).length,
    today: RESERVATIONS.filter(r => r.tenant === c.slug && r.date === TODAY).length,
  }));

  const recent = [...RESERVATIONS]
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
    .slice(0, 8);

  return (
    <>
      <div className="pg-title a1">Buenos días, Index ✦</div>
      <div className="pg-sub a1">{new Date().toLocaleDateString('es', { weekday:'long', day:'numeric', month:'long', year:'numeric' })} · {todayRs} reservas hoy</div>

      <div className="stats-row">
        {stat('Clientes activos',  active,  '#6366f1', '🏪', '↑ 1 nuevo este mes',   'ch-up')}
        {stat('Reservas hoy',      todayRs, '#10b981', '📅', '↑ 3 vs ayer',          'ch-up')}
        {stat('Pendientes',        pending, '#f59e0b', '⏳', '↑ 5 nuevas hoy',       'ch-warn')}
        {stat('Total del mes',     total,   '#a5b4fc', '📊', '↑ 22% vs mes anterior','ch-up')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>

        {/* Clientes overview */}
        <div className="card a2">
          <div className="card-hd">
            <div className="card-title">Clientes</div>
            <Link href="/admin/clientes" className="card-link">Ver todos →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {byClient.map(c => (
              <Link key={c.slug} href={`/${c.slug}/dashboard`} className="client-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div className="client-icon" style={{ background: c.colorBg, width: 36, height: 36, borderRadius: 8, margin: 0 }}>
                    {c.emoji}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{c.industry}</div>
                  </div>
                  <span className={`badge badge-${c.active ? 'active' : 'inactive'}`} style={{ marginLeft: 'auto' }}>
                    {c.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                  <div><span style={{ color: 'var(--text-3)' }}>Reservas: </span><strong>{c.count}</strong></div>
                  <div><span style={{ color: 'var(--text-3)' }}>Hoy: </span><strong style={{ color: 'var(--green)' }}>{c.today}</strong></div>
                  <div><span style={{ color: 'var(--text-3)' }}>Plan: </span><strong>{c.plan}</strong></div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card a3">
          <div className="card-hd">
            <div className="card-title">Actividad reciente</div>
            <Link href="/admin/reservas" className="card-link">Ver →</Link>
          </div>
          {recent.map(r => {
            const c = CLIENTS.find(cl => cl.slug === r.tenant);
            return (
              <div key={r.id} className="act-item">
                <div className={`act-dot ${r.status}`} />
                <div className="act-body">
                  <div className="act-text">
                    <strong>{r.client}</strong> → {r.service}
                    <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px', borderRadius: 4, background: c?.colorBg, color: c?.color }}>{c?.name}</span>
                  </div>
                  <div className="act-time">{r.date} · {r.time} · <span style={{ color: r.status === 'confirmed' ? 'var(--green)' : r.status === 'pending' ? 'var(--yellow)' : 'var(--red)' }}>{r.status === 'confirmed' ? 'Confirmada' : r.status === 'pending' ? 'Pendiente' : 'Cancelada'}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
