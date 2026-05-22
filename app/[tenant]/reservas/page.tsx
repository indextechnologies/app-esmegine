'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { CLIENTS, RESERVATIONS, type Reservation } from '../../../lib/demo-data';
import { PlusIcon, CalIcon } from '../../../components/Icons';

const STATUS_LABEL: Record<string, string> = { confirmed: 'Confirmada', pending: 'Pendiente', cancelled: 'Cancelada' };
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function fmtDate(d: string) {
  const [, m, day] = d.split('-');
  return `${+day} ${MONTHS[+m - 1]}`;
}

export default function ReservasPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const client     = CLIENTS.find(c => c.slug === tenant);
  const base       = RESERVATIONS.filter(r => r.tenant === tenant);

  const [data, setData]   = useState<Reservation[]>([...base]);
  const [fStatus, setFS]  = useState('all');
  const [q, setQ]         = useState('');
  const [view, setView]   = useState<'list' | 'cal'>('list');
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({ client:'', email:'', phone:'', service:'', date:'', time:'09:00', notes:'' });

  const services = client ? Array.from(new Set(base.map(r => r.service))) : [];

  const filtered = data
    .filter(r => fStatus === 'all' || r.status === fStatus)
    .filter(r => !q || r.client.toLowerCase().includes(q.toLowerCase()) || r.service.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

  function setStatus(id: number, st: 'confirmed' | 'cancelled') {
    setData(prev => prev.map(r => r.id === id ? { ...r, status: st } : r));
  }

  function addReservation() {
    if (!form.client || !form.date) return;
    const nr: Reservation = {
      id: Date.now(), client: form.client, email: form.email, phone: form.phone,
      service: form.service || services[0] || 'Servicio', date: form.date,
      time: form.time, status: 'pending', notes: form.notes, tenant: tenant as string,
    };
    setData(prev => [nr, ...prev]);
    setModal(false);
    setForm({ client:'', email:'', phone:'', service:'', date:'', time:'09:00', notes:'' });
  }

  // Calendar view: group by date
  const byDate = new Map<string, Reservation[]>();
  filtered.forEach(r => {
    const list = byDate.get(r.date) ?? [];
    list.push(r);
    byDate.set(r.date, list);
  });
  const calDays = Array.from(byDate.entries()).sort(([a],[b]) => a.localeCompare(b));

  const total     = data.length;
  const confirmed = data.filter(r => r.status === 'confirmed').length;
  const pending   = data.filter(r => r.status === 'pending').length;
  const cancelled = data.filter(r => r.status === 'cancelled').length;

  return (
    <>
      <div className="pg-title">Reservas</div>
      <div className="pg-sub">{client?.name} · {total} registros totales</div>

      <div className="stats-row">
        {[
          { l:'Total', v:total, c:'var(--accent-1)' },
          { l:'Confirmadas', v:confirmed, c:'var(--green)' },
          { l:'Pendientes', v:pending, c:'var(--yellow)' },
          { l:'Canceladas', v:cancelled, c:'var(--red)' },
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
        <div style={{ display:'flex', gap:2, marginLeft: 4, background:'var(--bg-elevated)', borderRadius:8, padding:2 }}>
          {(['list','cal'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding:'5px 12px', borderRadius:6, border:'none', cursor:'pointer',
                background: view === v ? 'var(--bg-hover)' : 'transparent',
                color: view === v ? 'var(--text-1)' : 'var(--text-2)',
                fontSize:12, fontWeight:600,
              }}
            >
              {v === 'list' ? 'Lista' : <><CalIcon size={12} /> Calendario</>}
            </button>
          ))}
        </div>
        <button className="btn-primary" style={{ marginLeft:'auto' }} onClick={() => setModal(true)}>
          <PlusIcon size={13} /> Nueva reserva
        </button>
      </div>

      {view === 'list' ? (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Fecha & Hora</th>
                <th>Contacto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="empty">Sin resultados</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.client}</div>
                    {r.notes && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.notes}</div>}
                  </td>
                  <td>{r.service}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{fmtDate(r.date)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.time}</div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)' }}>
                    <div>{r.email}</div>
                    <div>{r.phone}</div>
                  </td>
                  <td><span className={`badge badge-${r.status}`}>{STATUS_LABEL[r.status]}</span></td>
                  <td>
                    <div style={{ display:'flex', gap:4 }}>
                      {r.status === 'pending'    && <button className="abtn abtn-conf" onClick={() => setStatus(r.id,'confirmed')}>Confirmar</button>}
                      {r.status !== 'cancelled'  && <button className="abtn abtn-canc" onClick={() => setStatus(r.id,'cancelled')}>Cancelar</button>}
                      <button className="abtn abtn-edit">Ver</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {calDays.length === 0 ? <div className="empty">Sin reservas</div> : calDays.map(([date, slots]) => (
            <div key={date} className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ padding:'10px 16px', background:'var(--bg-elevated)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
                <CalIcon size={13} />
                <span style={{ fontFamily:'Syne', fontWeight:700, fontSize:14 }}>{fmtDate(date)}</span>
                <span style={{ fontSize:11, color:'var(--text-3)', marginLeft:4 }}>{date}</span>
                <span style={{ marginLeft:'auto', fontSize:11, color:'var(--text-2)' }}>{slots.length} reserva{slots.length !== 1 ? 's' : ''}</span>
              </div>
              {slots.map(r => (
                <div key={r.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontFamily:'Syne', fontWeight:700, fontSize:13, color:'var(--accent-1)', minWidth:40 }}>{r.time}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:13 }}>{r.client}</div>
                    <div style={{ fontSize:11, color:'var(--text-2)' }}>{r.service}</div>
                  </div>
                  <span className={`badge badge-${r.status}`}>{STATUS_LABEL[r.status]}</span>
                  <div style={{ display:'flex', gap:4 }}>
                    {r.status === 'pending'   && <button className="abtn abtn-conf" onClick={() => setStatus(r.id,'confirmed')}>✓</button>}
                    {r.status !== 'cancelled' && <button className="abtn abtn-canc" onClick={() => setStatus(r.id,'cancelled')}>✕</button>}
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
              <input className="field-input" placeholder="Nombre del cliente" value={form.client} onChange={e => setForm(p => ({...p, client:e.target.value}))} />
            </div>
            <div className="field-group">
              <label className="field-label">Email</label>
              <input className="field-input" type="email" placeholder="email@..." value={form.email} onChange={e => setForm(p => ({...p, email:e.target.value}))} />
            </div>
          </div>
          <div className="m-row">
            <div className="field-group">
              <label className="field-label">Teléfono</label>
              <input className="field-input" placeholder="09XX XXX XXX" value={form.phone} onChange={e => setForm(p => ({...p, phone:e.target.value}))} />
            </div>
            <div className="field-group">
              <label className="field-label">Servicio</label>
              <select className="field-input" value={form.service} onChange={e => setForm(p => ({...p, service:e.target.value}))}>
                {services.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="m-row">
            <div className="field-group">
              <label className="field-label">Fecha</label>
              <input className="field-input" type="date" value={form.date} onChange={e => setForm(p => ({...p, date:e.target.value}))} />
            </div>
            <div className="field-group">
              <label className="field-label">Hora</label>
              <select className="field-input" value={form.time} onChange={e => setForm(p => ({...p, time:e.target.value}))}>
                {['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','20:30','21:00','21:30','22:00'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Notas</label>
            <input className="field-input" placeholder="Notas adicionales..." value={form.notes} onChange={e => setForm(p => ({...p, notes:e.target.value}))} />
          </div>
          <div className="modal-foot">
            <button className="btn-sec" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={addReservation}>Crear Reserva</button>
          </div>
        </div>
      </div>
    </>
  );
}
