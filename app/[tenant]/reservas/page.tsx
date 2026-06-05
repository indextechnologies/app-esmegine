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
const MONTHS_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const TODAY = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD en hora local

function getMonthGrid(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay(); // 0=Dom
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstDow + 6) % 7; // Lunes=0
  const cells: (number | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

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
  const [calDate, setCalDate] = useState(() => { const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() }; });
  const [selDay, setSelDay]   = useState<string>(TODAY);
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

  // Métricas (adaptadas del dashboard del motor de reservas)
  const metrics = [
    { label: 'Total',       val: data.length,                                          color: 'var(--text-1)' },
    { label: 'Hoy',         val: data.filter(r => r.fecha === TODAY).length,           color: 'var(--accent-1)' },
    { label: 'Confirmadas', val: data.filter(r => r.estado === 'Confirmada').length,   color: 'var(--green)' },
    { label: 'Canceladas',  val: data.filter(r => r.estado === 'Cancelada').length,    color: 'var(--red)' },
  ];

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

      {/* Métricas */}
      <div className="a1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {metrics.map(m => (
          <div key={m.label} className="kpi-card">
            <div className="kpi-val" style={{ color: m.color }}>{m.val}</div>
            <div className="kpi-lbl">{m.label}</div>
          </div>
        ))}
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
        <div className="empty" style={{ padding: 48 }}>Cargando…</div>
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
      ) : (() => {
        const cells = getMonthGrid(calDate.year, calDate.month);
        const dayRes = byDate.get(selDay) ?? [];
        function prevMonth() { const d = new Date(calDate.year, calDate.month - 1); setCalDate({ year: d.getFullYear(), month: d.getMonth() }); }
        function nextMonth() { const d = new Date(calDate.year, calDate.month + 1); setCalDate({ year: d.getFullYear(), month: d.getMonth() }); }
        return (
          <div className="card a2" style={{ padding: 16 }}>
            {/* Month nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <button className="abtn abtn-edit" onClick={prevMonth} style={{ fontSize: 16, padding: '4px 10px' }}>‹</button>
              <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15 }}>{MONTHS_FULL[calDate.month]} {calDate.year}</span>
              <button className="abtn abtn-edit" onClick={nextMonth} style={{ fontSize: 16, padding: '4px 10px' }}>›</button>
            </div>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 4 }}>
              {['Lu','Ma','Mi','Ju','Vi','Sá','Do'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-2)', padding: '2px 0' }}>{d}</div>
              ))}
            </div>
            {/* Day cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const mm = String(calDate.month + 1).padStart(2, '0');
                const dd = String(day).padStart(2, '0');
                const dateStr = `${calDate.year}-${mm}-${dd}`;
                const count = byDate.get(dateStr)?.length ?? 0;
                const isToday = dateStr === TODAY;
                const isSel = dateStr === selDay;
                return (
                  <button
                    key={i}
                    onClick={() => setSelDay(dateStr)}
                    style={{
                      padding: '6px 2px', borderRadius: 6, border: isSel ? '2px solid var(--accent-1)' : '1px solid var(--border)',
                      background: isSel ? 'var(--accent-1)' : isToday ? 'rgba(99,102,241,.12)' : 'var(--bg-elevated)',
                      color: isSel ? 'white' : 'var(--text-1)', fontSize: 12, fontWeight: count > 0 ? 700 : 400,
                      cursor: 'pointer', textAlign: 'center', lineHeight: 1,
                    }}
                  >
                    {day}
                    {count > 0 && (
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: isSel ? 'rgba(255,255,255,.8)' : 'var(--accent-1)', margin: '3px auto 0' }} />
                    )}
                  </button>
                );
              })}
            </div>
            {/* Selected day list */}
            <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <CalIcon size={13} />
                <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14 }}>{fmtDate(selDay)}</span>
                {selDay === TODAY && <span className="pending-pill" style={{ marginLeft: 0, background: 'rgba(99,102,241,.15)', color: 'var(--accent-1)' }}>Hoy</span>}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-2)' }}>{dayRes.length} reserva{dayRes.length !== 1 ? 's' : ''}</span>
              </div>
              {dayRes.length === 0 ? (
                <div className="empty" style={{ padding: 24 }}>Sin reservas este día</div>
              ) : dayRes.sort((a,b) => a.hora.localeCompare(b.hora)).map(r => (
                <div key={r.id} className="res-row" style={{ padding: '10px 0' }}>
                  <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: 'var(--accent-1)', minWidth: 42, flexShrink: 0 }}>{r.hora}</span>
                  <div className="res-info">
                    <div className="res-name">{r.nombreCliente}</div>
                    {r.notas && <div className="res-meta">{r.notas}</div>}
                  </div>
                  <div className="res-acts">
                    <span className={`badge badge-${STATUS_BADGE[r.estado] ?? 'pending'}`}>{STATUS_LABEL[r.estado] ?? r.estado}</span>
                    {r.estado === 'Pendiente' && <button className="abtn abtn-conf" onClick={() => changeStatus(r.id, 'Confirmada')}>✓</button>}
                    {r.estado !== 'Cancelada' && r.estado !== 'Completada' && <button className="abtn abtn-canc" onClick={() => changeStatus(r.id, 'Cancelada')}>✕</button>}
                    {r.estado === 'Confirmada' && <button className="abtn abtn-edit" onClick={() => changeStatus(r.id, 'Completada')} style={{ fontSize: 10 }}>✓✓</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

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
