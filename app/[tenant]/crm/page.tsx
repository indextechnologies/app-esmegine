'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { CLIENTS, CRM_CONTACTS, RESERVATIONS, type CRMContact } from '../../../lib/demo-data';
import { PlusIcon, EditIcon } from '../../../components/Icons';

export default function CRMPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const client = CLIENTS.find(c => c.slug === tenant);
  const base   = CRM_CONTACTS[tenant as string] ?? [];

  const [contacts, setContacts] = useState<CRMContact[]>([...base]);
  const [q, setQ]               = useState('');
  const [selected, setSelected] = useState<CRMContact | null>(null);
  const [modal, setModal]       = useState(false);
  const [toast, setToast]       = useState('');
  const [form, setForm]         = useState({ name:'', email:'', phone:'', notes:'' });

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  const filtered = contacts.filter(c =>
    !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.email.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q)
  );

  function addContact() {
    if (!form.name) return;
    setContacts(prev => [...prev, {
      id: Date.now(), name: form.name, email: form.email,
      phone: form.phone, visits: 1, lastVisit: new Date().toISOString().slice(0,10),
      totalSpent: 'Gs 0', notes: form.notes,
    }]);
    setModal(false);
    setForm({ name:'', email:'', phone:'', notes:'' });
    showToast('Contacto agregado');
  }

  // Get reservation history for selected contact
  const history = selected
    ? RESERVATIONS.filter(r => r.tenant === tenant && r.client.toLowerCase() === selected.name.toLowerCase())
    : [];

  return (
    <>
      <div className="pg-title">Clientes (CRM)</div>
      <div className="pg-sub">{client?.name} · {contacts.length} contactos registrados</div>

      {/* Summary */}
      <div className="stats-row" style={{ gridTemplateColumns:'repeat(3,1fr)' }}>
        {[
          { l:'Total contactos', v:contacts.length,     c:'var(--accent-1)' },
          { l:'Clientes VIP',    v:contacts.filter(c=>c.visits>=8).length, c:'var(--yellow)' },
          { l:'Nuevos (1 visita)', v:contacts.filter(c=>c.visits<=1).length, c:'var(--green)' },
        ].map(s => (
          <div key={s.l} className="stat-card">
            <div className="stat-val" style={{ color:s.c }}>{s.v}</div>
            <div className="stat-lbl">{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 320px' : '1fr', gap:14 }}>
        {/* Contact list */}
        <div>
          <div className="filters">
            <input
              className="field-input" style={{ width:240 }}
              placeholder="Buscar por nombre, email o teléfono..."
              value={q} onChange={e => setQ(e.target.value)}
            />
            <button className="btn-primary" style={{ marginLeft:'auto' }} onClick={() => setModal(true)}>
              <PlusIcon size={13} /> Agregar contacto
            </button>
          </div>

          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Contacto</th>
                  <th>Visitas</th>
                  <th>Última visita</th>
                  <th>Total</th>
                  <th>Notas</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="empty">Sin contactos</td></tr>
                ) : filtered.map(c => (
                  <tr key={c.id} style={{ cursor:'pointer' }} onClick={() => setSelected(c === selected ? null : c)}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                        <div style={{ width:30, height:30, borderRadius:'50%', background:'var(--bg-elevated)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'var(--accent-1)', flexShrink:0 }}>
                          {c.name.slice(0,1).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:600 }}>{c.name}</div>
                          {c.visits >= 8 && <span style={{ fontSize:9.5, background:'rgba(245,158,11,.15)', color:'var(--yellow)', padding:'1px 5px', borderRadius:4, fontWeight:700 }}>VIP</span>}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize:12, color:'var(--text-2)' }}>
                      <div>{c.email}</div>
                      <div>{c.phone}</div>
                    </td>
                    <td><strong style={{ color:'var(--accent-1)' }}>{c.visits}</strong></td>
                    <td style={{ fontSize:12, color:'var(--text-2)' }}>{c.lastVisit}</td>
                    <td style={{ fontWeight:600, fontSize:12 }}>{c.totalSpent}</td>
                    <td style={{ fontSize:12, color:'var(--text-3)' }}>{c.notes || '—'}</td>
                    <td>
                      <button className="abtn abtn-edit" onClick={e => { e.stopPropagation(); setSelected(c); }}>
                        <EditIcon size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Contact detail panel */}
        {selected && (
          <div className="card" style={{ height:'fit-content', position:'sticky', top:80 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <div>
                <div style={{ width:48, height:48, borderRadius:'50%', background:'var(--accent-grad)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:'white', marginBottom:10 }}>
                  {selected.name.slice(0,1).toUpperCase()}
                </div>
                <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:16 }}>{selected.name}</div>
                {selected.visits >= 8 && <span style={{ fontSize:10, background:'rgba(245,158,11,.15)', color:'var(--yellow)', padding:'2px 7px', borderRadius:20, fontWeight:700, marginTop:4, display:'inline-block' }}>★ Cliente VIP</span>}
              </div>
              <button className="abtn abtn-edit" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:12.5, marginBottom:16 }}>
              {[
                ['📧', selected.email],
                ['📱', selected.phone],
                ['📅', `Última visita: ${selected.lastVisit}`],
                ['🔁', `${selected.visits} visitas totales`],
                ['💰', selected.totalSpent],
              ].map(([ic, v]) => (
                <div key={ic} style={{ display:'flex', gap:8, color:'var(--text-2)' }}>
                  <span>{ic}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>

            {selected.notes && (
              <div style={{ padding:'8px 10px', background:'var(--bg-elevated)', borderRadius:8, fontSize:12, color:'var(--text-2)', marginBottom:16 }}>
                📋 {selected.notes}
              </div>
            )}

            <div>
              <div style={{ fontFamily:'Syne', fontWeight:700, fontSize:12, marginBottom:8, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em' }}>
                Historial de reservas
              </div>
              {history.length === 0 ? (
                <div style={{ fontSize:12, color:'var(--text-3)' }}>Sin registros en el sistema</div>
              ) : history.map(r => (
                <div key={r.id} style={{ padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:12 }}>
                  <div style={{ fontWeight:600 }}>{r.service}</div>
                  <div style={{ color:'var(--text-3)' }}>{r.date} · {r.time}</div>
                  <span className={`badge badge-${r.status}`} style={{ marginTop:3, display:'inline-flex' }}>
                    {r.status === 'confirmed' ? 'Confirmada' : r.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal add contact */}
      <div className={`modal-ov ${modal ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setModal(false)}>
        <div className="modal">
          <div className="modal-hd">
            <div className="modal-title">Nuevo Contacto</div>
            <button className="modal-x" onClick={() => setModal(false)}>✕</button>
          </div>
          <div className="m-row">
            <div className="field-group">
              <label className="field-label">Nombre</label>
              <input className="field-input" placeholder="Nombre completo" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} />
            </div>
            <div className="field-group">
              <label className="field-label">Teléfono</label>
              <input className="field-input" placeholder="09XX XXX XXX" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Email</label>
            <input className="field-input" type="email" placeholder="email@..." value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} />
          </div>
          <div className="field-group">
            <label className="field-label">Notas</label>
            <input className="field-input" placeholder="Preferencias, alergias, notas..." value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} />
          </div>
          <div className="modal-foot">
            <button className="btn-sec" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={addContact}>Agregar</button>
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
