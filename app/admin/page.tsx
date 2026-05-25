'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CLIENTS } from '../../lib/demo-data';

const TODAY = new Date().toISOString().slice(0, 10);

type LiveRes = {
  id: string; nombreCliente: string; estado: string;
  fecha: string; hora: string; notas: string; tenant: string;
};

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

function dotClass(estado: string) {
  if (estado === 'Confirmada' || estado === 'Completada') return 'confirmed';
  if (estado === 'Cancelada' || estado === 'No Show')     return 'cancelled';
  return 'pending';
}

function statusColor(estado: string) {
  if (estado === 'Confirmada' || estado === 'Completada') return 'var(--green)';
  if (estado === 'Cancelada' || estado === 'No Show')     return 'var(--red)';
  return 'var(--yellow)';
}

export default function AdminDashboard() {
  const [reservations, setReservations] = useState<LiveRes[]>([]);

  useEffect(() => {
    Promise.all(
      CLIENTS.map(c =>
        fetch(`/api/${c.slug}/reservas`)
          .then(r => r.ok ? r.json() : [])
          .then((data: Omit<LiveRes, 'tenant'>[]) => data.map(r => ({ ...r, tenant: c.slug })))
          .catch(() => [] as LiveRes[])
      )
    ).then(results => setReservations(results.flat()));
  }, []);

  const active  = CLIENTS.filter(c => c.active).length;
  const todayRs = reservations.filter(r => r.fecha === TODAY).length;
  const pending = reservations.filter(r => r.estado === 'Pendiente').length;
  const total   = reservations.length;

  const byClient = CLIENTS.map(c => ({
    ...c,
    count: reservations.filter(r => r.tenant === c.slug).length,
    today: reservations.filter(r => r.tenant === c.slug && r.fecha === TODAY).length,
  }));

  const recent = [...reservations]
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora))
    .slice(0, 8);

  return (
    <>
      <div className="pg-title">Buenos días, Index ✦</div>
      <div className="pg-sub">{new Date().toLocaleDateString('es', { weekday:'long', day:'numeric', month:'long', year:'numeric' })} · {todayRs} reservas hoy</div>

      <div className="stats-row">
        {stat('Clientes activos',  active,  '#6366f1', '🏪', `${active} configurados`,     'ch-up')}
        {stat('Reservas hoy',      todayRs, '#10b981', '📅', 'Notion en vivo',             'ch-up')}
        {stat('Pendientes',        pending, '#f59e0b', '⏳', 'Requieren atención',         'ch-warn')}
        {stat('Total del mes',     total,   '#a5b4fc', '📊', 'Todas las reservas',         'ch-up')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>

        {/* Clientes overview */}
        <div className="card">
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
        <div className="card">
          <div className="card-hd">
            <div className="card-title">Actividad reciente</div>
            <Link href="/admin/reservas" className="card-link">Ver →</Link>
          </div>
          {recent.length === 0 ? (
            <div className="empty" style={{ padding: '24px 0', fontSize: 13 }}>Sin reservas aún</div>
          ) : recent.map(r => {
            const c = CLIENTS.find(cl => cl.slug === r.tenant);
            return (
              <div key={r.id} className="act-item">
                <div className={`act-dot ${dotClass(r.estado)}`} />
                <div className="act-body">
                  <div className="act-text">
                    <strong>{r.nombreCliente}</strong>
                    {r.notas ? ` → ${r.notas}` : ''}
                    <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px', borderRadius: 4, background: c?.colorBg, color: c?.color }}>{c?.name}</span>
                  </div>
                  <div className="act-time">
                    {r.fecha} · {r.hora} · <span style={{ color: statusColor(r.estado) }}>{r.estado}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
