'use client';
import { useState } from 'react';
import { RESERVATIONS, CLIENTS, type Reservation } from '../../../lib/demo-data';
import { PlusIcon } from '../../../components/Icons';

const STATUS_LABEL: Record<string, string> = { confirmed: 'Confirmada', pending: 'Pendiente', cancelled: 'Cancelada' };

export default function AdminReservasPage() {
  const [data, setData]   = useState<Reservation[]>([...RESERVATIONS]);
  const [fStatus, setFS]  = useState('all');
  const [fTenant, setFT]  = useState('all');
  const [q, setQ]         = useState('');

  const filtered = data
    .filter(r => fStatus === 'all' || r.status === fStatus)
    .filter(r => fTenant === 'all' || r.tenant === fTenant)
    .filter(r => !q || r.client.toLowerCase().includes(q.toLowerCase()) || r.service.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

  function setStatus(id: number, st: 'confirmed' | 'cancelled') {
    setData(prev => prev.map(r => r.id === id ? { ...r, status: st } : r));
  }

  const total     = data.length;
  const pending   = data.filter(r => r.status === 'pending').length;
  const confirmed = data.filter(r => r.status === 'confirmed').length;
  const cancelled = data.filter(r => r.status === 'cancelled').length;

  return (
    <>
      <div className="pg-title">Reservas Globales</div>
      <div className="pg-sub">Todas las reservas de todos los clientes · {total} registros</div>

      <div className="stats-row">
        {[
          { l:'Total',       v:total,     c:'var(--accent-1)' },
          { l:'Confirmadas', v:confirmed, c:'var(--green)'    },
          { l:'Pendientes',  v:pending,   c:'var(--yellow)'   },
          { l:'Canceladas',  v:cancelled, c:'var(--red)'      },
        ].map(s => (
          <div key={s.l} className="stat-card">
            <div className="stat-val" style={{ color: s.c }}>{s.v}</div>
            <div className="stat-lbl">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="filters">
        <input
          className="field-input" style={{ width: 220 }}
          placeholder="Buscar cliente o servicio..."
          value={q} onChange={e => setQ(e.target.value)}
        />
        <select className="f-select" value={fStatus} onChange={e => setFS(e.target.value)}>
          <option value="all">Todos los estados</option>
          <option value="confirmed">Confirmadas</option>
          <option value="pending">Pendientes</option>
          <option value="cancelled">Canceladas</option>
        </select>
        <select className="f-select" value={fTenant} onChange={e => setFT(e.target.value)}>
          <option value="all">Todos los clientes</option>
          {CLIENTS.map(c => <option key={c.slug} value={c.slug}>{c.emoji} {c.name}</option>)}
        </select>
        <button className="btn-primary" style={{ marginLeft: 'auto' }}>
          <PlusIcon size={13} /> Nueva reserva
        </button>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Negocio</th>
              <th>Servicio</th>
              <th>Fecha & Hora</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="empty">Sin resultados</td></tr>
            ) : filtered.map(r => {
              const c = CLIENTS.find(cl => cl.slug === r.tenant);
              return (
                <tr key={r.id}>
                  <td style={{ color: 'var(--text-3)', fontSize: 11 }}>#{r.id}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.client}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.email}</div>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 5, background: c?.colorBg, color: c?.color }}>
                      {c?.emoji} {c?.name}
                    </span>
                  </td>
                  <td>{r.service}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.date}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.time}</div>
                  </td>
                  <td><span className={`badge badge-${r.status}`}>{STATUS_LABEL[r.status]}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {r.status === 'pending' && <button className="abtn abtn-conf" onClick={() => setStatus(r.id, 'confirmed')}>Confirmar</button>}
                      {r.status !== 'cancelled' && <button className="abtn abtn-canc" onClick={() => setStatus(r.id, 'cancelled')}>Cancelar</button>}
                      <button className="abtn abtn-edit">Ver</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
