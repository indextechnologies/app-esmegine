'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useClient } from '../../../lib/use-clients';
import { PlusIcon, EditIcon, TrashIcon, ExternalIcon, UtensilsIcon, SunIcon } from '../../../components/Icons';

type Category    = { id: string; nombre: string; icono: string; orden: number; activo: boolean; modoVista: boolean; };
type SubCategory = { id: string; nombre: string; icono: string; orden: number; activo: boolean; categoriaId: string | null; };
type MenuItem    = { id: string; nombre: string; descripcion: string; precio: number; activo: boolean; destacado: boolean; platoDelDia: boolean; categoriaId: string | null; subcategoriaId: string | null; imagenUrl: string | null; };

type Tab = 'menu' | 'daily';

export default function MenuPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const { client } = useClient(tenant);

  const [tab, setTab]               = useState<Tab>('menu');
  const [items, setItems]           = useState<MenuItem[]>([]);
  const [categories, setCats]       = useState<Category[]>([]);
  const [subcategories, setSubcats] = useState<SubCategory[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState<string | null>(null);
  const [toast, setToast]           = useState('');

  // Item modal
  const [itemModal, setItemModal]  = useState(false);
  const [editingItem, setEditItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm]    = useState({ nombre: '', descripcion: '', precio: '', categoriaId: '', subcategoriaId: '', destacado: false, imagenUrl: '' });
  // Foto upload (camera/gallery) — kept separate from itemForm so its shape stays intact
  const [fotoUpload, setFotoUpload]     = useState<{ id: string; preview: string; filename: string } | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  // Category modal
  const [catModal, setCatModal]   = useState(false);
  const [editingCat, setEditCat]  = useState<Category | null>(null);
  const [catForm, setCatForm]     = useState({ nombre: '', icono: '🍽️' });

  // SubCategory modal
  const [subCatModal, setSubCatModal]   = useState(false);
  const [editingSubCat, setEditSubCat]  = useState<SubCategory | null>(null);
  const [subCatForm, setSubCatForm]     = useState({ nombre: '', icono: '', categoriaId: '' });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  const loadMenu = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/${tenant}/menu`);
      const data = await res.json();
      setItems(data.items ?? []);
      setCats(data.categories ?? []);
      setSubcats(data.subcategories ?? []);
    } catch { showToast('Error cargando menú'); }
    finally { setLoading(false); }
  }, [tenant]);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  // ─── Menu item actions ────────────────────────────────────────────────────────

  async function patchItem(id: string, fields: object) {
    setSaving(id);
    const prev = items;
    setItems(cur => cur.map(it => it.id === id ? { ...it, ...(fields as Partial<MenuItem>) } : it));
    try {
      const res = await fetch(`/api/${tenant}/menu/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
      if (!res.ok) {
        const errText = await res.text().catch(() => res.status.toString());
        throw new Error(errText);
      }
      showToast('Guardado');
    } catch (e) {
      setItems(prev);
      showToast(`Error al guardar${e instanceof Error ? ': ' + e.message.slice(0, 60) : ''}`);
    }
    finally { setSaving(null); }
  }

  async function deleteItem(id: string) {
    if (!confirm('¿Eliminar este item?')) return;
    setSaving(id);
    try {
      await fetch(`/api/${tenant}/menu/${id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(it => it.id !== id));
      showToast('Eliminado');
    } catch { showToast('Error'); }
    finally { setSaving(null); }
  }

  // Downscale to max 1600px and re-encode as JPEG to stay well under the
  // serverless body limit and keep website images light. Falls back to original.
  async function shrinkImage(file: File): Promise<Blob> {
    try {
      const bitmap = await createImageBitmap(file);
      const max = 1600;
      const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
      const w = Math.round(bitmap.width * scale);
      const h = Math.round(bitmap.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
      const blob: Blob | null = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.85));
      return blob ?? file;
    } catch { return file; }
  }

  async function handleFotoUpload(file: File) {
    setUploadingFoto(true);
    const preview = URL.createObjectURL(file);
    setFotoUpload({ id: '', preview, filename: file.name });
    try {
      const blob = await shrinkImage(file);
      const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
      const fd = new FormData();
      fd.append('file', new File([blob], name, { type: 'image/jpeg' }));
      const res = await fetch(`/api/${tenant}/menu/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.fileUploadId) {
        setFotoUpload({ id: data.fileUploadId, preview, filename: data.filename || file.name });
        showToast('Foto lista');
      } else { showToast('Error al subir foto'); setFotoUpload(null); }
    } catch { showToast('Error al subir foto'); setFotoUpload(null); }
    finally { setUploadingFoto(false); }
  }

  async function saveItem() {
    if (!itemForm.nombre || !itemForm.categoriaId) return;
    setSaving('new');
    try {
      const body = {
        nombre:         itemForm.nombre,
        descripcion:    itemForm.descripcion,
        precio:         parseFloat(itemForm.precio.replace(/\./g, '').replace(',', '.')) || 0,
        categoriaId:    itemForm.categoriaId,
        subcategoriaId: itemForm.subcategoriaId || null,
        destacado:      itemForm.destacado,
        imagenUrl:      itemForm.imagenUrl || null,
        ...(fotoUpload?.id ? { fotoUploadId: fotoUpload.id, fotoFilename: fotoUpload.filename } : {}),
      };
      if (editingItem) {
        await patchItem(editingItem.id, body);
      } else {
        const res = await fetch(`/api/${tenant}/menu`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const created = await res.json();
        const { fotoUploadId: _f, fotoFilename: _n, ...rest } = body as typeof body & { fotoUploadId?: string; fotoFilename?: string };
        setItems(prev => [...prev, { id: created.id, activo: true, platoDelDia: false, ...rest, imagenUrl: fotoUpload?.preview ?? rest.imagenUrl }]);
        showToast('Item agregado');
      }
    } catch { showToast('Error'); }
    finally {
      setSaving(null);
      setItemModal(false);
      setEditItem(null);
      setItemForm({ nombre: '', descripcion: '', precio: '', categoriaId: '', subcategoriaId: '', destacado: false, imagenUrl: '' });
      setFotoUpload(null);
    }
  }

  function openEditItem(item: MenuItem) {
    setEditItem(item);
    setFotoUpload(null);
    setItemForm({
      nombre:         item.nombre,
      descripcion:    item.descripcion,
      precio:         item.precio.toString(),
      categoriaId:    item.categoriaId ?? '',
      subcategoriaId: item.subcategoriaId ?? '',
      destacado:      item.destacado,
      imagenUrl:      item.imagenUrl ?? '',
    });
    setItemModal(true);
  }

  // ─── Category actions ─────────────────────────────────────────────────────────

  async function patchCat(id: string, fields: object) {
    setSaving('cat-' + id);
    try {
      await fetch(`/api/${tenant}/categories/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
      setCats(prev => prev.map(c => c.id === id ? { ...c, ...(fields as Partial<Category>) } : c));
      showToast('Guardado');
    } catch { showToast('Error'); }
    finally { setSaving(null); }
  }

  async function deleteCat(id: string) {
    if (items.some(i => i.categoriaId === id)) { showToast('Mové los items antes de eliminar'); return; }
    if (!confirm('¿Eliminar esta categoría?')) return;
    setSaving('cat-' + id);
    try {
      await fetch(`/api/${tenant}/categories/${id}`, { method: 'DELETE' });
      setCats(prev => prev.filter(c => c.id !== id));
      showToast('Eliminado');
    } catch { showToast('Error'); }
    finally { setSaving(null); }
  }

  async function saveCat() {
    if (!catForm.nombre) return;
    setSaving('cat-new');
    try {
      if (editingCat) {
        await patchCat(editingCat.id, { nombre: catForm.nombre, icono: catForm.icono });
      } else {
        const res = await fetch(`/api/${tenant}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: catForm.nombre, icono: catForm.icono }) });
        const created = await res.json();
        setCats(prev => [...prev, { id: created.id, nombre: catForm.nombre, icono: catForm.icono, orden: prev.length + 1, activo: true, modoVista: false }]);
        showToast('Categoría agregada');
      }
    } catch { showToast('Error'); }
    finally { setSaving(null); setCatModal(false); setEditCat(null); setCatForm({ nombre: '', icono: '🍽️' }); }
  }

  // ─── SubCategory actions ──────────────────────────────────────────────────────

  async function patchSubCat(id: string, fields: object) {
    setSaving('sub-' + id);
    try {
      await fetch(`/api/${tenant}/subcategories/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
      setSubcats(prev => prev.map(s => s.id === id ? { ...s, ...(fields as Partial<SubCategory>) } : s));
      showToast('Guardado');
    } catch { showToast('Error'); }
    finally { setSaving(null); }
  }

  async function deleteSubCat(id: string) {
    if (items.some(i => i.subcategoriaId === id)) { showToast('Mové los items antes de eliminar'); return; }
    if (!confirm('¿Eliminar esta subcategoría?')) return;
    setSaving('sub-' + id);
    try {
      await fetch(`/api/${tenant}/subcategories/${id}`, { method: 'DELETE' });
      setSubcats(prev => prev.filter(s => s.id !== id));
      showToast('Eliminado');
    } catch { showToast('Error'); }
    finally { setSaving(null); }
  }

  async function saveSubCat() {
    if (!subCatForm.nombre || !subCatForm.categoriaId) return;
    setSaving('sub-new');
    try {
      if (editingSubCat) {
        await patchSubCat(editingSubCat.id, { nombre: subCatForm.nombre, icono: subCatForm.icono });
      } else {
        const orden = subcategories.filter(s => s.categoriaId === subCatForm.categoriaId).length;
        const res = await fetch(`/api/${tenant}/subcategories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: subCatForm.nombre, icono: subCatForm.icono, categoriaId: subCatForm.categoriaId, orden }),
        });
        const created = await res.json();
        setSubcats(prev => [...prev, { id: created.id, nombre: subCatForm.nombre, icono: subCatForm.icono, orden, activo: true, categoriaId: subCatForm.categoriaId }]);
        showToast('Subcategoría agregada');
      }
    } catch { showToast('Error'); }
    finally { setSaving(null); setSubCatModal(false); setEditSubCat(null); setSubCatForm({ nombre: '', icono: '', categoriaId: '' }); }
  }

  const daily       = items.filter(i => i.destacado);
  const activeCount = items.filter(i => i.activo).length;

  // Inline helper for item rows (reused inside category and subcategory groups)
  function renderItemRow(item: MenuItem, imgMode: boolean) {
    return (
      <div key={item.id} className="menu-item-row" style={{ opacity: saving === item.id ? 0.6 : 1, background: item.destacado ? 'rgba(245,158,11,.04)' : undefined }}>
        {imgMode && (
          <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-elevated)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {item.imagenUrl ? <img src={item.imagenUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 11, color: 'var(--text-3)' }}>sin img</span>}
          </div>
        )}
        <div className="mitem-info">
          <div className="mitem-name">
            {item.nombre}
            {item.destacado && <span style={{ marginLeft: 6, fontSize: 9.5, background: 'rgba(245,158,11,.15)', color: 'var(--yellow)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>★ Del Día</span>}
            {imgMode && !item.imagenUrl && <span style={{ marginLeft: 4, fontSize: 9.5, background: 'rgba(239,68,68,.12)', color: 'var(--red)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>sin foto</span>}
          </div>
          <div className="mitem-cat">{item.descripcion}</div>
        </div>
        <div className="mitem-price">Gs {item.precio.toLocaleString('es-PY')}</div>
        <button
          title={item.destacado ? 'Quitar del Menú del Día' : 'Agregar al Menú del Día'}
          onClick={() => patchItem(item.id, { destacado: !item.destacado })}
          style={{ background: item.destacado ? 'rgba(245,158,11,.2)' : 'var(--bg-elevated)', border: `1px solid ${item.destacado ? 'rgba(245,158,11,.5)' : 'var(--border)'}`, borderRadius: 6, padding: '3px 8px', fontSize: 13, cursor: 'pointer', color: item.destacado ? '#f59e0b' : 'var(--text-3)', transition: 'all .15s' }}>
          ★
        </button>
        <span className={`badge badge-${item.activo ? 'confirmed' : 'inactive'}`} style={{ cursor: 'pointer' }} onClick={() => patchItem(item.id, { activo: !item.activo })}>
          {item.activo ? 'Activo' : 'Oculto'}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="abtn abtn-edit" onClick={() => openEditItem(item)}><EditIcon size={12} /></button>
          <button className="abtn abtn-canc" onClick={() => deleteItem(item.id)}><TrashIcon size={12} /></button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pg-title">Menú</div>
      <div className="pg-sub">
        {client?.name} ·{' '}
        {client?.website && (
          <a href={client.website} target="_blank" rel="noopener"
            style={{ color: 'var(--accent-1)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <ExternalIcon size={11} /> {client.website}
          </a>
        )}
      </div>

      <div className="tabs">
        {([
          { t: 'menu'  as Tab, label: 'Menú',    icon: <UtensilsIcon size={13} /> },
          { t: 'daily' as Tab, label: 'Del Día', icon: <SunIcon      size={13} /> },
        ]).map(({ t, label, icon }) => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {icon}{label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty" style={{ padding: 48 }}>Cargando desde Notion…</div>
      ) : (
        <>
          {/* ── MENÚ TAB ──────────────────────────────────────────────────── */}
          {tab === 'menu' && (
            <>
              {/* Categorías */}
              <div className="card" style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13 }}>Categorías</span>
                  <button className="btn-primary" style={{ fontSize: 11, padding: '4px 10px' }}
                    onClick={() => { setEditCat(null); setCatForm({ nombre: '', icono: '🍽️' }); setCatModal(true); }}>
                    <PlusIcon size={11} /> Nueva
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px 16px' }}>
                  {categories.map(cat => (
                    <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', opacity: saving === 'cat-' + cat.id ? 0.6 : 1 }}>
                      <span style={{ fontSize: 15 }}>{cat.icono}</span>
                      <span style={{ fontWeight: 600, fontSize: 12.5 }}>{cat.nombre}</span>
                      {subcategories.filter(s => s.categoriaId === cat.id).length > 0 && (
                        <span style={{ fontSize: 10, color: 'var(--text-3)', background: 'var(--bg-hover)', padding: '1px 6px', borderRadius: 10 }}>
                          {subcategories.filter(s => s.categoriaId === cat.id).length} subs
                        </span>
                      )}
                      <button className="abtn abtn-edit" style={{ padding: '2px 6px' }} onClick={() => { setEditCat(cat); setCatForm({ nombre: cat.nombre, icono: cat.icono }); setCatModal(true); }}><EditIcon size={11} /></button>
                      <button className="abtn abtn-canc" style={{ padding: '2px 6px' }} onClick={() => deleteCat(cat.id)}><TrashIcon size={11} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{items.length} items · {activeCount} activos</div>
                <button className="btn-primary" onClick={() => { setEditItem(null); setItemForm({ nombre: '', descripcion: '', precio: '', categoriaId: categories[0]?.id ?? '', subcategoriaId: '', destacado: false, imagenUrl: '' }); setItemModal(true); }}>
                  <PlusIcon size={13} /> Agregar item
                </button>
              </div>

              {/* Items por Categoría → Subcategoría */}
              {categories.map(cat => {
                const catItems = items.filter(i => i.categoriaId === cat.id);
                const catSubs  = subcategories.filter(s => s.categoriaId === cat.id);
                if (!catItems.length && !catSubs.length) return null;
                const imgMode = cat.modoVista;
                return (
                  <div key={cat.id} className="card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
                    {/* Categoría header */}
                    <div style={{ padding: '10px 16px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13.5 }}>{cat.icono} {cat.nombre}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {imgMode && <span style={{ fontSize: 10, background: 'rgba(99,102,241,.12)', color: '#818cf8', padding: '1px 7px', borderRadius: 20, fontWeight: 700 }}>🖼️ Modo imagen</span>}
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{catItems.length} items</span>
                        <button
                          style={{ fontSize: 10, padding: '3px 9px', minHeight: 'unset', background: 'rgba(99,102,241,.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,.25)', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
                          onClick={() => { setEditSubCat(null); setSubCatForm({ nombre: '', icono: '', categoriaId: cat.id }); setSubCatModal(true); }}>
                          <PlusIcon size={9} /> Subcategoría
                        </button>
                        <button className="btn-primary" style={{ fontSize: 11, padding: '3px 10px', minHeight: 'unset', boxShadow: 'none' }}
                          onClick={() => { setEditItem(null); setItemForm({ nombre: '', descripcion: '', precio: '', categoriaId: cat.id, subcategoriaId: '', destacado: false, imagenUrl: '' }); setItemModal(true); }}>
                          <PlusIcon size={10} /> Agregar
                        </button>
                      </div>
                    </div>

                    {/* Grupos por subcategoría */}
                    {catSubs.map(sub => {
                      const subItems = catItems.filter(i => i.subcategoriaId === sub.id);
                      return (
                        <div key={sub.id} style={{ opacity: saving === 'sub-' + sub.id ? 0.6 : 1 }}>
                          <div style={{ padding: '7px 16px 7px 24px', background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700 }}>↳</span>
                              {sub.icono && <span style={{ fontSize: 13 }}>{sub.icono}</span>}
                              <span style={{ fontWeight: 600, fontSize: 12.5 }}>{sub.nombre}</span>
                              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>({subItems.length})</span>
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button className="abtn abtn-edit" style={{ padding: '2px 6px' }}
                                onClick={() => { setEditSubCat(sub); setSubCatForm({ nombre: sub.nombre, icono: sub.icono, categoriaId: sub.categoriaId ?? cat.id }); setSubCatModal(true); }}>
                                <EditIcon size={10} />
                              </button>
                              <button className="abtn abtn-canc" style={{ padding: '2px 6px' }} onClick={() => deleteSubCat(sub.id)}>
                                <TrashIcon size={10} />
                              </button>
                              <button className="btn-primary" style={{ fontSize: 10, padding: '2px 8px', minHeight: 'unset', boxShadow: 'none' }}
                                onClick={() => { setEditItem(null); setItemForm({ nombre: '', descripcion: '', precio: '', categoriaId: cat.id, subcategoriaId: sub.id, destacado: false, imagenUrl: '' }); setItemModal(true); }}>
                                <PlusIcon size={9} /> Item
                              </button>
                            </div>
                          </div>
                          {subItems.map(item => renderItemRow(item, imgMode))}
                          {subItems.length === 0 && (
                            <div style={{ padding: '8px 16px 8px 36px', fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic', borderBottom: '1px solid var(--border)' }}>
                              Sin items — agregá uno con "+ Item"
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Items directos sin subcategoría */}
                    {(() => {
                      const directItems = catItems.filter(i => !i.subcategoriaId);
                      if (!directItems.length) return null;
                      return (
                        <>
                          {catSubs.length > 0 && (
                            <div style={{ padding: '5px 16px 5px 24px', background: 'rgba(0,0,0,.015)', borderBottom: '1px solid var(--border)' }}>
                              <span style={{ fontSize: 10, color: 'var(--text-3)', fontStyle: 'italic' }}>Sin subcategoría</span>
                            </div>
                          )}
                          {directItems.map(item => renderItemRow(item, imgMode))}
                        </>
                      );
                    })()}
                  </div>
                );
              })}
              {items.length === 0 && <div className="empty">Sin items en el menú</div>}
            </>
          )}

          {/* ── MENÚ DEL DÍA ─────────────────────────────────────────────── */}
          {tab === 'daily' && (() => {
            const activeItems = items.filter(i => i.activo);

            const renderToggleRow = (item: MenuItem) => (
              <div key={item.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '1px solid var(--border)', background: item.destacado ? 'rgba(245,158,11,.06)' : 'transparent', opacity: saving === item.id ? 0.6 : 1, cursor: 'pointer', transition: 'background .15s' }}
                onClick={() => patchItem(item.id, { destacado: !item.destacado })}>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${item.destacado ? '#f59e0b' : 'var(--border)'}`, background: item.destacado ? '#f59e0b' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, color: '#fff', fontWeight: 700, transition: 'all .15s' }}>
                  {item.destacado && '★'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{item.nombre}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{item.descripcion}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>Gs {item.precio.toLocaleString('es-PY')}</div>
                {item.destacado && <span style={{ fontSize: 10, background: 'rgba(245,158,11,.2)', color: '#f59e0b', padding: '2px 8px', borderRadius: 20, fontWeight: 700, whiteSpace: 'nowrap' }}>★ Del Día</span>}
              </div>
            );

            return (
              <>
                {/* Resumen activos */}
                <div className="card" style={{ marginBottom: 20, borderLeft: '3px solid #f59e0b' }}>
                  <div className="card-hd">
                    <div className="card-title">★ Menú del Día</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{daily.length} seleccionado{daily.length !== 1 ? 's' : ''} · visibles en el sitio</span>
                      <button className="btn-secondary" style={{ fontSize: 11, padding: '3px 10px' }} onClick={loadMenu}>↺ Recargar</button>
                    </div>
                  </div>
                  {daily.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'var(--text-3)', paddingTop: 4 }}>Ningún plato seleccionado — hacé clic en cualquier item de abajo para marcarlo como del día</div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 8 }}>
                      {daily.map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)', borderRadius: 8, padding: '6px 12px' }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{item.nombre}</span>
                          <button onClick={e => { e.stopPropagation(); patchItem(item.id, { destacado: false }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 14, padding: 0, lineHeight: 1 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Items por categoría para toggle */}
                {activeItems.length === 0 ? (
                  <div className="empty">Sin items en el menú — agregá platos desde la pestaña Menú para poder seleccionarlos como del día</div>
                ) : (
                  categories.map(cat => {
                    const catItems = activeItems.filter(i => i.categoriaId === cat.id);
                    if (!catItems.length) return null;
                    const catSubs = subcategories.filter(s => s.categoriaId === cat.id);
                    return (
                      <div key={cat.id} className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
                        <div style={{ padding: '10px 16px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13 }}>{cat.icono} {cat.nombre}</span>
                        </div>
                        {catSubs.map(sub => {
                          const subItems = catItems.filter(i => i.subcategoriaId === sub.id);
                          if (!subItems.length) return null;
                          return (
                            <div key={sub.id}>
                              <div style={{ padding: '6px 16px 6px 24px', background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>↳ {sub.nombre}</span>
                              </div>
                              {subItems.map(renderToggleRow)}
                            </div>
                          );
                        })}
                        {catItems.filter(i => !i.subcategoriaId).map(renderToggleRow)}
                      </div>
                    );
                  })
                )}
              </>
            );
          })()}
        </>
      )}

      {/* ── Modal item ──────────────────────────────────────────────────────── */}
      <div className={`modal-ov ${itemModal ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setItemModal(false)}>
        <div className="modal">
          <div className="modal-hd">
            <div className="modal-title">{editingItem ? 'Editar item' : 'Nuevo item'}</div>
            <button className="modal-x" onClick={() => setItemModal(false)}>✕</button>
          </div>
          <div className="m-row">
            <div className="field-group">
              <label className="field-label">Categoría</label>
              <select className="field-input" value={itemForm.categoriaId} onChange={e => setItemForm(p => ({ ...p, categoriaId: e.target.value, subcategoriaId: '' }))}>
                <option value="">— Seleccionar —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Subcategoría <span style={{ fontSize: 10, color: 'var(--text-3)' }}>(opcional)</span></label>
              <select className="field-input" value={itemForm.subcategoriaId} onChange={e => setItemForm(p => ({ ...p, subcategoriaId: e.target.value }))} disabled={!itemForm.categoriaId}>
                <option value="">— Sin subcategoría —</option>
                {subcategories.filter(s => s.categoriaId === itemForm.categoriaId).map(s => (
                  <option key={s.id} value={s.id}>{s.icono} {s.nombre}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Nombre</label>
            <input className="field-input" placeholder="Nombre del producto" value={itemForm.nombre} onChange={e => setItemForm(p => ({ ...p, nombre: e.target.value }))} />
          </div>
          <div className="field-group">
            <label className="field-label">Descripción</label>
            <input className="field-input" placeholder="Descripción breve..." value={itemForm.descripcion} onChange={e => setItemForm(p => ({ ...p, descripcion: e.target.value }))} />
          </div>
          <div className="m-row">
            <div className="field-group">
              <label className="field-label">Precio (Gs)</label>
              <input className="field-input" placeholder="15000" value={itemForm.precio} onChange={e => setItemForm(p => ({ ...p, precio: e.target.value }))} />
            </div>
            <div className="field-group">
              <label className="field-label">Opciones</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, cursor: 'pointer', paddingTop: 10 }}>
                <input type="checkbox" checked={itemForm.destacado} onChange={e => setItemForm(p => ({ ...p, destacado: e.target.checked }))} style={{ accentColor: 'var(--accent-1)', width: 14, height: 14 }} />
                Destacado
              </label>
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Foto del plato</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label className="btn-sec" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {uploadingFoto ? 'Subiendo…' : '📷 Cámara / Galería'}
                <input type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFotoUpload(f); e.currentTarget.value = ''; }} />
              </label>
              {(fotoUpload?.preview || (editingItem?.imagenUrl && !fotoUpload)) &&
                <img src={fotoUpload?.preview || editingItem!.imagenUrl!} alt="" style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />}
              {fotoUpload?.id && <span style={{ fontSize: 11, color: 'var(--green, #22c55e)', fontWeight: 600 }}>✓ lista</span>}
            </div>
          </div>
          {(() => {
            const selectedCat = categories.find(c => c.id === itemForm.categoriaId);
            return selectedCat?.modoVista ? (
              <div className="field-group">
                <label className="field-label">URL de imagen</label>
                <input className="field-input" placeholder="https://..." value={itemForm.imagenUrl} onChange={e => setItemForm(p => ({ ...p, imagenUrl: e.target.value }))} />
                {itemForm.imagenUrl && <img src={itemForm.imagenUrl} alt="" onError={e => (e.currentTarget.style.display = 'none')} style={{ marginTop: 8, width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} />}
              </div>
            ) : itemForm.imagenUrl ? (
              <div className="field-group">
                <label className="field-label">URL de imagen (opcional)</label>
                <input className="field-input" placeholder="https://..." value={itemForm.imagenUrl} onChange={e => setItemForm(p => ({ ...p, imagenUrl: e.target.value }))} />
              </div>
            ) : null;
          })()}
          <div className="modal-foot">
            <button className="btn-sec" onClick={() => setItemModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={saveItem} disabled={saving === 'new'}>
              {saving === 'new' ? 'Guardando…' : editingItem ? 'Guardar cambios' : 'Agregar item'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal categoría ─────────────────────────────────────────────────── */}
      <div className={`modal-ov ${catModal ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setCatModal(false)}>
        <div className="modal" style={{ maxWidth: 380 }}>
          <div className="modal-hd">
            <div className="modal-title">{editingCat ? 'Editar categoría' : 'Nueva categoría'}</div>
            <button className="modal-x" onClick={() => setCatModal(false)}>✕</button>
          </div>
          <div className="m-row">
            <div className="field-group" style={{ flex: '0 0 72px' }}>
              <label className="field-label">Emoji</label>
              <input className="field-input" style={{ textAlign: 'center', fontSize: 20 }} maxLength={4} value={catForm.icono} onChange={e => setCatForm(p => ({ ...p, icono: e.target.value }))} />
            </div>
            <div className="field-group">
              <label className="field-label">Nombre</label>
              <input className="field-input" placeholder="ej. Almuerzo, Bebidas..." value={catForm.nombre} onChange={e => setCatForm(p => ({ ...p, nombre: e.target.value }))} />
            </div>
          </div>
          <div className="modal-foot">
            <button className="btn-sec" onClick={() => setCatModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={saveCat} disabled={saving === 'cat-new'}>
              {saving === 'cat-new' ? 'Guardando…' : editingCat ? 'Guardar cambios' : 'Agregar categoría'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal subcategoría ──────────────────────────────────────────────── */}
      <div className={`modal-ov ${subCatModal ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setSubCatModal(false)}>
        <div className="modal" style={{ maxWidth: 420 }}>
          <div className="modal-hd">
            <div className="modal-title">{editingSubCat ? 'Editar subcategoría' : 'Nueva subcategoría'}</div>
            <button className="modal-x" onClick={() => setSubCatModal(false)}>✕</button>
          </div>
          {!editingSubCat && (
            <div className="field-group">
              <label className="field-label">Categoría padre</label>
              <select className="field-input" value={subCatForm.categoriaId} onChange={e => setSubCatForm(p => ({ ...p, categoriaId: e.target.value }))}>
                <option value="">— Seleccionar —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>)}
              </select>
            </div>
          )}
          {editingSubCat && (
            <div className="field-group">
              <label className="field-label">Categoría</label>
              <div className="field-input" style={{ background: 'var(--bg-elevated)', color: 'var(--text-2)', cursor: 'default' }}>
                {categories.find(c => c.id === subCatForm.categoriaId)?.icono} {categories.find(c => c.id === subCatForm.categoriaId)?.nombre ?? '—'}
              </div>
            </div>
          )}
          <div className="m-row">
            <div className="field-group" style={{ flex: '0 0 72px' }}>
              <label className="field-label">Emoji</label>
              <input className="field-input" style={{ textAlign: 'center', fontSize: 20 }} maxLength={4} placeholder="🥗" value={subCatForm.icono} onChange={e => setSubCatForm(p => ({ ...p, icono: e.target.value }))} />
            </div>
            <div className="field-group">
              <label className="field-label">Nombre</label>
              <input className="field-input" placeholder="ej. Vegetariano, Carnes, Fríos..." value={subCatForm.nombre} onChange={e => setSubCatForm(p => ({ ...p, nombre: e.target.value }))} />
            </div>
          </div>
          <div className="modal-foot">
            <button className="btn-sec" onClick={() => setSubCatModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={saveSubCat} disabled={saving === 'sub-new'}>
              {saving === 'sub-new' ? 'Guardando…' : editingSubCat ? 'Guardar cambios' : 'Agregar subcategoría'}
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
