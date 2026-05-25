'use client';
import { useState, useEffect, useCallback } from 'react';
import { useClients } from '../../../lib/use-clients';
import { PlusIcon } from '../../../components/Icons';

type LiveRes = {
  id: string; nombreCliente: string; email: string; telefono: string;
  estado: string; fecha: string; hora: string; notas: string; tenant: string;
};

const STATUS_BADGE: Record<string, string> = {
  Confirmada: 'confirmed', Pendiente: 'pending',
  Cancelada:  'cancelled', Completada: 'confirmed', 'No Show': 'inactive',
};

export default function AdminReservasPage() {
  const [data, setData]     = useState<LiveRes[]>([]);
  const [loading, setLoading] = useState(true);
  const [fStatus, setFS]    = useState('all');
  const [fTenant, setFT]    = useState('all');
  const [q, setQ]           = useState('');
  const [toast, setToast]   = useState('');

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  const { clients } = useClients();

  const load = useCallback(async () => {
    if (!clients.length) return;
    setLoading(true);
    try {
      const results = await Promise.all(
        clients.map(c =>
          fetch(`/api/${c.slug}/reservas`)
            .then(r => r.ok ? r.json() : [])
            .then((rows: Omit<LiveRes, 'tenant'>[]) => rows.map(r => ({ ...r, tenant: c.slug })))
            .catch(() => [] as LiveRes[])
        )
      );
      setData(results.flat());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, clients]);

  async function changeStatus(id: string, tenant: string, estado: string) {
    try {
      await fetch(`/api/${tenant}/reservas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });
      setData(prev => prev.map(r => r.id === id ? { ...r, estado } : r));
      showToast('Estado actualizado');
    } catch { showToast('Error al actualizar'); }
  }

  const filtered = data
    .filter(r => fStatus === 'all' || r.estado === fStatus)
    .filter(r => fTenant === 'all' || r.tenant === fTenant)
    .filter(r => !q || r.nombreCliente.toLowerCase().includes(q.toLowerCase()) || r.notas.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora));

  const total     = data.length;
  const pending   = data.filter(r => r.estado === 'Pendiente').length;
  const confirmed = data.filter(r => r.estado === 'Confirmada' || r.estado === 'Completada').length;
  const cancelled = data.filter(r => r.estado === 'Cancelada').length;

  return (
    <>
      <div className="pg-title">Reservas Globales</div>
      <div className="pg-sub">Todas las reservas · {loading ? '…' : `${total} en total`}</div>

      <div className="stats-row">
        {[
          { l:'Total',       v: loading ? '…' : total,     c:'var(--accent-1)' },
          { l:'Confirmadas', v: loading ? '…' : confirmed, c:'var(--green)'    },
          { l:'Pendientes',  v: loading ? '…' : pending,   c:'var(--yellow)'   },
          { l:'Canceladas',  v: loading ? '…' : cancelled, c:'var(--red)'      },
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
          placeholder="Buscar cliente o notas..."
          value={q} onChange={e => setQ(e.target.value)}
        />
        <select className="f-select" value={fStatus} onChange={e => setFS(e.target.value)}>
          <option value="all">Todos los estados</option>
          <option value="Confirmada">Confirmadas</option>
          <option value="Pendiente">Pendientes</option>
          <option value="Cancelada">Canceladas</option>
          <option value="Completada">Completadas</option>
        </select>
        <select className="f-select" value={fTenant} onChange={e => setFT(e.target.value)}>
          <option value="all">Todos los clientes</option>
          {clients.map(c => <option key={c.slug} value={c.slug}>{c.emoji} {c.name}</option>)}
        </select>
        <button className="btn-primary" style={{ marginLeft: 'auto' }} onClick={load}>
          <PlusIcon size={13} style={{ transform: 'rotate(45deg)' }} /> Actualizar
        </button>
      </div>

      {loading ? (
        <div className="empty" style={{ padding: 48 }}>Cargando desde Notion…</div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Negocio</th>
                <th>Notas</th>
                <th>Fecha & Hora</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="empty">Sin resultados</td></tr>
              ) : filtered.map(r => {
                const c = clients.find(cl => cl.slug === r.tenant);
                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.nombreCliente}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.email || r.telefono}</div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 5, background: c?.colorBg, color: c?.color }}>
                        {c?.emoji} {c?.name}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12, maxWidth: 200 }}>{r.notas || '—'}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.fecha}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.hora}</div>
                    </td>
                    <td><span className={`badge badge-${STATUS_BADGE[r.estado] ?? 'pending'}`}>{r.estado}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {r.estado === 'Pendiente'  && <button className="abtn abtn-conf" onClick={() => changeStatus(r.id, r.tenant, 'Confirmada')}>✓ Confirmar</button>}
                        {r.estado === 'Confirmada' && <button className="abtn abtn-edit" onClick={() => changeStatus(r.id, r.tenant, 'Completada')} style={{ fontSize: 10 }}>✓✓ Completar</button>}
                        {r.estado !== 'Cancelada'  && r.estado !== 'Completada' && (
                          <button className="abtn abtn-canc" onClick={() => changeStatus(r.id, r.tenant, 'Cancelada')}>✕</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className={`toast ${toast ? 'show' : ''}`}>
        <div className="toast-ic">✓</div>
        {toast}
      </div>
    </>
  );
}
