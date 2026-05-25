'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { CLIENTS } from '../../../lib/demo-data';
import { PlusIcon, EditIcon, TrashIcon, ExternalIcon } from '../../../components/Icons';

type Category = { id: string; nombre: string; icono: string; orden: number };
type MenuItem = {
  id: string; nombre: string; descripcion: string; precio: number;
  activo: boolean; destacado: boolean; platoDelDia: boolean;
  categoriaId: string | null;
};

type Tab = 'menu' | 'daily' | 'horarios' | 'contacto';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export default function WebsitePage() {
  const { tenant } = useParams<{ tenant: string }>();
  const client = CLIENTS.find(c => c.slug === tenant);

  const [tab, setTab] = useState<Tab>('menu');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  // Modal state
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState({
    nombre: '', descripcion: '', precio: '', categoriaId: '', destacado: false,
  });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/${tenant}/menu`);
      const data = await res.json();
      setItems(data.items ?? []);
      setCategories(data.categories ?? []);
    } catch {
      showToast('Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, [tenant]);

  useEffect(() => { loadData(); }, [loadData]);

  async function patchItem(id: string, fields: object) {
    setSaving(id);
    try {
      await fetch(`/api/${tenant}/menu/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      setItems(prev => prev.map(it => it.id === id ? { ...it, ...fields } : it));
      showToast('Guardado');
    } catch {
      showToast('Error al guardar');
    } finally {
      setSaving(null);
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('¿Eliminar este item?')) return;
    setSaving(id);
    try {
      await fetch(`/api/${tenant}/menu/${id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(it => it.id !== id));
      showToast('Item eliminado');
    } catch {
      showToast('Error al eliminar');
    } finally {
      setSaving(null);
    }
  }

  async function saveItem() {
    if (!form.nombre || !form.categoriaId) return;
    setSaving('new');
    try {
      const body = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        precio: parseFloat(form.precio.replace(/\./g, '').replace(',', '.')) || 0,
        categoriaId: form.categoriaId,
        destacado: form.destacado,
      };
      if (editing) {
        await patchItem(editing.id, body);
      } else {
        const res = await fetch(`/api/${tenant}/menu`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const created = await res.json();
        const newItem: MenuItem = {
          id: created.id,
          nombre: form.nombre,
          descripcion: form.descripcion,
          precio: body.precio,
          categoriaId: form.categoriaId,
          activo: true,
          destacado: form.destacado,
          platoDelDia: false,
        };
        setItems(prev => [...prev, newItem]);
        showToast('Item agregado');
      }
    } catch {
      showToast('Error al guardar');
    } finally {
      setSaving(null);
      setModal(false);
      setEditing(null);
      setForm({ nombre: '', descripcion: '', precio: '', categoriaId: '', destacado: false });
    }
  }

  function openEdit(item: MenuItem) {
    setEditing(item);
    setForm({
      nombre: item.nombre,
      descripcion: item.descripcion,
      precio: item.precio.toString(),
      categoriaId: item.categoriaId ?? '',
      destacado: item.destacado,
    });
    setModal(true);
  }

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));
  const daily = items.filter(i => i.platoDelDia);
  const activeCount = items.filter(i => i.activo).length;

  return (
    <>
      <div className="pg-title">Website</div>
      <div className="pg-sub">
        {client?.name} ·{' '}
        {client?.website && (
          <a href={client.website} target="_blank" rel="noopener" style={{ color: 'var(--accent-1)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <ExternalIcon size={11} /> {client.website}
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {([
          ['menu',     '🍽️ Menú'],
          ['daily',    '☀️ Comidas del Día'],
          ['horarios', '🕐 Horarios'],
          ['contacto', '📋 Contacto'],
        ] as [Tab, string][]).map(([t, label]) => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty" style={{ padding: 48 }}>Cargando desde Notion…</div>
      ) : (
        <>
          {/* ── MENÚ TAB ─────────────────────────────────────────────────── */}
          {tab === 'menu' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{items.length} items · {activeCount} activos</div>
                <button className="btn-primary" onClick={() => { setEditing(null); setForm({ nombre:'', descripcion:'', precio:'', categoriaId: categories[0]?.id ?? '', destacado:false }); setModal(true); }}>
                  <PlusIcon size={13} /> Agregar item
                </button>
              </div>

              {categories.map(cat => {
                const catItems = items.filter(i => i.categoriaId === cat.id);
                if (!catItems.length) return null;
                return (
                  <div key={cat.id} className="card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '10px 16px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13.5 }}>{cat.icono} {cat.nombre}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{catItems.length} items</span>
                    </div>
                    {catItems.map(item => (
                      <div key={item.id} className="menu-item-row" style={{ opacity: saving === item.id ? 0.6 : 1 }}>
                        <div className="mitem-info">
                          <div className="mitem-name">
                            {item.nombre}
                            {item.destacado && <span style={{ marginLeft: 6, fontSize: 9.5, background: 'rgba(245,158,11,.15)', color: 'var(--yellow)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>★ Destacado</span>}
                            {item.platoDelDia && <span style={{ marginLeft: 4, fontSize: 9.5, background: 'rgba(251,191,36,.15)', color: '#f59e0b', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>☀️ Del día</span>}
                          </div>
                          <div className="mitem-cat">{item.descripcion}</div>
                        </div>
                        <div className="mitem-price">Gs {item.precio.toLocaleString('es-PY')}</div>
                        <span
                          className={`badge badge-${item.activo ? 'confirmed' : 'inactive'}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => patchItem(item.id, { activo: !item.activo })}
                        >
                          {item.activo ? 'Activo' : 'Oculto'}
                        </span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="abtn abtn-edit" onClick={() => openEdit(item)}><EditIcon size={12} /></button>
                          <button className="abtn abtn-canc" onClick={() => deleteItem(item.id)}><TrashIcon size={12} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}

              {items.length === 0 && <div className="empty">Sin items en el menú</div>}
            </>
          )}

          {/* ── COMIDAS DEL DÍA TAB ──────────────────────────────────────── */}
          {tab === 'daily' && (
            <>
              {/* Current daily specials summary */}
              <div className="card" style={{ marginBottom: 20, borderLeft: '3px solid #f59e0b' }}>
                <div className="card-hd">
                  <div className="card-title">☀️ Hoy en Bom Pain</div>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{daily.length} seleccionado{daily.length !== 1 ? 's' : ''}</span>
                </div>
                {daily.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text-3)', paddingTop: 4 }}>Ningún item marcado como plato del día</div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
                    {daily.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)', borderRadius: 8, padding: '6px 12px' }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{item.nombre}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Gs {item.precio.toLocaleString('es-PY')}</span>
                        <button
                          onClick={() => patchItem(item.id, { platoDelDia: false })}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 14, padding: 0, lineHeight: 1 }}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Select from full menu */}
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12, fontWeight: 600 }}>
                Seleccioná del menú completo:
              </div>
              {categories.map(cat => {
                const catItems = items.filter(i => i.categoriaId === cat.id && i.activo);
                if (!catItems.length) return null;
                return (
                  <div key={cat.id} className="card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '10px 16px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13 }}>{cat.icono} {cat.nombre}</span>
                    </div>
                    {catItems.map(item => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                          borderBottom: '1px solid var(--border)',
                          background: item.platoDelDia ? 'rgba(245,158,11,.06)' : 'transparent',
                          opacity: saving === item.id ? 0.6 : 1,
                          cursor: 'pointer',
                          transition: 'background .15s',
                        }}
                        onClick={() => patchItem(item.id, { platoDelDia: !item.platoDelDia })}
                      >
                        <div style={{
                          width: 20, height: 20, borderRadius: 5,
                          border: `2px solid ${item.platoDelDia ? '#f59e0b' : 'var(--border)'}`,
                          background: item.platoDelDia ? '#f59e0b' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, transition: 'all .15s',
                        }}>
                          {item.platoDelDia && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{item.nombre}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{item.descripcion}</div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
                          Gs {item.precio.toLocaleString('es-PY')}
                        </div>
                        {item.platoDelDia && (
                          <span style={{ fontSize: 10, background: 'rgba(245,158,11,.2)', color: '#f59e0b', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>☀️ Del día</span>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          )}

          {/* ── HORARIOS TAB ─────────────────────────────────────────────── */}
          {tab === 'horarios' && (
            <div className="card" style={{ maxWidth: 520 }}>
              <div className="card-hd">
                <div className="card-title">Horarios de atención</div>
                <button className="btn-primary" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => showToast('Próximamente: edición de horarios desde Notion')}>
                  Guardar cambios
                </button>
              </div>
              {[
                { day: 'Lunes — Viernes', open: '07:00', close: '21:00' },
                { day: 'Sábado',         open: '08:00', close: '22:00' },
                { day: 'Domingo',        open: '08:00', close: '18:00' },
              ].map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ minWidth: 160, fontWeight: 600, fontSize: 13 }}>{h.day}</div>
                  <input type="time" className="field-input" style={{ width: 110 }} defaultValue={h.open} />
                  <span style={{ color: 'var(--text-3)' }}>→</span>
                  <input type="time" className="field-input" style={{ width: 110 }} defaultValue={h.close} />
                </div>
              ))}
            </div>
          )}

          {/* ── CONTACTO TAB ─────────────────────────────────────────────── */}
          {tab === 'contacto' && (
            <div className="card" style={{ maxWidth: 560 }}>
              <div className="card-hd">
                <div className="card-title">Información de contacto</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {([
                  { label: 'Nombre del negocio', key: 'name',      val: client?.name ?? ''      },
                  { label: 'Teléfono / WhatsApp', key: 'phone',    val: client?.phone ?? ''     },
                  { label: 'Email',               key: 'email',    val: client?.email ?? ''     },
                  { label: 'Dirección',           key: 'address',  val: client?.address ?? ''   },
                  { label: 'Instagram',           key: 'instagram',val: client?.instagram ?? '' },
                ]).map(f => (
                  <div key={f.key} className="field-group">
                    <label className="field-label">{f.label}</label>
                    <input className="field-input" defaultValue={f.val} />
                  </div>
                ))}
                <button className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: 8 }}
                  onClick={() => showToast('Próximamente: edición de contacto desde Notion')}>
                  Guardar cambios
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modal agregar/editar ─────────────────────────────────────────── */}
      <div className={`modal-ov ${modal ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setModal(false)}>
        <div className="modal">
          <div className="modal-hd">
            <div className="modal-title">{editing ? 'Editar item' : 'Nuevo item'}</div>
            <button className="modal-x" onClick={() => setModal(false)}>✕</button>
          </div>
          <div className="field-group">
            <label className="field-label">Categoría</label>
            <select className="field-input" value={form.categoriaId} onChange={e => setForm(p => ({ ...p, categoriaId: e.target.value }))}>
              <option value="">— Seleccionar —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>)}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">Nombre</label>
            <input className="field-input" placeholder="Nombre del producto" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
          </div>
          <div className="field-group">
            <label className="field-label">Descripción</label>
            <input className="field-input" placeholder="Descripción breve..." value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} />
          </div>
          <div className="m-row">
            <div className="field-group">
              <label className="field-label">Precio (Gs)</label>
              <input className="field-input" placeholder="15000" value={form.precio} onChange={e => setForm(p => ({ ...p, precio: e.target.value }))} />
            </div>
            <div className="field-group">
              <label className="field-label">Opciones</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, cursor: 'pointer', paddingTop: 10 }}>
                <input type="checkbox" checked={form.destacado} onChange={e => setForm(p => ({ ...p, destacado: e.target.checked }))}
                  style={{ accentColor: 'var(--accent-1)', width: 14, height: 14 }} />
                Destacado
              </label>
            </div>
          </div>
          <div className="modal-foot">
            <button className="btn-sec" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={saveItem} disabled={saving === 'new'}>
              {saving === 'new' ? 'Guardando…' : editing ? 'Guardar cambios' : 'Agregar item'}
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className={`toast ${toast ? 'show' : ''}`}>
        <div className="toast-ic">✓</div>
        {toast}
      </div>
    </>
  );
}
