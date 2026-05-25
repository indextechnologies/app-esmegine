'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { CLIENTS } from '../../../lib/demo-data';
import { PlusIcon, EditIcon, TrashIcon, ExternalIcon } from '../../../components/Icons';

type Category    = { id: string; nombre: string; icono: string; orden: number; activo: boolean; modoVista: boolean; };
type MenuItem    = { id: string; nombre: string; descripcion: string; precio: number; activo: boolean; destacado: boolean; platoDelDia: boolean; categoriaId: string | null; imagenUrl: string | null; };
type Horario     = { id: string; dia: string; horaApertura: string; horaCierre: string; cerrado: boolean; nota: string; orden: number; };
type GaleriaItem = { id: string; titulo: string; urlImagen: string; altText: string; seccion: string; activo: boolean; orden: number; };
type Testimonio  = { id: string; nombre: string; testimonio: string; calificacion: number; contexto: string; plataforma: string; activo: boolean; };
type Promocion   = { id: string; titulo: string; descripcion: string; descuento: number; tipo: string; imagenUrl: string; fechaInicio: string; fechaFin: string; activo: boolean; };

type Tab = 'menu' | 'daily' | 'horarios' | 'testimonios' | 'galeria' | 'promociones' | 'contacto';

export default function WebsitePage() {
  const { tenant } = useParams<{ tenant: string }>();
  const client = CLIENTS.find(c => c.slug === tenant);

  const [tab, setTab]             = useState<Tab>('menu');
  const [items, setItems]         = useState<MenuItem[]>([]);
  const [categories, setCats]     = useState<Category[]>([]);
  const [horarios, setHorarios]   = useState<Horario[]>([]);
  const [galeria, setGaleria]     = useState<GaleriaItem[]>([]);
  const [testimonios, setTestimonios] = useState<Testimonio[]>([]);
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState<string | null>(null);
  const [toast, setToast]         = useState('');

  // Item modal
  const [itemModal, setItemModal]   = useState(false);
  const [editingItem, setEditItem]  = useState<MenuItem | null>(null);
  const [itemForm, setItemForm]     = useState({ nombre: '', descripcion: '', precio: '', categoriaId: '', destacado: false, imagenUrl: '' });

  // Category modal
  const [catModal, setCatModal]     = useState(false);
  const [editingCat, setEditCat]    = useState<Category | null>(null);
  const [catForm, setCatForm]       = useState({ nombre: '', icono: '🍽️' });

  // Galería modal
  const [galModal, setGalModal]     = useState(false);
  const [editingGal, setEditGal]    = useState<GaleriaItem | null>(null);
  const [galForm, setGalForm]       = useState({ titulo: '', urlImagen: '', altText: '', seccion: 'Galería', orden: 0 });

  // Testimonio modal
  const [testModal, setTestModal]   = useState(false);
  const [editingTest, setEditTest]  = useState<Testimonio | null>(null);
  const [testForm, setTestForm]     = useState({ nombre: '', testimonio: '', calificacion: 5, contexto: '', plataforma: 'Google' });

  // Promocion modal
  const [promoModal, setPromoModal] = useState(false);
  const [editingPromo, setEditPromo] = useState<Promocion | null>(null);
  const [promoForm, setPromoForm]   = useState({ titulo: '', descripcion: '', descuento: 0, tipo: 'Especial', imagenUrl: '', fechaInicio: '', fechaFin: '' });

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
    } catch { showToast('Error cargando menú'); }
    finally { setLoading(false); }
  }, [tenant]);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  // Lazy-load tab data on first visit
  useEffect(() => {
    if (tab === 'horarios' && horarios.length === 0) {
      fetch(`/api/${tenant}/horarios`).then(r => r.json()).then(setHorarios).catch(() => {});
    }
    if (tab === 'galeria' && galeria.length === 0) {
      fetch(`/api/${tenant}/galeria`).then(r => r.json()).then(setGaleria).catch(() => {});
    }
    if (tab === 'testimonios' && testimonios.length === 0) {
      fetch(`/api/${tenant}/testimonios?activo=all`).then(r => r.json()).then(setTestimonios).catch(() => {});
    }
    if (tab === 'promociones' && promociones.length === 0) {
      fetch(`/api/${tenant}/promociones`).then(r => r.json()).then(setPromociones).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, tenant]);

  // ─── Menu item actions ────────────────────────────────────────────────────────

  async function patchItem(id: string, fields: object) {
    setSaving(id);
    try {
      await fetch(`/api/${tenant}/menu/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
      setItems(prev => prev.map(it => it.id === id ? { ...it, ...(fields as Partial<MenuItem>) } : it));
      showToast('Guardado');
    } catch { showToast('Error al guardar'); }
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

  async function saveItem() {
    if (!itemForm.nombre || !itemForm.categoriaId) return;
    setSaving('new');
    try {
      const body = { nombre: itemForm.nombre, descripcion: itemForm.descripcion, precio: parseFloat(itemForm.precio.replace(/\./g, '').replace(',', '.')) || 0, categoriaId: itemForm.categoriaId, destacado: itemForm.destacado, imagenUrl: itemForm.imagenUrl || null };
      if (editingItem) {
        await patchItem(editingItem.id, body);
      } else {
        const res = await fetch(`/api/${tenant}/menu`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const created = await res.json();
        setItems(prev => [...prev, { id: created.id, activo: true, platoDelDia: false, ...body, categoriaId: body.categoriaId }]);
        showToast('Item agregado');
      }
    } catch { showToast('Error'); }
    finally { setSaving(null); setItemModal(false); setEditItem(null); setItemForm({ nombre:'', descripcion:'', precio:'', categoriaId:'', destacado:false, imagenUrl:'' }); }
  }

  function openEditItem(item: MenuItem) {
    setEditItem(item);
    setItemForm({ nombre: item.nombre, descripcion: item.descripcion, precio: item.precio.toString(), categoriaId: item.categoriaId ?? '', destacado: item.destacado, imagenUrl: item.imagenUrl ?? '' });
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
    finally { setSaving(null); setCatModal(false); setEditCat(null); setCatForm({ nombre:'', icono:'🍽️' }); }
  }

  // ─── Galería actions ──────────────────────────────────────────────────────────

  async function saveGal() {
    if (!galForm.titulo) return;
    setSaving('gal-new');
    try {
      if (editingGal) {
        await fetch(`/api/${tenant}/galeria/${editingGal.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(galForm) });
        setGaleria(prev => prev.map(g => g.id === editingGal.id ? { ...g, ...galForm } : g));
        showToast('Guardado');
      } else {
        const res = await fetch(`/api/${tenant}/galeria`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(galForm) });
        const created = await res.json();
        setGaleria(prev => [...prev, { id: created.id, activo: true, ...galForm }]);
        showToast('Imagen agregada');
      }
    } catch { showToast('Error'); }
    finally { setSaving(null); setGalModal(false); setEditGal(null); setGalForm({ titulo:'', urlImagen:'', altText:'', seccion:'Galería', orden:0 }); }
  }

  async function deleteGal(id: string) {
    if (!confirm('¿Eliminar esta imagen?')) return;
    setSaving('gal-' + id);
    try {
      await fetch(`/api/${tenant}/galeria/${id}`, { method: 'DELETE' });
      setGaleria(prev => prev.filter(g => g.id !== id));
      showToast('Eliminado');
    } catch { showToast('Error'); }
    finally { setSaving(null); }
  }

  async function patchGal(id: string, fields: object) {
    setSaving('gal-' + id);
    try {
      await fetch(`/api/${tenant}/galeria/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
      setGaleria(prev => prev.map(g => g.id === id ? { ...g, ...(fields as Partial<GaleriaItem>) } : g));
      showToast('Guardado');
    } catch { showToast('Error'); }
    finally { setSaving(null); }
  }

  // ─── Testimonios actions ──────────────────────────────────────────────────────

  async function saveTest() {
    if (!testForm.nombre || !testForm.testimonio) return;
    setSaving('test-new');
    try {
      if (editingTest) {
        await fetch(`/api/${tenant}/testimonios/${editingTest.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(testForm) });
        setTestimonios(prev => prev.map(t => t.id === editingTest.id ? { ...t, ...testForm } : t));
        showToast('Guardado');
      } else {
        const res = await fetch(`/api/${tenant}/testimonios`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(testForm) });
        const created = await res.json();
        setTestimonios(prev => [...prev, { id: created.id, activo: true, ...testForm }]);
        showToast('Reseña agregada');
      }
    } catch { showToast('Error'); }
    finally { setSaving(null); setTestModal(false); setEditTest(null); setTestForm({ nombre:'', testimonio:'', calificacion:5, contexto:'', plataforma:'Google' }); }
  }

  async function deleteTest(id: string) {
    if (!confirm('¿Eliminar esta reseña?')) return;
    setSaving('test-' + id);
    try {
      await fetch(`/api/${tenant}/testimonios/${id}`, { method: 'DELETE' });
      setTestimonios(prev => prev.filter(t => t.id !== id));
      showToast('Eliminado');
    } catch { showToast('Error'); }
    finally { setSaving(null); }
  }

  async function patchTest(id: string, fields: object) {
    setSaving('test-' + id);
    try {
      await fetch(`/api/${tenant}/testimonios/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
      setTestimonios(prev => prev.map(t => t.id === id ? { ...t, ...(fields as Partial<Testimonio>) } : t));
      showToast('Guardado');
    } catch { showToast('Error'); }
    finally { setSaving(null); }
  }

  // ─── Promociones actions ──────────────────────────────────────────────────────

  async function savePromo() {
    if (!promoForm.titulo) return;
    setSaving('promo-new');
    try {
      if (editingPromo) {
        await fetch(`/api/${tenant}/promociones/${editingPromo.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(promoForm) });
        setPromociones(prev => prev.map(p => p.id === editingPromo.id ? { ...p, ...promoForm } : p));
        showToast('Guardado');
      } else {
        const res = await fetch(`/api/${tenant}/promociones`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(promoForm) });
        const created = await res.json();
        setPromociones(prev => [...prev, { id: created.id, activo: true, ...promoForm }]);
        showToast('Promoción agregada');
      }
    } catch { showToast('Error'); }
    finally { setSaving(null); setPromoModal(false); setEditPromo(null); setPromoForm({ titulo:'', descripcion:'', descuento:0, tipo:'Especial', imagenUrl:'', fechaInicio:'', fechaFin:'' }); }
  }

  async function deletePromo(id: string) {
    if (!confirm('¿Eliminar esta promoción?')) return;
    setSaving('promo-' + id);
    try {
      await fetch(`/api/${tenant}/promociones/${id}`, { method: 'DELETE' });
      setPromociones(prev => prev.filter(p => p.id !== id));
      showToast('Eliminado');
    } catch { showToast('Error'); }
    finally { setSaving(null); }
  }

  async function patchPromo(id: string, fields: object) {
    setSaving('promo-' + id);
    try {
      await fetch(`/api/${tenant}/promociones/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
      setPromociones(prev => prev.map(p => p.id === id ? { ...p, ...(fields as Partial<Promocion>) } : p));
      showToast('Guardado');
    } catch { showToast('Error'); }
    finally { setSaving(null); }
  }

  // ─── Horarios actions ─────────────────────────────────────────────────────────

  async function patchHorario(id: string, fields: object) {
    setSaving('hor-' + id);
    try {
      await fetch(`/api/${tenant}/horarios/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
      setHorarios(prev => prev.map(h => h.id === id ? { ...h, ...(fields as Partial<Horario>) } : h));
      showToast('Guardado');
    } catch { showToast('Error'); }
    finally { setSaving(null); }
  }

  async function createHorarioBase() {
    setSaving('hor-base');
    const days = [
      { dia:'Lunes',    horaApertura:'07:00', horaCierre:'21:00', cerrado:false, nota:'', orden:1 },
      { dia:'Martes',   horaApertura:'07:00', horaCierre:'21:00', cerrado:false, nota:'', orden:2 },
      { dia:'Miércoles',horaApertura:'07:00', horaCierre:'21:00', cerrado:false, nota:'', orden:3 },
      { dia:'Jueves',   horaApertura:'07:00', horaCierre:'21:00', cerrado:false, nota:'', orden:4 },
      { dia:'Viernes',  horaApertura:'07:00', horaCierre:'21:00', cerrado:false, nota:'', orden:5 },
      { dia:'Sábado',   horaApertura:'08:00', horaCierre:'22:00', cerrado:false, nota:'', orden:6 },
      { dia:'Domingo',  horaApertura:'08:00', horaCierre:'18:00', cerrado:false, nota:'', orden:7 },
    ];
    try {
      const created = [];
      for (const d of days) {
        const res = await fetch(`/api/${tenant}/horarios`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
        const row = await res.json();
        created.push({ id: row.id, ...d });
      }
      setHorarios(created);
      showToast('Horarios base creados');
    } catch { showToast('Error creando horarios'); }
    finally { setSaving(null); }
  }

  const daily  = items.filter(i => i.platoDelDia);
  const activeCount = items.filter(i => i.activo).length;

  return (
    <>
      <div className="pg-title">Website</div>
      <div className="pg-sub">
        {client?.name} ·{' '}
        {client?.website && (
          <a href={client.website} target="_blank" rel="noopener"
            style={{ color:'var(--accent-1)', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4 }}>
            <ExternalIcon size={11} /> {client.website}
          </a>
        )}
      </div>

      <div className="tabs" style={{ flexWrap:'wrap' }}>
        {([
          ['menu',        '🍽️ Menú'],
          ['daily',       '☀️ Del Día'],
          ['horarios',    '🕐 Horarios'],
          ['testimonios', '💬 Reseñas'],
          ['galeria',     '🖼️ Galería'],
          ['promociones', '🎁 Promos'],
          ['contacto',    '📋 Contacto'],
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
          {/* ── MENÚ TAB ──────────────────────────────────────────────────── */}
          {tab === 'menu' && (
            <>
              <div className="card" style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding:'10px 16px', background:'var(--bg-elevated)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontFamily:'Syne', fontWeight:700, fontSize:13 }}>Categorías</span>
                  <button className="btn-primary" style={{ fontSize:11, padding:'4px 10px' }}
                    onClick={() => { setEditCat(null); setCatForm({ nombre:'', icono:'🍽️' }); setCatModal(true); }}>
                    <PlusIcon size={11} /> Nueva
                  </button>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, padding:'12px 16px' }}>
                  {categories.map(cat => (
                    <div key={cat.id} style={{ display:'flex', alignItems:'center', gap:8, background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', opacity: saving === 'cat-'+cat.id ? 0.6 : 1 }}>
                      <span style={{ fontSize:15 }}>{cat.icono}</span>
                      <span style={{ fontWeight:600, fontSize:12.5 }}>{cat.nombre}</span>
                      <button title={cat.modoVista ? 'Modo Imagen' : 'Modo Icono'} onClick={() => patchCat(cat.id, { modoVista: !cat.modoVista })}
                        style={{ background: cat.modoVista ? 'rgba(99,102,241,.15)' : 'var(--bg-hover)', border: '1px solid ' + (cat.modoVista ? 'rgba(99,102,241,.4)' : 'var(--border)'), borderRadius:6, padding:'2px 7px', fontSize:10.5, cursor:'pointer', color: cat.modoVista ? '#818cf8' : 'var(--text-3)', fontWeight:600 }}>
                        {cat.modoVista ? '🖼️ Imagen' : '🔷 Icono'}
                      </button>
                      <button className="abtn abtn-edit" style={{ padding:'2px 6px' }} onClick={() => { setEditCat(cat); setCatForm({ nombre:cat.nombre, icono:cat.icono }); setCatModal(true); }}><EditIcon size={11} /></button>
                      <button className="abtn abtn-canc" style={{ padding:'2px 6px' }} onClick={() => deleteCat(cat.id)}><TrashIcon size={11} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div style={{ fontSize:13, color:'var(--text-2)' }}>{items.length} items · {activeCount} activos</div>
                <button className="btn-primary" onClick={() => { setEditItem(null); setItemForm({ nombre:'', descripcion:'', precio:'', categoriaId: categories[0]?.id ?? '', destacado:false, imagenUrl:'' }); setItemModal(true); }}>
                  <PlusIcon size={13} /> Agregar item
                </button>
              </div>

              {categories.map(cat => {
                const catItems = items.filter(i => i.categoriaId === cat.id);
                if (!catItems.length) return null;
                const imgMode = cat.modoVista;
                return (
                  <div key={cat.id} className="card" style={{ marginBottom:12, padding:0, overflow:'hidden' }}>
                    <div style={{ padding:'10px 16px', background:'var(--bg-elevated)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontFamily:'Syne', fontWeight:700, fontSize:13.5 }}>{cat.icono} {cat.nombre}</span>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        {imgMode && <span style={{ fontSize:10, background:'rgba(99,102,241,.12)', color:'#818cf8', padding:'1px 7px', borderRadius:20, fontWeight:700 }}>🖼️ Modo imagen</span>}
                        <span style={{ fontSize:11, color:'var(--text-3)' }}>{catItems.length} items</span>
                      </div>
                    </div>
                    {catItems.map(item => (
                      <div key={item.id} className="menu-item-row" style={{ opacity: saving === item.id ? 0.6 : 1 }}>
                        {imgMode && (
                          <div style={{ width:44, height:44, borderRadius:8, overflow:'hidden', background:'var(--bg-elevated)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            {item.imagenUrl ? <img src={item.imagenUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:11, color:'var(--text-3)' }}>sin img</span>}
                          </div>
                        )}
                        <div className="mitem-info">
                          <div className="mitem-name">
                            {item.nombre}
                            {item.destacado   && <span style={{ marginLeft:6, fontSize:9.5, background:'rgba(245,158,11,.15)', color:'var(--yellow)', padding:'1px 6px', borderRadius:4, fontWeight:700 }}>★ Dest.</span>}
                            {item.platoDelDia && <span style={{ marginLeft:4, fontSize:9.5, background:'rgba(251,191,36,.15)', color:'#f59e0b', padding:'1px 6px', borderRadius:4, fontWeight:700 }}>☀️ Hoy</span>}
                            {imgMode && !item.imagenUrl && <span style={{ marginLeft:4, fontSize:9.5, background:'rgba(239,68,68,.12)', color:'var(--red)', padding:'1px 6px', borderRadius:4, fontWeight:700 }}>sin foto</span>}
                          </div>
                          <div className="mitem-cat">{item.descripcion}</div>
                        </div>
                        <div className="mitem-price">Gs {item.precio.toLocaleString('es-PY')}</div>
                        <span className={`badge badge-${item.activo ? 'confirmed' : 'inactive'}`} style={{ cursor:'pointer' }} onClick={() => patchItem(item.id, { activo: !item.activo })}>
                          {item.activo ? 'Activo' : 'Oculto'}
                        </span>
                        <div style={{ display:'flex', gap:4 }}>
                          <button className="abtn abtn-edit" onClick={() => openEditItem(item)}><EditIcon size={12} /></button>
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

          {/* ── COMIDAS DEL DÍA ───────────────────────────────────────────── */}
          {tab === 'daily' && (
            <>
              <div className="card" style={{ marginBottom:20, borderLeft:'3px solid #f59e0b' }}>
                <div className="card-hd">
                  <div className="card-title">☀️ Hoy en {client?.name}</div>
                  <span style={{ fontSize:12, color:'var(--text-3)' }}>{daily.length} seleccionado{daily.length !== 1 ? 's' : ''}</span>
                </div>
                {daily.length === 0 ? (
                  <div style={{ fontSize:13, color:'var(--text-3)', paddingTop:4 }}>Ningún item marcado como plato del día</div>
                ) : (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8, paddingTop:4 }}>
                    {daily.map(item => (
                      <div key={item.id} style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.3)', borderRadius:8, padding:'6px 12px' }}>
                        <span style={{ fontWeight:600, fontSize:13 }}>{item.nombre}</span>
                        <span style={{ fontSize:12, color:'var(--text-2)' }}>Gs {item.precio.toLocaleString('es-PY')}</span>
                        <button onClick={() => patchItem(item.id, { platoDelDia: false })} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', fontSize:14, padding:0 }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ fontSize:13, color:'var(--text-2)', marginBottom:12, fontWeight:600 }}>Seleccioná del menú completo:</div>
              {categories.map(cat => {
                const catItems = items.filter(i => i.categoriaId === cat.id && i.activo);
                if (!catItems.length) return null;
                return (
                  <div key={cat.id} className="card" style={{ marginBottom:12, padding:0, overflow:'hidden' }}>
                    <div style={{ padding:'10px 16px', background:'var(--bg-elevated)', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ fontFamily:'Syne', fontWeight:700, fontSize:13 }}>{cat.icono} {cat.nombre}</span>
                    </div>
                    {catItems.map(item => (
                      <div key={item.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderBottom:'1px solid var(--border)', background: item.platoDelDia ? 'rgba(245,158,11,.06)' : 'transparent', opacity: saving === item.id ? 0.6 : 1, cursor:'pointer' }}
                        onClick={() => patchItem(item.id, { platoDelDia: !item.platoDelDia })}>
                        <div style={{ width:20, height:20, borderRadius:5, border:`2px solid ${item.platoDelDia ? '#f59e0b' : 'var(--border)'}`, background: item.platoDelDia ? '#f59e0b' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          {item.platoDelDia && <span style={{ color:'#fff', fontSize:12, fontWeight:700 }}>✓</span>}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:600, fontSize:13 }}>{item.nombre}</div>
                          <div style={{ fontSize:11, color:'var(--text-2)' }}>{item.descripcion}</div>
                        </div>
                        <div style={{ fontSize:13, fontWeight:600, color:'var(--text-2)' }}>Gs {item.precio.toLocaleString('es-PY')}</div>
                        {item.platoDelDia && <span style={{ fontSize:10, background:'rgba(245,158,11,.2)', color:'#f59e0b', padding:'2px 8px', borderRadius:20, fontWeight:700 }}>☀️ Del día</span>}
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          )}

          {/* ── HORARIOS ──────────────────────────────────────────────────── */}
          {tab === 'horarios' && (
            <div className="card" style={{ maxWidth:560 }}>
              <div className="card-hd">
                <div className="card-title">Horarios de atención</div>
                {horarios.length === 0 && saving !== 'hor-base' && (
                  <button className="btn-primary" style={{ fontSize:12, padding:'5px 12px' }} onClick={createHorarioBase}>
                    + Crear horarios base
                  </button>
                )}
                {saving === 'hor-base' && <span style={{ fontSize:12, color:'var(--text-3)' }}>Creando…</span>}
              </div>
              {horarios.length === 0 && saving !== 'hor-base' ? (
                <div className="empty">Sin horarios. Hacé clic en "Crear horarios base" para comenzar.</div>
              ) : (
                horarios.map(h => (
                  <div key={h.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)', opacity: saving === 'hor-'+h.id ? 0.6 : 1 }}>
                    <div style={{ minWidth:100, fontWeight:600, fontSize:13 }}>{h.dia}</div>
                    <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, cursor:'pointer' }}>
                      <input type="checkbox" checked={h.cerrado}
                        onChange={e => patchHorario(h.id, { cerrado: e.target.checked })}
                        style={{ accentColor:'var(--red)' }} />
                      Cerrado
                    </label>
                    {!h.cerrado && (
                      <>
                        <input type="time" className="field-input" style={{ width:100 }} value={h.horaApertura}
                          onChange={e => setHorarios(prev => prev.map(x => x.id === h.id ? { ...x, horaApertura: e.target.value } : x))}
                          onBlur={e => patchHorario(h.id, { horaApertura: e.target.value })} />
                        <span style={{ color:'var(--text-3)' }}>→</span>
                        <input type="time" className="field-input" style={{ width:100 }} value={h.horaCierre}
                          onChange={e => setHorarios(prev => prev.map(x => x.id === h.id ? { ...x, horaCierre: e.target.value } : x))}
                          onBlur={e => patchHorario(h.id, { horaCierre: e.target.value })} />
                      </>
                    )}
                    {h.nota && <span style={{ fontSize:11, color:'var(--text-3)', fontStyle:'italic' }}>{h.nota}</span>}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── RESEÑAS / TESTIMONIOS ─────────────────────────────────────── */}
          {tab === 'testimonios' && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div style={{ fontSize:13, color:'var(--text-2)' }}>{testimonios.length} reseñas · {testimonios.filter(t => t.activo).length} visibles</div>
                <button className="btn-primary" onClick={() => { setEditTest(null); setTestForm({ nombre:'', testimonio:'', calificacion:5, contexto:'', plataforma:'Google' }); setTestModal(true); }}>
                  <PlusIcon size={13} /> Agregar reseña
                </button>
              </div>
              {testimonios.length === 0 ? (
                <div className="empty">Sin reseñas aún.</div>
              ) : (
                testimonios.map(t => (
                  <div key={t.id} className="card" style={{ marginBottom:10, opacity: saving === 'test-'+t.id ? 0.6 : 1 }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:13 }}>{t.nombre}</div>
                        <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:6 }}>{t.contexto} · {t.plataforma} · {'★'.repeat(t.calificacion)}</div>
                        <div style={{ fontSize:13, color:'var(--text-2)', fontStyle:'italic' }}>"{t.testimonio}"</div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end', flexShrink:0 }}>
                        <span className={`badge badge-${t.activo ? 'confirmed' : 'inactive'}`} style={{ cursor:'pointer' }} onClick={() => patchTest(t.id, { activo: !t.activo })}>
                          {t.activo ? 'Visible' : 'Oculta'}
                        </span>
                        <div style={{ display:'flex', gap:4 }}>
                          <button className="abtn abtn-edit" onClick={() => { setEditTest(t); setTestForm({ nombre:t.nombre, testimonio:t.testimonio, calificacion:t.calificacion, contexto:t.contexto, plataforma:t.plataforma }); setTestModal(true); }}><EditIcon size={11} /></button>
                          <button className="abtn abtn-canc" onClick={() => deleteTest(t.id)}><TrashIcon size={11} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* ── GALERÍA ───────────────────────────────────────────────────── */}
          {tab === 'galeria' && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div style={{ fontSize:13, color:'var(--text-2)' }}>{galeria.length} imágenes · {galeria.filter(g => g.activo).length} activas</div>
                <button className="btn-primary" onClick={() => { setEditGal(null); setGalForm({ titulo:'', urlImagen:'', altText:'', seccion:'Galería', orden:galeria.length }); setGalModal(true); }}>
                  <PlusIcon size={13} /> Agregar imagen
                </button>
              </div>
              {galeria.length === 0 ? (
                <div className="empty">Sin imágenes en galería.</div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12 }}>
                  {galeria.map(g => (
                    <div key={g.id} style={{ border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', opacity: saving === 'gal-'+g.id ? 0.6 : 1 }}>
                      <div style={{ height:120, background:'var(--bg-elevated)', position:'relative' }}>
                        {g.urlImagen
                          ? <img src={g.urlImagen} alt={g.altText} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'var(--text-3)' }}>Sin imagen</div>}
                        <span style={{ position:'absolute', top:6, right:6, background: g.activo ? 'var(--green)' : 'var(--bg-hover)', color: g.activo ? '#fff' : 'var(--text-3)', fontSize:9, padding:'2px 7px', borderRadius:20, fontWeight:700, cursor:'pointer' }}
                          onClick={() => patchGal(g.id, { activo: !g.activo })}>
                          {g.activo ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <div style={{ padding:'8px 10px' }}>
                        <div style={{ fontWeight:600, fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.titulo}</div>
                        <div style={{ fontSize:10, color:'var(--text-3)', marginTop:2 }}>{g.seccion} · #{g.orden}</div>
                      </div>
                      <div style={{ display:'flex', gap:4, padding:'0 10px 8px' }}>
                        <button className="abtn abtn-edit" style={{ flex:1, justifyContent:'center' }} onClick={() => { setEditGal(g); setGalForm({ titulo:g.titulo, urlImagen:g.urlImagen, altText:g.altText, seccion:g.seccion, orden:g.orden }); setGalModal(true); }}><EditIcon size={11} /> Editar</button>
                        <button className="abtn abtn-canc" style={{ padding:'4px 8px' }} onClick={() => deleteGal(g.id)}><TrashIcon size={11} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── PROMOCIONES ───────────────────────────────────────────────── */}
          {tab === 'promociones' && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div style={{ fontSize:13, color:'var(--text-2)' }}>{promociones.length} promociones · {promociones.filter(p => p.activo).length} activas</div>
                <button className="btn-primary" onClick={() => { setEditPromo(null); setPromoForm({ titulo:'', descripcion:'', descuento:0, tipo:'Especial', imagenUrl:'', fechaInicio:'', fechaFin:'' }); setPromoModal(true); }}>
                  <PlusIcon size={13} /> Nueva promo
                </button>
              </div>
              {promociones.length === 0 ? (
                <div className="empty">Sin promociones creadas.</div>
              ) : (
                promociones.map(p => (
                  <div key={p.id} className="card" style={{ marginBottom:10, opacity: saving === 'promo-'+p.id ? 0.6 : 1 }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                      {p.imagenUrl && <img src={p.imagenUrl} alt="" style={{ width:72, height:72, objectFit:'cover', borderRadius:8, flexShrink:0 }} />}
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:13 }}>{p.titulo}</div>
                        <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:4 }}>
                          {p.tipo} · {p.descuento > 0 ? `${p.descuento}${p.tipo === 'Porcentaje' ? '%' : ' Gs'} desc.` : 'Sin descuento numérico'}
                          {p.fechaInicio && ` · Desde ${p.fechaInicio}`}
                          {p.fechaFin && ` hasta ${p.fechaFin}`}
                        </div>
                        <div style={{ fontSize:12, color:'var(--text-2)' }}>{p.descripcion}</div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end', flexShrink:0 }}>
                        <span className={`badge badge-${p.activo ? 'confirmed' : 'inactive'}`} style={{ cursor:'pointer' }} onClick={() => patchPromo(p.id, { activo: !p.activo })}>
                          {p.activo ? 'Activa' : 'Inactiva'}
                        </span>
                        <div style={{ display:'flex', gap:4 }}>
                          <button className="abtn abtn-edit" onClick={() => { setEditPromo(p); setPromoForm({ titulo:p.titulo, descripcion:p.descripcion, descuento:p.descuento, tipo:p.tipo, imagenUrl:p.imagenUrl, fechaInicio:p.fechaInicio, fechaFin:p.fechaFin }); setPromoModal(true); }}><EditIcon size={11} /></button>
                          <button className="abtn abtn-canc" onClick={() => deletePromo(p.id)}><TrashIcon size={11} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* ── CONTACTO ──────────────────────────────────────────────────── */}
          {tab === 'contacto' && (
            <div className="card" style={{ maxWidth:560 }}>
              <div className="card-hd"><div className="card-title">Información de contacto</div></div>
              <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                {([
                  { label:'Nombre del negocio', val: client?.name ?? '' },
                  { label:'Teléfono / WhatsApp', val: client?.phone ?? '' },
                  { label:'Email',               val: client?.email ?? '' },
                  { label:'Dirección',           val: client?.address ?? '' },
                  { label:'Instagram',           val: client?.instagram ?? '' },
                ]).map(f => (
                  <div key={f.label} className="field-group">
                    <label className="field-label">{f.label}</label>
                    <input className="field-input" defaultValue={f.val} />
                  </div>
                ))}
                <button className="btn-primary" style={{ alignSelf:'flex-start', marginTop:8 }}
                  onClick={() => showToast('Próximamente: edición de contacto desde Notion')}>Guardar cambios</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modal item ──────────────────────────────────────────────────────── */}
      <div className={`modal-ov ${itemModal ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setItemModal(false)}>
        <div className="modal">
          <div className="modal-hd">
            <div className="modal-title">{editingItem ? 'Editar item' : 'Nuevo item'}</div>
            <button className="modal-x" onClick={() => setItemModal(false)}>✕</button>
          </div>
          <div className="field-group">
            <label className="field-label">Categoría</label>
            <select className="field-input" value={itemForm.categoriaId} onChange={e => setItemForm(p => ({ ...p, categoriaId: e.target.value }))}>
              <option value="">— Seleccionar —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>)}
            </select>
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
              <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:12.5, cursor:'pointer', paddingTop:10 }}>
                <input type="checkbox" checked={itemForm.destacado} onChange={e => setItemForm(p => ({ ...p, destacado: e.target.checked }))} style={{ accentColor:'var(--accent-1)', width:14, height:14 }} />
                Destacado
              </label>
            </div>
          </div>
          {(() => {
            const selectedCat = categories.find(c => c.id === itemForm.categoriaId);
            return selectedCat?.modoVista ? (
              <div className="field-group">
                <label className="field-label">URL de imagen</label>
                <input className="field-input" placeholder="https://..." value={itemForm.imagenUrl} onChange={e => setItemForm(p => ({ ...p, imagenUrl: e.target.value }))} />
                {itemForm.imagenUrl && <img src={itemForm.imagenUrl} alt="" onError={e => (e.currentTarget.style.display='none')} style={{ marginTop:8, width:'100%', height:120, objectFit:'cover', borderRadius:8 }} />}
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
        <div className="modal" style={{ maxWidth:380 }}>
          <div className="modal-hd">
            <div className="modal-title">{editingCat ? 'Editar categoría' : 'Nueva categoría'}</div>
            <button className="modal-x" onClick={() => setCatModal(false)}>✕</button>
          </div>
          <div className="m-row">
            <div className="field-group" style={{ flex:'0 0 72px' }}>
              <label className="field-label">Emoji</label>
              <input className="field-input" style={{ textAlign:'center', fontSize:20 }} maxLength={4} value={catForm.icono} onChange={e => setCatForm(p => ({ ...p, icono: e.target.value }))} />
            </div>
            <div className="field-group">
              <label className="field-label">Nombre</label>
              <input className="field-input" placeholder="ej. Pizzas, Bebidas..." value={catForm.nombre} onChange={e => setCatForm(p => ({ ...p, nombre: e.target.value }))} />
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

      {/* ── Modal galería ────────────────────────────────────────────────────── */}
      <div className={`modal-ov ${galModal ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setGalModal(false)}>
        <div className="modal">
          <div className="modal-hd">
            <div className="modal-title">{editingGal ? 'Editar imagen' : 'Nueva imagen'}</div>
            <button className="modal-x" onClick={() => setGalModal(false)}>✕</button>
          </div>
          <div className="field-group">
            <label className="field-label">Título</label>
            <input className="field-input" placeholder="ej. Salón principal" value={galForm.titulo} onChange={e => setGalForm(p => ({ ...p, titulo: e.target.value }))} />
          </div>
          <div className="field-group">
            <label className="field-label">URL de imagen</label>
            <input className="field-input" placeholder="https://..." value={galForm.urlImagen} onChange={e => setGalForm(p => ({ ...p, urlImagen: e.target.value }))} />
            {galForm.urlImagen && <img src={galForm.urlImagen} alt="" onError={e => (e.currentTarget.style.display='none')} style={{ marginTop:8, width:'100%', height:140, objectFit:'cover', borderRadius:8 }} />}
          </div>
          <div className="m-row">
            <div className="field-group">
              <label className="field-label">Sección</label>
              <select className="field-input" value={galForm.seccion} onChange={e => setGalForm(p => ({ ...p, seccion: e.target.value }))}>
                {['Galería','Hero','Carta','Equipo','Fondo','Otro'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Orden</label>
              <input type="number" className="field-input" value={galForm.orden} onChange={e => setGalForm(p => ({ ...p, orden: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Alt text (accesibilidad)</label>
            <input className="field-input" placeholder="Descripción de la imagen..." value={galForm.altText} onChange={e => setGalForm(p => ({ ...p, altText: e.target.value }))} />
          </div>
          <div className="modal-foot">
            <button className="btn-sec" onClick={() => setGalModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={saveGal} disabled={saving === 'gal-new'}>
              {saving === 'gal-new' ? 'Guardando…' : editingGal ? 'Guardar cambios' : 'Agregar imagen'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal testimonio ─────────────────────────────────────────────────── */}
      <div className={`modal-ov ${testModal ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setTestModal(false)}>
        <div className="modal">
          <div className="modal-hd">
            <div className="modal-title">{editingTest ? 'Editar reseña' : 'Nueva reseña'}</div>
            <button className="modal-x" onClick={() => setTestModal(false)}>✕</button>
          </div>
          <div className="m-row">
            <div className="field-group">
              <label className="field-label">Nombre</label>
              <input className="field-input" placeholder="María González" value={testForm.nombre} onChange={e => setTestForm(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div className="field-group">
              <label className="field-label">Contexto</label>
              <input className="field-input" placeholder="Cliente habitual" value={testForm.contexto} onChange={e => setTestForm(p => ({ ...p, contexto: e.target.value }))} />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Reseña</label>
            <textarea className="field-input" placeholder="Texto de la reseña..." value={testForm.testimonio} onChange={e => setTestForm(p => ({ ...p, testimonio: e.target.value }))} style={{ minHeight:80, resize:'vertical' }} />
          </div>
          <div className="m-row">
            <div className="field-group">
              <label className="field-label">Calificación</label>
              <select className="field-input" value={testForm.calificacion} onChange={e => setTestForm(p => ({ ...p, calificacion: parseInt(e.target.value) }))}>
                {[5,4,3,2,1].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Plataforma</label>
              <select className="field-input" value={testForm.plataforma} onChange={e => setTestForm(p => ({ ...p, plataforma: e.target.value }))}>
                {['Google','Facebook','Instagram','Directo','TripAdvisor'].map(pl => <option key={pl}>{pl}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-foot">
            <button className="btn-sec" onClick={() => setTestModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={saveTest} disabled={saving === 'test-new'}>
              {saving === 'test-new' ? 'Guardando…' : editingTest ? 'Guardar cambios' : 'Agregar reseña'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal promoción ──────────────────────────────────────────────────── */}
      <div className={`modal-ov ${promoModal ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setPromoModal(false)}>
        <div className="modal">
          <div className="modal-hd">
            <div className="modal-title">{editingPromo ? 'Editar promoción' : 'Nueva promoción'}</div>
            <button className="modal-x" onClick={() => setPromoModal(false)}>✕</button>
          </div>
          <div className="field-group">
            <label className="field-label">Título</label>
            <input className="field-input" placeholder="ej. 2x1 en cafés los martes" value={promoForm.titulo} onChange={e => setPromoForm(p => ({ ...p, titulo: e.target.value }))} />
          </div>
          <div className="field-group">
            <label className="field-label">Descripción</label>
            <textarea className="field-input" placeholder="Detalles de la promo..." value={promoForm.descripcion} onChange={e => setPromoForm(p => ({ ...p, descripcion: e.target.value }))} style={{ minHeight:70, resize:'vertical' }} />
          </div>
          <div className="m-row">
            <div className="field-group">
              <label className="field-label">Tipo</label>
              <select className="field-input" value={promoForm.tipo} onChange={e => setPromoForm(p => ({ ...p, tipo: e.target.value }))}>
                {['Porcentaje','Monto fijo','Especial','2x1'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Descuento</label>
              <input type="number" className="field-input" placeholder="10" value={promoForm.descuento} onChange={e => setPromoForm(p => ({ ...p, descuento: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>
          <div className="m-row">
            <div className="field-group">
              <label className="field-label">Fecha inicio</label>
              <input type="date" className="field-input" value={promoForm.fechaInicio} onChange={e => setPromoForm(p => ({ ...p, fechaInicio: e.target.value }))} />
            </div>
            <div className="field-group">
              <label className="field-label">Fecha fin</label>
              <input type="date" className="field-input" value={promoForm.fechaFin} onChange={e => setPromoForm(p => ({ ...p, fechaFin: e.target.value }))} />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">URL imagen (opcional)</label>
            <input className="field-input" placeholder="https://..." value={promoForm.imagenUrl} onChange={e => setPromoForm(p => ({ ...p, imagenUrl: e.target.value }))} />
          </div>
          <div className="modal-foot">
            <button className="btn-sec" onClick={() => setPromoModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={savePromo} disabled={saving === 'promo-new'}>
              {saving === 'promo-new' ? 'Guardando…' : editingPromo ? 'Guardar cambios' : 'Agregar promo'}
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
