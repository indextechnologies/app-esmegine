'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useClient } from '../../../lib/use-clients';
import { PlusIcon, EditIcon, TrashIcon, ExternalIcon, ClockIcon, MessageIcon, ImageIcon, TagIcon, FileTextIcon, CameraIcon } from '../../../components/Icons';

type Client = import('../../../lib/use-clients').Client;

function ContactoTab({ tenant, client }: { tenant: string; client: Client | null }) {
  const [form, setForm] = useState({
    telefono:  client?.phone    ?? '',
    email:     client?.email    ?? '',
    direccion: client?.address  ?? '',
    instagram: client?.instagram ?? '',
    website:   client?.website  ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState('');

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/${tenant}/contacto`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      showToast('Guardado correctamente');
    } catch { showToast('Error al guardar'); }
    finally { setSaving(false); }
  }

  return (
    <div className="card" style={{ maxWidth: 560 }}>
      <div className="card-hd"><div className="card-title">Información de contacto</div></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div className="field-group">
          <label className="field-label">Nombre del negocio</label>
          <input className="field-input" value={client?.name ?? ''} readOnly style={{ opacity: 0.6, cursor: 'default' }} />
        </div>
        {([
          { label: 'Teléfono / WhatsApp', key: 'telefono'  as const },
          { label: 'Email',               key: 'email'     as const },
          { label: 'Dirección',           key: 'direccion' as const },
          { label: 'Instagram',           key: 'instagram' as const },
          { label: 'URL Website',         key: 'website'   as const },
        ]).map(f => (
          <div key={f.key} className="field-group">
            <label className="field-label">{f.label}</label>
            <input className="field-input" value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
          </div>
        ))}
        <button className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: 8 }} onClick={save} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
      <div className={`toast ${toast ? 'show' : ''}`}>
        <div className="toast-ic">✓</div>
        {toast}
      </div>
    </div>
  );
}

type Horario     = { id: string; dia: string; horaApertura: string; horaCierre: string; cerrado: boolean; nota: string; orden: number; };
type GaleriaItem = { id: string; titulo: string; urlImagen: string; altText: string; seccion: string; activo: boolean; orden: number; };
type Testimonio  = { id: string; nombre: string; testimonio: string; calificacion: number; contexto: string; plataforma: string; activo: boolean; };
type Promocion   = { id: string; titulo: string; descripcion: string; descuento: number; tipo: string; imagenUrl: string; fechaInicio: string; fechaFin: string; activo: boolean; };
type IgLink      = { id: string; titulo: string; urlPost: string; imagenUrl: string; activo: boolean; orden: number; tipo: string; };

type Tab = 'horarios' | 'testimonios' | 'galeria' | 'promociones' | 'contacto' | 'instagram';

const DIAS_BASE = [
  { dia: 'Lunes',     orden: 1 },
  { dia: 'Martes',    orden: 2 },
  { dia: 'Miércoles', orden: 3 },
  { dia: 'Jueves',    orden: 4 },
  { dia: 'Viernes',   orden: 5 },
  { dia: 'Sábado',    orden: 6 },
  { dia: 'Domingo',   orden: 7 },
];

export default function ContenidoPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const { client } = useClient(tenant);

  const [tab, setTab]               = useState<Tab>('testimonios');
  const [horarios, setHorarios]     = useState<Horario[]>([]);
  const [galeria, setGaleria]       = useState<GaleriaItem[]>([]);
  const [testimonios, setTestimonios] = useState<Testimonio[]>([]);
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [igLinks, setIgLinks]       = useState<IgLink[]>([]);
  const [loaded, setLoaded]         = useState<Record<Tab, boolean>>({ horarios: false, testimonios: false, galeria: false, promociones: false, contacto: true, instagram: false });
  const [saving, setSaving]         = useState<string | null>(null);
  const [toast, setToast]           = useState('');

  // Galería modal
  const [galModal, setGalModal]   = useState(false);
  const [editingGal, setEditGal]  = useState<GaleriaItem | null>(null);
  const [galForm, setGalForm]     = useState({ titulo: '', urlImagen: '', altText: '', seccion: 'Galería', orden: 0 });

  // Testimonio modal
  const [testModal, setTestModal]   = useState(false);
  const [editingTest, setEditTest]  = useState<Testimonio | null>(null);
  const [testForm, setTestForm]     = useState({ nombre: '', testimonio: '', calificacion: 5, contexto: '', plataforma: 'Google' });

  // Instagram modal
  const [igModal, setIgModal] = useState(false);
  const [igForm, setIgForm]   = useState({ titulo: '', urlPost: '', imagenUrl: '', tipo: 'Post' });

  // Promocion modal
  const [promoModal, setPromoModal]   = useState(false);
  const [editingPromo, setEditPromo]  = useState<Promocion | null>(null);
  const [promoForm, setPromoForm]     = useState({ titulo: '', descripcion: '', descuento: 0, tipo: 'Especial', imagenUrl: '', fechaInicio: '', fechaFin: '' });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  // Lazy-load data per tab the first time it's opened.
  useEffect(() => {
    if (loaded[tab]) return;
    const markLoaded = () => setLoaded(l => ({ ...l, [tab]: true }));
    if (tab === 'horarios') {
      fetch(`/api/${tenant}/horarios`).then(r => r.json()).then(async (rows: Horario[]) => {
        const seen = new Set<string>();
        const deduped = rows.filter(h => { if (seen.has(h.dia)) return false; seen.add(h.dia); return true; });
        const existing = new Set(deduped.map(h => h.dia));
        const toCreate = DIAS_BASE.filter(d => !existing.has(d.dia));
        const created: Horario[] = [];
        for (const d of toCreate) {
          try {
            const res = await fetch(`/api/${tenant}/horarios`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dia: d.dia, horaApertura: '07:00', horaCierre: '21:00', cerrado: false, nota: '', orden: d.orden }) });
            const row = await res.json();
            created.push({ id: row.id, dia: d.dia, horaApertura: '07:00', horaCierre: '21:00', cerrado: false, nota: '', orden: d.orden });
          } catch { /* skip */ }
        }
        const all = [...deduped, ...created];
        setHorarios(DIAS_BASE.map(d => all.find(h => h.dia === d.dia)!).filter(Boolean));
      }).catch(() => {}).finally(markLoaded);
    } else if (tab === 'galeria') {
      fetch(`/api/${tenant}/galeria`).then(r => r.json()).then(setGaleria).catch(() => {}).finally(markLoaded);
    } else if (tab === 'testimonios') {
      fetch(`/api/${tenant}/testimonios?activo=all`).then(r => r.json()).then(setTestimonios).catch(() => {}).finally(markLoaded);
    } else if (tab === 'promociones') {
      fetch(`/api/${tenant}/promociones`).then(r => r.json()).then(setPromociones).catch(() => {}).finally(markLoaded);
    } else if (tab === 'instagram') {
      fetch(`/api/${tenant}/instagram`).then(r => r.json()).then(setIgLinks).catch(() => {}).finally(markLoaded);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, tenant]);

  const loadingTab = !loaded[tab];

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
    finally { setSaving(null); setGalModal(false); setEditGal(null); setGalForm({ titulo: '', urlImagen: '', altText: '', seccion: 'Galería', orden: 0 }); }
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
    finally { setSaving(null); setTestModal(false); setEditTest(null); setTestForm({ nombre: '', testimonio: '', calificacion: 5, contexto: '', plataforma: 'Google' }); }
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
    finally { setSaving(null); setPromoModal(false); setEditPromo(null); setPromoForm({ titulo: '', descripcion: '', descuento: 0, tipo: 'Especial', imagenUrl: '', fechaInicio: '', fechaFin: '' }); }
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

  // ─── Instagram actions ────────────────────────────────────────────────────────

  async function saveIg() {
    if (!igForm.urlPost) return;
    setSaving('ig-new');
    try {
      const body = { titulo: igForm.titulo || igForm.urlPost, urlPost: igForm.urlPost, imagenUrl: igForm.imagenUrl, tipo: igForm.tipo, orden: igLinks.length };
      const res = await fetch(`/api/${tenant}/instagram`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const created = await res.json();
      setIgLinks(prev => [...prev, { id: created.id, activo: true, ...body }]);
      showToast('Post agregado');
    } catch { showToast('Error'); }
    finally { setSaving(null); setIgModal(false); setIgForm({ titulo: '', urlPost: '', imagenUrl: '', tipo: 'Post' }); }
  }

  async function deleteIg(id: string) {
    if (!confirm('¿Eliminar este post?')) return;
    setSaving('ig-' + id);
    try {
      await fetch(`/api/${tenant}/instagram/${id}`, { method: 'DELETE' });
      setIgLinks(prev => prev.filter(l => l.id !== id));
      showToast('Eliminado');
    } catch { showToast('Error'); }
    finally { setSaving(null); }
  }

  async function patchIg(id: string, fields: Partial<IgLink>) {
    setSaving('ig-' + id);
    try {
      await fetch(`/api/${tenant}/instagram/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
      setIgLinks(prev => prev.map(l => l.id === id ? { ...l, ...fields } : l));
      showToast('Guardado');
    } catch { showToast('Error'); }
    finally { setSaving(null); }
  }

  return (
    <>
      <div className="pg-title">Contenido</div>
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
          { t: 'testimonios' as Tab, label: 'Reseñas',   icon: <MessageIcon  size={13} /> },
          { t: 'galeria'     as Tab, label: 'Galería',   icon: <ImageIcon    size={13} /> },
          { t: 'instagram'   as Tab, label: 'Instagram', icon: <CameraIcon   size={13} /> },
          { t: 'promociones' as Tab, label: 'Promos',    icon: <TagIcon      size={13} /> },
          { t: 'horarios'    as Tab, label: 'Horarios',  icon: <ClockIcon    size={13} /> },
          { t: 'contacto'    as Tab, label: 'Contacto',  icon: <FileTextIcon size={13} /> },
        ]).map(({ t, label, icon }) => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {icon}{label}
          </button>
        ))}
      </div>

      {loadingTab && tab !== 'contacto' ? (
        <div className="empty" style={{ padding: 48 }}>Cargando…</div>
      ) : (
        <>
          {/* ── HORARIOS ──────────────────────────────────────────────────── */}
          {tab === 'horarios' && (
            <div className="card" style={{ maxWidth: 560 }}>
              <div className="card-hd">
                <div className="card-title">Horarios de atención</div>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Los cambios se guardan al salir del campo</span>
              </div>
              {horarios.length === 0 ? (
                <div className="empty" style={{ padding: 24 }}>Cargando días…</div>
              ) : (
                horarios.map(h => (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)', opacity: saving === 'hor-' + h.id ? 0.6 : 1 }}>
                    <div style={{ minWidth: 96, fontWeight: 600, fontSize: 13 }}>{h.dia}</div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
                      <input type="checkbox" checked={h.cerrado}
                        onChange={e => patchHorario(h.id, { cerrado: e.target.checked })}
                        style={{ accentColor: 'var(--red)' }} />
                      Cerrado
                    </label>
                    {!h.cerrado && (
                      <>
                        <input type="time" className="field-input" style={{ width: 96 }} value={h.horaApertura}
                          onChange={e => setHorarios(prev => prev.map(x => x.id === h.id ? { ...x, horaApertura: e.target.value } : x))}
                          onBlur={e => patchHorario(h.id, { horaApertura: e.target.value })} />
                        <span style={{ color: 'var(--text-3)', flexShrink: 0 }}>→</span>
                        <input type="time" className="field-input" style={{ width: 96 }} value={h.horaCierre}
                          onChange={e => setHorarios(prev => prev.map(x => x.id === h.id ? { ...x, horaCierre: e.target.value } : x))}
                          onBlur={e => patchHorario(h.id, { horaCierre: e.target.value })} />
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── RESEÑAS / TESTIMONIOS ─────────────────────────────────────── */}
          {tab === 'testimonios' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{testimonios.length} reseñas · {testimonios.filter(t => t.activo).length} visibles</div>
                <button className="btn-primary" onClick={() => { setEditTest(null); setTestForm({ nombre: '', testimonio: '', calificacion: 5, contexto: '', plataforma: 'Google' }); setTestModal(true); }}>
                  <PlusIcon size={13} /> Agregar reseña
                </button>
              </div>
              {testimonios.length === 0 ? (
                <div className="empty">Sin reseñas aún.</div>
              ) : (
                <div className="stagger">{testimonios.map(t => (
                  <div key={t.id} className="card" style={{ marginBottom: 10, opacity: saving === 'test-' + t.id ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{t.nombre}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>{t.contexto} · {t.plataforma} · {'★'.repeat(t.calificacion)}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-2)', fontStyle: 'italic' }}>"{t.testimonio}"</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
                        <span className={`badge badge-${t.activo ? 'confirmed' : 'inactive'}`} style={{ cursor: 'pointer' }} onClick={() => patchTest(t.id, { activo: !t.activo })}>
                          {t.activo ? 'Visible' : 'Oculta'}
                        </span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="abtn abtn-edit" onClick={() => { setEditTest(t); setTestForm({ nombre: t.nombre, testimonio: t.testimonio, calificacion: t.calificacion, contexto: t.contexto, plataforma: t.plataforma }); setTestModal(true); }}><EditIcon size={11} /></button>
                          <button className="abtn abtn-canc" onClick={() => deleteTest(t.id)}><TrashIcon size={11} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}</div>
              )}
            </>
          )}

          {/* ── GALERÍA ───────────────────────────────────────────────────── */}
          {tab === 'galeria' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{galeria.length} imágenes · {galeria.filter(g => g.activo).length} activas</div>
                <button className="btn-primary" onClick={() => { setEditGal(null); setGalForm({ titulo: '', urlImagen: '', altText: '', seccion: 'Galería', orden: galeria.length }); setGalModal(true); }}>
                  <PlusIcon size={13} /> Agregar imagen
                </button>
              </div>
              {galeria.length === 0 ? (
                <div className="empty">Sin imágenes en galería.</div>
              ) : (
                <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                  {galeria.map(g => (
                    <div key={g.id} style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', opacity: saving === 'gal-' + g.id ? 0.6 : 1 }}>
                      <div style={{ height: 120, background: 'var(--bg-elevated)', position: 'relative' }}>
                        {g.urlImagen
                          ? <img src={g.urlImagen} alt={g.altText} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--text-3)' }}>Sin imagen</div>}
                        <span style={{ position: 'absolute', top: 6, right: 6, background: g.activo ? 'var(--green)' : 'var(--bg-hover)', color: g.activo ? '#fff' : 'var(--text-3)', fontSize: 9, padding: '2px 7px', borderRadius: 20, fontWeight: 700, cursor: 'pointer' }}
                          onClick={() => patchGal(g.id, { activo: !g.activo })}>
                          {g.activo ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <div style={{ padding: '8px 10px' }}>
                        <div style={{ fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.titulo}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{g.seccion} · #{g.orden}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, padding: '0 10px 8px' }}>
                        <button className="abtn abtn-edit" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setEditGal(g); setGalForm({ titulo: g.titulo, urlImagen: g.urlImagen, altText: g.altText, seccion: g.seccion, orden: g.orden }); setGalModal(true); }}><EditIcon size={11} /> Editar</button>
                        <button className="abtn abtn-canc" style={{ padding: '4px 8px' }} onClick={() => deleteGal(g.id)}><TrashIcon size={11} /></button>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{promociones.length} promociones · {promociones.filter(p => p.activo).length} activas</div>
                <button className="btn-primary" onClick={() => { setEditPromo(null); setPromoForm({ titulo: '', descripcion: '', descuento: 0, tipo: 'Especial', imagenUrl: '', fechaInicio: '', fechaFin: '' }); setPromoModal(true); }}>
                  <PlusIcon size={13} /> Nueva promo
                </button>
              </div>
              {promociones.length === 0 ? (
                <div className="empty">Sin promociones creadas.</div>
              ) : (
                <div className="stagger">{promociones.map(p => (
                  <div key={p.id} className="card" style={{ marginBottom: 10, opacity: saving === 'promo-' + p.id ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      {p.imagenUrl && <img src={p.imagenUrl} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{p.titulo}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>
                          {p.tipo} · {p.descuento > 0 ? `${p.descuento}${p.tipo === 'Porcentaje' ? '%' : ' Gs'} desc.` : 'Sin descuento numérico'}
                          {p.fechaInicio && ` · Desde ${p.fechaInicio}`}
                          {p.fechaFin && ` hasta ${p.fechaFin}`}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{p.descripcion}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
                        <span className={`badge badge-${p.activo ? 'confirmed' : 'inactive'}`} style={{ cursor: 'pointer' }} onClick={() => patchPromo(p.id, { activo: !p.activo })}>
                          {p.activo ? 'Activa' : 'Inactiva'}
                        </span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="abtn abtn-edit" onClick={() => { setEditPromo(p); setPromoForm({ titulo: p.titulo, descripcion: p.descripcion, descuento: p.descuento, tipo: p.tipo, imagenUrl: p.imagenUrl, fechaInicio: p.fechaInicio, fechaFin: p.fechaFin }); setPromoModal(true); }}><EditIcon size={11} /></button>
                          <button className="abtn abtn-canc" onClick={() => deletePromo(p.id)}><TrashIcon size={11} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}</div>
              )}
            </>
          )}

          {/* ── INSTAGRAM ─────────────────────────────────────────────────── */}
          {tab === 'instagram' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
                  {igLinks.length} posts · {igLinks.filter(l => l.activo).length} activos
                </div>
                <button className="btn-primary" onClick={() => { setIgForm({ titulo: '', urlPost: '', imagenUrl: '', tipo: 'Post' }); setIgModal(true); }}>
                  <PlusIcon size={13} /> Agregar post
                </button>
              </div>
              {igLinks.length === 0 ? (
                <div className="empty">Sin posts de Instagram. Agregá el link de un post para mostrarlo en el sitio.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {igLinks.map(link => (
                    <div key={link.id} className="card" style={{ opacity: saving === 'ig-' + link.id ? 0.6 : 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {link.imagenUrl
                            ? <img src={link.imagenUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            : <span style={{ fontSize: 20 }}>📸</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {link.titulo || 'Sin título'}
                          </div>
                          <a href={link.urlPost} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 11, color: 'var(--accent-1)', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {link.urlPost}
                          </a>
                        </div>
                        <span className={`badge badge-${link.activo ? 'confirmed' : 'inactive'}`}
                          style={{ cursor: 'pointer', flexShrink: 0 }}
                          onClick={() => patchIg(link.id, { activo: !link.activo })}>
                          {link.activo ? 'Activo' : 'Oculto'}
                        </span>
                        <button className="abtn abtn-canc" onClick={() => deleteIg(link.id)}><TrashIcon size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── CONTACTO ──────────────────────────────────────────────────── */}
          {tab === 'contacto' && (
            <ContactoTab tenant={tenant} client={client} />
          )}
        </>
      )}

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
            {galForm.urlImagen && <img src={galForm.urlImagen} alt="" onError={e => (e.currentTarget.style.display = 'none')} style={{ marginTop: 8, width: '100%', height: 140, objectFit: 'cover', borderRadius: 8 }} />}
          </div>
          <div className="m-row">
            <div className="field-group">
              <label className="field-label">Sección</label>
              <select className="field-input" value={galForm.seccion} onChange={e => setGalForm(p => ({ ...p, seccion: e.target.value }))}>
                {['Galería', 'Hero', 'Carta', 'Equipo', 'Fondo', 'Otro'].map(s => <option key={s}>{s}</option>)}
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
            <textarea className="field-input" placeholder="Texto de la reseña..." value={testForm.testimonio} onChange={e => setTestForm(p => ({ ...p, testimonio: e.target.value }))} style={{ minHeight: 80, resize: 'vertical' }} />
          </div>
          <div className="m-row">
            <div className="field-group">
              <label className="field-label">Calificación</label>
              <select className="field-input" value={testForm.calificacion} onChange={e => setTestForm(p => ({ ...p, calificacion: parseInt(e.target.value) }))}>
                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Plataforma</label>
              <select className="field-input" value={testForm.plataforma} onChange={e => setTestForm(p => ({ ...p, plataforma: e.target.value }))}>
                {['Google', 'Facebook', 'Instagram', 'Directo', 'TripAdvisor'].map(pl => <option key={pl}>{pl}</option>)}
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
            <textarea className="field-input" placeholder="Detalles de la promo..." value={promoForm.descripcion} onChange={e => setPromoForm(p => ({ ...p, descripcion: e.target.value }))} style={{ minHeight: 70, resize: 'vertical' }} />
          </div>
          <div className="m-row">
            <div className="field-group">
              <label className="field-label">Tipo</label>
              <select className="field-input" value={promoForm.tipo} onChange={e => setPromoForm(p => ({ ...p, tipo: e.target.value }))}>
                {['Porcentaje', 'Monto fijo', 'Especial', '2x1'].map(t => <option key={t}>{t}</option>)}
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

      {/* ── Modal Instagram ──────────────────────────────────────────────────── */}
      <div className={`modal-ov ${igModal ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setIgModal(false)}>
        <div className="modal" style={{ maxWidth: 480 }}>
          <div className="modal-hd">
            <div className="modal-title">Agregar post de Instagram</div>
            <button className="modal-x" onClick={() => setIgModal(false)}>✕</button>
          </div>
          <div className="field-group">
            <label className="field-label">URL de imagen <span style={{ color: 'var(--red)', fontSize: 10 }}>*requerida para el carrusel</span></label>
            <input className="field-input" placeholder="https://..." value={igForm.imagenUrl}
              onChange={e => setIgForm(p => ({ ...p, imagenUrl: e.target.value }))} />
            {igForm.imagenUrl && (
              <img src={igForm.imagenUrl} alt="" onError={e => (e.currentTarget.style.display='none')}
                style={{ marginTop: 8, width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
            )}
          </div>
          <div className="field-group">
            <label className="field-label">URL del post (link al hacer clic)</label>
            <input className="field-input" placeholder="https://www.instagram.com/p/..." value={igForm.urlPost}
              onChange={e => setIgForm(p => ({ ...p, urlPost: e.target.value }))} />
          </div>
          <div className="m-row">
            <div className="field-group">
              <label className="field-label">Etiqueta (opcional)</label>
              <input className="field-input" placeholder="ej. Baby Shower, Panadería..." value={igForm.titulo}
                onChange={e => setIgForm(p => ({ ...p, titulo: e.target.value }))} />
            </div>
            <div className="field-group">
              <label className="field-label">Tipo</label>
              <select className="field-input" value={igForm.tipo} onChange={e => setIgForm(p => ({ ...p, tipo: e.target.value }))}>
                {['Post', 'Reel', 'Story', 'Destacado'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-foot">
            <button className="btn-sec" onClick={() => setIgModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={saveIg} disabled={saving === 'ig-new'}>
              {saving === 'ig-new' ? 'Guardando…' : 'Agregar post'}
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
