'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useClient } from '../../../lib/use-clients';
import { PlusIcon, CalIcon } from '../../../components/Icons';

type Reservation = {
  id: string; resumen: string; nombreCliente: string; email: string;
  telefono: string; estado: string; fecha: string; hora: string; notas: string;
};

const STATUS_LABEL: Record<string, string> = {
  Confirmada: 'Confirmada', Pendiente: 'Pendiente',
  Cancelada:  'Cancelada',  Completada: 'Completada', 'No Show': 'No Show',
};
const STATUS_BADGE: Record<string, string> = {
  Confirmada: 'confirmed', Pendiente: 'pending',
  Cancelada:  'cancelled', Completada: 'confirmed', 'No Show': 'inactive',
};
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function fmtDate(d: string) {
  if (!d) return '';
  const [, m, day] = d.split('-');
  return `${+day} ${MONTHS[+m - 1]}`;
}

const CHIPS = [
  { val: 'all',        label: 'Todas'       },
  { val: 'Pendiente',  label: 'Pendientes'  },
  { val: 'Confirmada', label: 'Confirmadas' },
  { val: 'Completada', label: 'Completadas' },
  { val: 'Cancelada',  label: 'Canceladas'  },
];

export default function ReservasPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const { client } = useClient(tenant);

  const [data, setData]       = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [fStatus, setFS]      = useState('all');
  const [q, setQ]             = useState('');
  const [view, setView]       = useState<'list' | 'cal'>('list');
  const [modal, setModal]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState('');
  const [form, setForm]       = useState({
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
      setData(prev => [{
        id: created.id, resumen: `Reserva — ${form.nombre}`,
        nombreCliente: form.nombre, email: form.email, telefono: form.telefono,
        estado: 'Pendiente', fecha: form.fecha, hora: form.hora, notas: form.notas,
      }, ...prev]);
      setModal(false);
      setForm({ nombre: '', email: '', telefono: '', fecha: '', hora: '09:00', notas: '' });
      showToast('Reserva creada ✓');
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
  const calDays = Array.from(byDate.entries()).sort(([a],[b]) => b.localeCompare(a));

  const pending = data.filter(r => r.estado === 'Pendiente').length;

  return (
    <>
      {/* Header */}
      <div className="res-page-hd a1">
        <div>
          <div className="pg-title">Reservas</div>
          <div className="pg-sub" style={{ marginBottom: 0 }}>
            {client?.name} · {data.length} total
            {pending > 0 && (
              <span className="pending-pill">{pending} pendiente{pending !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)} style={{ flexShrink: 0 }}>
          <PlusIcon size={13} /> Nueva
        </button>
      </div>

      {/* View toggle */}
      <div className="view-toggle a2">
        {(['list', 'cal'] as const).map(v => (
          <button
            key={v}
            className={`vt-btn ${view === v ? 'active' : ''}`}
            onClick={() => setView(v)}
          >
            {v === 'list' ? '☰ Lista' : <><CalIcon size={12} /> Calendario</>}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="a2" style={{ marginBottom: 10 }}>
        <input
          className="field-input"
          placeholder="Buscar por nombre..."
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      {/* Status chips */}
      <div className="chip-row a2">
        {CHIPS.map(c => (
          <button
            key={c.val}
            className={`chip ${fStatus === c.val ? 'chip-active' : ''}`}
            onClick={() => setFS(c.val)}
          >
            {c.label}
            {c.val === 'Pendiente' && pending > 0 && (
              <span className="chip-count">{pending}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="empty" style={{ padding: 48 }}>Cargando desde Notion…</div>
      ) : view === 'list' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div className="empty">Sin resultados</div>
          ) : (
            <div className="stagger" style={{ padding: '0 16px' }}>
              {filtered.map(r => (
                <div key={r.id} className="res-row">
                  <div className="res-av">{r.nombreCliente.slice(0, 2).toUpperCase()}</div>
                  <div className="res-info">
                    <div className="res-name">{r.nombreCliente}</div>
                    <div className="res-meta">
                      {fmtDate(r.fecha)} · {r.hora}
                      {r.notas ? ` · ${r.notas}` : ''}
                    </div>
                  </div>
                  <div className="res-acts">
                    <span className={`badge badge-${STATUS_BADGE[r.estado] ?? 'pending'}`}>
                      {STATUS_LABEL[r.estado] ?? r.estado}
                    </span>
                    {r.estado === 'Pendiente' && (
                      <button className="abtn abtn-conf" onClick={() => changeStatus(r.id, 'Confirmada')} title="Confirmar">✓</button>
                    )}
                    {r.estado !== 'Cancelada' && r.estado !== 'Completada' && (
                      <button className="abtn abtn-canc" onClick={() => changeStatus(r.id, 'Cancelada')} title="Cancelar">✕</button>
                    )}
                    {r.estado === 'Confirmada' && (
                      <button className="abtn abtn-edit" onClick={() => changeStatus(r.id, 'Completada')} title="Completar" style={{ fontSize: 10 }}>✓✓</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {calDays.length === 0 ? (
            <div className="empty">Sin reservas</div>
          ) : calDays.map(([date, slots]) => (
            <div key={date} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <CalIcon size={13} />
                <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14 }}>{fmtDate(date)}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-2)' }}>
                  {slots.length} reserva{slots.length !== 1 ? 's' : ''}
                </span>
              </div>
              {slots.map(r => (
                <div key={r.id} className="res-row" style={{ padding: '10px 16px' }}>
                  <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: 'var(--accent-1)', minWidth: 40, flexShrink: 0 }}>
                    {r.hora}
                  </span>
                  <div className="res-info">
                    <div className="res-name">{r.nombreCliente}</div>
                    {r.notas && <div className="res-meta">{r.notas}</div>}
                  </div>
                  <div className="res-acts">
                    <span className={`badge badge-${STATUS_BADGE[r.estado] ?? 'pending'}`}>
                      {STATUS_LABEL[r.estado] ?? r.estado}
                    </span>
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
              <label className="field-label">Nombre *</label>
              <input className="field-input" placeholder="Nombre del cliente" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div className="field-group">
              <label className="field-label">Teléfono</label>
              <input className="field-input" placeholder="09XX XXX XXX" inputMode="tel" value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} />
            </div>
          </div>
          <div className="m-row">
            <div className="field-group">
              <label className="field-label">Fecha *</label>
              <input className="field-input" type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} />
            </div>
            <div className="field-group">
              <label className="field-label">Hora</label>
              <input className="field-input" type="time" value={form.hora} onChange={e => setForm(p => ({ ...p, hora: e.target.value }))} />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Email</label>
            <input className="field-input" type="email" placeholder="email@..." inputMode="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="field-group">
            <label className="field-label">Notas</label>
            <textarea className="field-input" placeholder="Motivo, ocasión especial..." value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} rows={2} style={{ resize: 'none' }} />
          </div>
          <div className="modal-foot">
            <button className="btn-sec" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={addReservation} disabled={saving || !form.nombre || !form.fecha}>
              {saving ? 'Guardando…' : '✓ Guardar'}
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
