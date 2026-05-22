'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { CLIENTS, MENU_ITEMS, PROMO_DATA, HOURS_DATA, type MenuItem } from '../../../lib/demo-data';
import { PlusIcon, EditIcon, TrashIcon, ExternalIcon } from '../../../components/Icons';

type Tab = 'menu' | 'promociones' | 'horarios' | 'contacto';

export default function WebsitePage() {
  const { tenant } = useParams<{ tenant: string }>();
  const client = CLIENTS.find(c => c.slug === tenant);
  const [tab, setTab] = useState<Tab>('menu');
  const [items, setItems] = useState<MenuItem[]>(MENU_ITEMS[tenant as string] ?? []);
  const [promos, setPromos] = useState([...PROMO_DATA]);
  const [hours, setHours]   = useState([...HOURS_DATA]);
  const [modal, setModal]   = useState<null | 'menu' | 'promo'>(null);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState({ name:'', category:'', price:'', description:'', emoji:'🍽️', active:true, featured:false });
  const [toast, setToast] = useState('');
  const [contactData, setContactData] = useState({
    name:      client?.name ?? '',
    phone:     client?.phone ?? '',
    email:     client?.email ?? '',
    address:   client?.address ?? '',
    instagram: client?.instagram ?? '',
    about:     'Somos un espacio cálido donde cada plato cuenta una historia. Desde 2020 compartiendo sabores auténticos.',
  });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function toggleItem(id: number) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, active: !it.active } : it));
    showToast('Item actualizado');
  }

  function deleteItem(id: number) {
    setItems(prev => prev.filter(it => it.id !== id));
    showToast('Item eliminado');
  }

  function openEdit(item: MenuItem) {
    setEditing(item);
    setForm({ name:item.name, category:item.category, price:item.price, description:item.description, emoji:item.emoji, active:item.active, featured:item.featured });
    setModal('menu');
  }

  function saveItem() {
    if (!form.name) return;
    if (editing) {
      setItems(prev => prev.map(it => it.id === editing.id ? { ...it, ...form } : it));
    } else {
      setItems(prev => [...prev, { id: Date.now(), ...form }]);
    }
    setModal(null); setEditing(null);
    setForm({ name:'', category:'', price:'', description:'', emoji:'🍽️', active:true, featured:false });
    showToast(editing ? 'Item actualizado' : 'Item agregado');
  }

  const categories = Array.from(new Set(items.map(i => i.category)));

  return (
    <>
      <div className="pg-title">Website</div>
      <div className="pg-sub">
        {client?.name} ·{' '}
        {client?.website && (
          <a href={client.website} target="_blank" rel="noopener" style={{ color:'var(--accent-1)', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4 }}>
            <ExternalIcon size={11} /> {client.website}
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {(['menu','promociones','horarios','contacto'] as Tab[]).map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {{ menu:'🍽️ Menú / Productos', promociones:'🏷️ Promociones', horarios:'🕐 Horarios', contacto:'📋 Contacto' }[t]}
          </button>
        ))}
      </div>

      {/* MENU TAB */}
      {tab === 'menu' && (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontSize:13, color:'var(--text-2)' }}>{items.length} items · {items.filter(i=>i.active).length} activos</div>
            <button className="btn-primary" onClick={() => { setEditing(null); setModal('menu'); }}>
              <PlusIcon size={13} /> Agregar item
            </button>
          </div>

          {categories.map(cat => (
            <div key={cat} className="card" style={{ marginBottom:12, padding:0, overflow:'hidden' }}>
              <div style={{ padding:'10px 16px', background:'var(--bg-elevated)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontFamily:'Syne', fontWeight:700, fontSize:13.5 }}>{cat}</span>
                <span style={{ fontSize:11, color:'var(--text-3)' }}>{items.filter(i=>i.category===cat).length} items</span>
              </div>
              {items.filter(i => i.category === cat).map(item => (
                <div key={item.id} className="menu-item-row">
                  <div className="mitem-img">{item.emoji}</div>
                  <div className="mitem-info">
                    <div className="mitem-name">
                      {item.name}
                      {item.featured && <span style={{ marginLeft:6, fontSize:9.5, background:'rgba(245,158,11,.15)', color:'var(--yellow)', padding:'1px 6px', borderRadius:4, fontWeight:700 }}>★ Destacado</span>}
                    </div>
                    <div className="mitem-cat">{item.description}</div>
                  </div>
                  <div className="mitem-price">{item.price}</div>
                  <span className={`badge badge-${item.active ? 'confirmed' : 'inactive'}`} style={{ cursor:'pointer' }} onClick={() => toggleItem(item.id)}>
                    {item.active ? 'Activo' : 'Oculto'}
                  </span>
                  <div style={{ display:'flex', gap:4 }}>
                    <button className="abtn abtn-edit" onClick={() => openEdit(item)}><EditIcon size={12} /></button>
                    <button className="abtn abtn-canc" onClick={() => deleteItem(item.id)}><TrashIcon size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {/* PROMOCIONES TAB */}
      {tab === 'promociones' && (
        <>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
            <button className="btn-primary" onClick={() => setModal('promo')}>
              <PlusIcon size={13} /> Nueva promoción
            </button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {promos.map(p => (
              <div key={p.id} className="card">
                <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                      <span style={{ fontFamily:'Syne', fontWeight:700, fontSize:15 }}>{p.name}</span>
                      <span style={{ fontWeight:800, fontSize:13, padding:'2px 10px', borderRadius:20, background:'rgba(245,158,11,.15)', color:'var(--yellow)' }}>{p.discount}</span>
                      <span className={`badge badge-${p.active ? 'confirmed' : 'inactive'}`}>{p.active ? 'Activa' : 'Inactiva'}</span>
                    </div>
                    <div style={{ fontSize:12.5, color:'var(--text-2)', marginBottom:6 }}>{p.description}</div>
                    <div style={{ fontSize:11, color:'var(--text-3)' }}>📅 {p.start} → {p.end}</div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="abtn abtn-edit"><EditIcon size={12} /></button>
                    <button className="abtn abtn-canc" onClick={() => setPromos(prev => prev.filter(x => x.id !== p.id))}><TrashIcon size={12} /></button>
                  </div>
                </div>
              </div>
            ))}
            {promos.length === 0 && <div className="empty">Sin promociones activas</div>}
          </div>
        </>
      )}

      {/* HORARIOS TAB */}
      {tab === 'horarios' && (
        <div className="card" style={{ maxWidth:520 }}>
          <div className="card-hd">
            <div className="card-title">Horarios de atención</div>
            <button className="btn-primary" style={{ fontSize:12, padding:'5px 12px' }} onClick={() => showToast('Horarios guardados')}>
              Guardar cambios
            </button>
          </div>
          {hours.map((h, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ minWidth:160, fontWeight:600, fontSize:13 }}>{h.day}</div>
              {h.closed ? (
                <span style={{ color:'var(--text-3)', fontSize:12 }}>Cerrado</span>
              ) : (
                <>
                  <input
                    type="time" className="field-input" style={{ width:110 }}
                    value={h.open}
                    onChange={e => setHours(prev => prev.map((x,j) => j===i ? {...x,open:e.target.value} : x))}
                  />
                  <span style={{ color:'var(--text-3)' }}>→</span>
                  <input
                    type="time" className="field-input" style={{ width:110 }}
                    value={h.close}
                    onChange={e => setHours(prev => prev.map((x,j) => j===i ? {...x,close:e.target.value} : x))}
                  />
                </>
              )}
              <button
                className="abtn abtn-edit"
                onClick={() => setHours(prev => prev.map((x,j) => j===i ? {...x,closed:!x.closed} : x))}
              >
                {h.closed ? 'Abrir' : 'Cerrar'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* CONTACTO TAB */}
      {tab === 'contacto' && (
        <div className="card" style={{ maxWidth:560 }}>
          <div className="card-hd">
            <div className="card-title">Información de contacto</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {([
              { label:'Nombre del negocio', key:'name',      type:'text'  },
              { label:'Teléfono / WhatsApp', key:'phone',    type:'tel'   },
              { label:'Email',              key:'email',     type:'email' },
              { label:'Dirección',          key:'address',   type:'text'  },
              { label:'Instagram',          key:'instagram', type:'text'  },
            ] as const).map(f => (
              <div key={f.key} className="field-group">
                <label className="field-label">{f.label}</label>
                <input
                  className="field-input"
                  type={f.type}
                  value={contactData[f.key]}
                  onChange={e => setContactData(p => ({...p, [f.key]:e.target.value}))}
                />
              </div>
            ))}
            <div className="field-group">
              <label className="field-label">Descripción del negocio</label>
              <textarea
                className="field-input"
                rows={3}
                value={contactData.about}
                onChange={e => setContactData(p => ({...p, about:e.target.value}))}
                style={{ resize:'vertical' }}
              />
            </div>
            <button className="btn-primary" style={{ alignSelf:'flex-start', marginTop:8 }} onClick={() => showToast('Información guardada correctamente')}>
              Guardar cambios
            </button>
          </div>
        </div>
      )}

      {/* Modal menu item */}
      <div className={`modal-ov ${modal === 'menu' ? 'open' : ''}`} onClick={e => e.target === e.currentTarget && setModal(null)}>
        <div className="modal">
          <div className="modal-hd">
            <div className="modal-title">{editing ? 'Editar item' : 'Nuevo item'}</div>
            <button className="modal-x" onClick={() => setModal(null)}>✕</button>
          </div>
          <div className="m-row">
            <div className="field-group">
              <label className="field-label">Emoji</label>
              <input className="field-input" value={form.emoji} onChange={e => setForm(p=>({...p,emoji:e.target.value}))} style={{ fontSize:20, textAlign:'center' }} />
            </div>
            <div className="field-group">
              <label className="field-label">Categoría</label>
              <input className="field-input" placeholder="Café, Menú, Servicio..." value={form.category} onChange={e => setForm(p=>({...p,category:e.target.value}))} />
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Nombre</label>
            <input className="field-input" placeholder="Nombre del producto / servicio" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} />
          </div>
          <div className="field-group">
            <label className="field-label">Descripción</label>
            <input className="field-input" placeholder="Descripción breve..." value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} />
          </div>
          <div className="m-row">
            <div className="field-group">
              <label className="field-label">Precio</label>
              <input className="field-input" placeholder="Gs 15.000" value={form.price} onChange={e => setForm(p=>({...p,price:e.target.value}))} />
            </div>
            <div className="field-group">
              <label className="field-label">Opciones</label>
              <div style={{ display:'flex', flexDirection:'column', gap:8, paddingTop:8 }}>
                {([['active','Activo (visible)'],['featured','Destacado']] as const).map(([k,l]) => (
                  <label key={k} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12.5, cursor:'pointer' }}>
                    <input type="checkbox" checked={form[k]} onChange={e => setForm(p=>({...p,[k]:e.target.checked}))} style={{ accentColor:'var(--accent-1)', width:14, height:14 }} />
                    {l}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="modal-foot">
            <button className="btn-sec" onClick={() => setModal(null)}>Cancelar</button>
            <button className="btn-primary" onClick={saveItem}>{editing ? 'Guardar cambios' : 'Agregar item'}</button>
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
