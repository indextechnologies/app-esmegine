'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { CLIENTS } from '../../../lib/demo-data';
import { PlusIcon, CalIcon } from '../../../components/Icons';

type Reservation = {
  id: string; resumen: string; nombreCliente: string; email: string;
  telefono: string; estado: string; fecha: string; hora: string; notas: string;
};

const STATUS_LABEL: Record<string, string> = {
  Confirmada: 'Confirmada', Pendiente: 'Pendiente',
  Cancelada: 'Cancelada', Completada: 'Completada', 'No Show': 'No Show',
};
const STATUS_BADGE: Record<string, string> = {
  Confirmada: 'confirmed', Pendiente: 'pending',
  Cancelada: 'cancelled', Completada: 'confirmed', 'No Show': 'inactive',
};
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function fmtDate(d: string) {
  if (!d) return '';
  const [, m, day] = d.split('-');
  return `${+day} ${MONTHS[+m - 1]}`;
}

export default function ReservasPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const client = CLIENTS.find(c => c.slug === tenant);

  const [data, setData]     = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [fStatus, setFS]    = useState('all');
  const [q, setQ]           = useState('');
  const [view, setView]     = useState<'list' | 'cal'>('list');
  const [modal, setModal]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState('');
  const [form, setForm]     = useState({
    nombre: '', email: '', telefono: '', fecha: '', hora: '09:00', notas: '',
  });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/${tenant}/reservas`);
      setData(await res.json());
    } catch {
      showToast('Error cargando reservas');
    } finally {
      setLoading(false);
    }
  }, [tenant]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(id: string, estado: string) {
    try {
      await fetch(`/api/${tenant}/reservas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });
      setData(prev => prev.map(r => r.id === id ? { ...r, estado } : r));
      showToast('Estado actualizado');
    } catch {
      showToast('Error al actualizar');
    }
  }

  async function addReservation() {
    if (!form.nombre || !form.fecha) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/${tenant}/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const created = await res.json();
      const nr: Reservation = {
        id: created.id, resumen: `Reserva — ${form.nombre}`,
        nombreCliente: form.nombre, email: form.email, telefono: form.telefono,
        estado: 'Pendiente', fecha: form.fecha, hora: form.hora, notas: form.notas,
      };
      setData(prev => [nr, ...prev]);
      setModal(false);
      setForm({ nombre: '', email: '', telefono: '', fecha: '', hora: '09:00', notas: '' });
      showToast('Reserva creada');
    } catch {
      showToast('Error al crear reserva');
    } finally {
      setSaving(false);
    }
  }

  const filtered = data
    .filter(r => fStatus === 'all' || r.estado === fStatus)
    .filter(r => !q || r.nombreCliente.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora));

  const byDate = new Map<string, Reservation[]>();
  filtered.forEach(r => { const l = byDate.get(r.fecha) ?? []; l.push(r); byDate.set(r.fecha, l); });
  const calDays = Array.from(byDate.entries()).sort(([a],[b]) => a.localeCompare(b));

  const total     = data.length;
  const confirmed = data.filter(r => r.estado === 'Confirmada').length;
  const pending   = data.filter(r => r.estado === 'Pendiente').length;
  const cancelled = data.filter(r => r.estado === 'Cancelada').length;

  return (
    <>
      <div className="pg-title">Reservas</div>
      <div className="pg-sub">{client?.name} · {total} registros totales</div>

      <div className="stats-row">
        {[
          { l: 'Total',       v: total,     c: 'var(--accent-1)' },
          { l: 'Confirmadas', v: confirmed, c: 'var(--green)'    },
          { l: 'Pendientes',  v: pending,   c: 'var(--yellow)'   },
          { l: 'Canceladas',  v: cancelled, c: 'var(--red)'      },
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
          placeholder="Buscar cliente..."
          value={q} onChange={e => setQ(e.target.value)}
        />
        <select className="f-select" value={fStatus} onChange={e => setFS(e.target.value)}>
          <option value="all">Todos los estados</option>
          <option value="Confirmada">Confirmadas</option>
          <option value="Pendiente">Pendientes</option>
          <option value="Cancelada">Canceladas</option>
          <option value="Completada">Completadas</option>
        </select>
        <div style={{ display: 'flex', gap: 2, marginLeft: 4, background: 'var(--bg-elevated)', borderRadius: 8, padding: 2 }}>
          {(['list','cal'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: view === v ? 'var(--bg-hover)' : 'transparent',
              color: view === v ? 'var(--text-1)' : 'var(--text-2)',
              fontSize: 12, fontWeight: 600,
            }}>
              {v === 'list' ? 'Lista' : <><CalIcon size={12} /> Calendario</>}
            </button>
          ))}
        </div>
        <button className="btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setModal(true)}>
          <PlusIcon size={13} /> Nueva reserva
        </button>
      </div>

      {loading ? (
        <div className="empty" style={{ padding: 48 }}>Cargando desde Notion…</div>
      ) : view === 'list' ? (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Cliente</th><th>Fecha & Hora</th><th>Contacto</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="empty">Sin resultados</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.nombreCliente}</div>
                    {r.notas && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.notas}</div>}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{fmtDate(r.fecha)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.hora}</div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)' }}>
                    <div>{r.email}</div><div>{r.telefono}</div>
                  </td>
                  <td><span className={`badge badge-${STATUS_BADGE[r.estado] ?? 'pending'}`}>{STATUS_LABEL[r.estado] ?? r.estado}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {r.estado === 'Pendiente'  && <button className="abtn abtn-conf" onClick={() => changeStatus(r.id, 'Confirmada')}>Confirmar</button>}
                      {r.estado !== 'Cancelada'  && r.estado !== 'Completada' && <button className="abtn abtn-canc" onClick={() => changeStatus(r.id, 'Cancelada')}>Cancelar</button>}
                      {r.estado === 'Confirmada' && <button className="abtn abtn-edit" onClick={() => changeStatus(r.id, 'Completada')}>✓ Completar</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {calDays.length === 0 ? <div className="empty">Sin reservas</div> : calDays.map(([date, slots]) => (
            <div key={date} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <CalIcon size={13} />
                <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14 }}>{fmtDate(date)}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-2)' }}>{slots.length} reserva{slots.length !== 1 ? 's' : ''}</span>
              </div>
              {slots.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: 'var(--accent-1)', minWidth: 40 }}>{r.hora}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{r.nombreCliente}</div>
                    {r.notas && <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{r.notas}</div>}
                  </div>
                  <span className={`badge badge-${STATUS_BADGE[r.estado] ?? 'pending'}`}>{STATUS_LABEL[r.estado] ?? r.estado}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {r.estado === 'Pendiente'  && <button className="abtn abtn-conf" onClick={() => changeStatus(r.id, 'Confirmada')}>✓</button>}
                    {r.estado !== 'Cancelada'  && r.estado !== 'Completada' && <button className="abtn abtn-canc" onClick={() => changeStatus(r.id, 'Cancelada')}>✕</button>}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Modal nueva reserva */}
      <div className={`modal-ov ${modal ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setModal(false)}>
        <div className="modal">
          <div className="modal-hd">
            <div className="modal-title">Nueva Reserva</div>
            <button className="modal-x" onClick={() => setModal(false)}>✕</button>
          </div>
          <div className="m-row">
            <div className="field-group">
              <label className="field-label">Nombre</label>
              <input className="field-input" placeholder="Nombre del cliente" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div className="field-group">
              <label className="field-label">Email</label>
              <input className="field-input" type="email" placeholder="email@..." value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
          </div>
          <div className="m-row">
            <div className="field-group">
              <label className="field-label">Teléfono</label>
              <input className="field-input" placeholder="09XX XXX XXX" value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} />
            </div>
            <div className="field-group">
              <label className="field-label">Fecha</label>
              <input className="field-input" type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} />
            </div>
          </div>
          <div className="m-row">
            <div className="field-group">
              <label className="field-label">Hora</label>
              <select className="field-input" value={form.hora} onChange={e => setForm(p => ({ ...p, hora: e.target.value }))}>
                {['07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
                  '12:00','12:30','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00',
                  '20:30','21:00','21:30','22:00'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Notas</label>
              <input className="field-input" placeholder="Notas adicionales..." value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} />
            </div>
          </div>
          <div className="modal-foot">
            <button className="btn-sec" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={addReservation} disabled={saving}>
              {saving ? 'Creando…' : 'Crear Reserva'}
            </button>
          </div>
        </div>
      </div>

      <div className={`toast ${toast ? 'show' : ''}`}>
        <div className="toast-ic">✓</div>
        {toast}
      </div>
    </>
  );
}
