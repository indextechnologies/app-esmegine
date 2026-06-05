'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useClient } from '../../../lib/use-clients';
import { PlusIcon, EditIcon, TrashIcon } from '../../../components/Icons';

type Contacto = {
  id: string; nombre: string; email: string; telefono: string;
  notas: string; etiquetas: string[]; totalVisitas: number;
  ultimaVisita: string; primeraVisita: string;
};

const ETIQUETA_STYLE: Record<string, { bg: string; color: string }> = {
  VIP:      { bg: 'rgba(245,158,11,.15)', color: '#f59e0b' },
  Frecuente:{ bg: 'rgba(16,185,129,.12)', color: '#10b981' },
  Nuevo:    { bg: 'rgba(99,102,241,.12)', color: '#818cf8' },
  Inactivo: { bg: 'rgba(107,114,128,.12)', color: '#6b7280' },
};
const ETIQUETAS_ALL = ['VIP', 'Frecuente', 'Nuevo', 'Inactivo'];

export default function CRMPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const { client } = useClient(tenant);

  const [data, setData]       = useState<Contacto[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ]             = useState('');
  const [selected, setSelected] = useState<Contacto | null>(null);
  const [modal, setModal]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState('');
  const [form, setForm]       = useState({ nombre: '', email: '', telefono: '', notas: '', etiquetas: [] as string[] });

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/${tenant}/contactos`);
      setData(await res.json());
    } catch { showToast('Error cargando contactos'); }
    finally { setLoading(false); }
  }, [tenant]);

  useEffect(() => { load(); }, [load]);

  async function saveContact() {
    if (!form.nombre) return;
    setSaving(true);
    try {
      if (selected) {
        await fetch(`/api/${tenant}/contactos/${selected.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        });
        setData(prev => prev.map(c => c.id === selected.id ? { ...c, ...form } : c));
        setSelected(null);
        showToast('Contacto actualizado');
      } else {
        const res = await fetch(`/api/${tenant}/contactos`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        });
        const created = await res.json();
        const today = new Date().toISOString().slice(0, 10);
        setData(prev => [{ id: created.id, totalVisitas: 1, ultimaVisita: today, primeraVisita: today, ...form }, ...prev]);
        showToast('Contacto agregado');
      }
    } catch { showToast('Error al guardar'); }
    finally {
      setSaving(false); setModal(false);
      setForm({ nombre: '', email: '', telefono: '', notas: '', etiquetas: [] });
    }
  }

  async function deleteContact(id: string) {
    if (!confirm('¿Eliminar este contacto?')) return;
    try {
      await fetch(`/api/${tenant}/contactos/${id}`, { method: 'DELETE' });
      setData(prev => prev.filter(c => c.id !== id));
      if (selected?.id === id) setSelected(null);
      showToast('Eliminado');
    } catch { showToast('Error al eliminar'); }
  }

  function openEdit(c: Contacto) {
    setSelected(c);
    setForm({ nombre: c.nombre, email: c.email, telefono: c.telefono, notas: c.notas, etiquetas: [...c.etiquetas] });
    setModal(true);
  }

  function toggleEtiqueta(tag: string) {
    setForm(p => ({
      ...p,
      etiquetas: p.etiquetas.includes(tag) ? p.etiquetas.filter(e => e !== tag) : [...p.etiquetas, tag],
    }));
  }

  const filtered = data.filter(c =>
    !q || c.nombre.toLowerCase().includes(q.toLowerCase()) ||
    c.email.toLowerCase().includes(q.toLowerCase()) ||
    c.telefono.includes(q)
  );

  const vip      = data.filter(c => c.etiquetas.includes('VIP')).length;
  const nuevos   = data.filter(c => c.etiquetas.includes('Nuevo')).length;
  const frecuentes = data.filter(c => c.etiquetas.includes('Frecuente')).length;

  return (
    <>
      <div className="pg-title">Clientes (CRM)</div>
      <div className="pg-sub">{client?.name} · {data.length} contactos</div>

      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 16 }}>
        {[
          { l: 'Total', v: data.length, c: 'var(--accent-1)' },
          { l: 'VIP',   v: vip,         c: 'var(--yellow)' },
          { l: 'Nuevos', v: nuevos,     c: 'var(--green)' },
        ].map(s => (
          <div key={s.l} className="stat-card">
            <div className="stat-val" style={{ color: s.c }}>{s.v}</div>
            <div className="stat-lbl">{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <input className="field-input" style={{ flex: 1 }}
          placeholder="Buscar por nombre, email o teléfono..."
          value={q} onChange={e => setQ(e.target.value)} />
        <button className="btn-primary" onClick={() => { setSelected(null); setForm({ nombre: '', email: '', telefono: '', notas: '', etiquetas: [] }); setModal(true); }}>
          <PlusIcon size={13} /> Agregar
        </button>
      </div>

      {loading ? (
        <div className="empty" style={{ padding: 48 }}>Cargando…</div>
      ) : filtered.length === 0 ? (
        <div className="empty">Sin contactos{q ? ' que coincidan' : ' aún'}</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="stagger" style={{ padding: '0 16px' }}>
            {filtered.map(c => (
              <div key={c.id} className="res-row" style={{ cursor: 'pointer' }} onClick={() => setSelected(s => s?.id === c.id ? null : c)}>
                <div className="res-av">{c.nombre.slice(0, 2).toUpperCase()}</div>
                <div className="res-info" style={{ flex: 1 }}>
                  <div className="res-name" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {c.nombre}
                    {c.etiquetas.map(tag => (
                      <span key={tag} style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 4, fontWeight: 700, background: ETIQUETA_STYLE[tag]?.bg, color: ETIQUETA_STYLE[tag]?.color }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="res-meta">
                    {c.email && <span>{c.email}</span>}
                    {c.email && c.telefono && <span> · </span>}
                    {c.telefono && <span>{c.telefono}</span>}
                    {c.ultimaVisita && <span> · Última visita: {c.ultimaVisita}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="abtn abtn-edit" onClick={e => { e.stopPropagation(); openEdit(c); }}><EditIcon size={12} /></button>
                  <button className="abtn abtn-canc" onClick={e => { e.stopPropagation(); deleteContact(c.id); }}><TrashIcon size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected && !modal && (
        <div className="card" style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16 }}>{selected.nombre}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {selected.etiquetas.map(tag => (
                  <span key={tag} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700, background: ETIQUETA_STYLE[tag]?.bg, color: ETIQUETA_STYLE[tag]?.color }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <button className="abtn abtn-edit" onClick={() => setSelected(null)}>✕</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-2)' }}>
            {selected.email    && <div>📧 {selected.email}</div>}
            {selected.telefono && <div>📱 {selected.telefono}</div>}
            {selected.totalVisitas > 0 && <div>🔁 {selected.totalVisitas} visita{selected.totalVisitas !== 1 ? 's' : ''}</div>}
            {selected.ultimaVisita && <div>📅 Última visita: {selected.ultimaVisita}</div>}
            {selected.primeraVisita && <div>📌 Primera visita: {selected.primeraVisita}</div>}
            {selected.notas && (
              <div style={{ marginTop: 6, padding: '8px 10px', background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 12 }}>
                📋 {selected.notas}
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`modal-ov ${modal ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setModal(false)}>
        <div className="modal">
          <div className="modal-hd">
            <div className="modal-title">{selected ? 'Editar contacto' : 'Nuevo contacto'}</div>
            <button className="modal-x" onClick={() => setModal(false)}>✕</button>
          </div>
          <div className="m-row">
            <div className="field-group">
              <label className="field-label">Nombre *</label>
              <input className="field-input" placeholder="Nombre completo" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div className="field-group">
              <label className="field-label">Teléfono</label>
              <input className="field-input" placeholder="09XX XXX XXX" value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Email</label>
            <input className="field-input" type="email" placeholder="email@..." value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="field-group">
            <label className="field-label">Etiquetas</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
              {ETIQUETAS_ALL.map(tag => (
                <button key={tag} onClick={() => toggleEtiqueta(tag)}
                  style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `1px solid ${form.etiquetas.includes(tag) ? ETIQUETA_STYLE[tag]?.color : 'var(--border)'}`, background: form.etiquetas.includes(tag) ? ETIQUETA_STYLE[tag]?.bg : 'transparent', color: form.etiquetas.includes(tag) ? ETIQUETA_STYLE[tag]?.color : 'var(--text-3)', transition: 'all .15s' }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Notas</label>
            <textarea className="field-input" placeholder="Preferencias, alergias, notas..." value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} rows={2} style={{ resize: 'none' }} />
          </div>
          <div className="modal-foot">
            <button className="btn-sec" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={saveContact} disabled={saving || !form.nombre}>
              {saving ? 'Guardando…' : selected ? 'Guardar cambios' : 'Agregar contacto'}
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
