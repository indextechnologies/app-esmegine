'use client';
import { useState } from 'react';
import { useClients } from '../../../lib/use-clients';

export default function AdminConfigPage() {
  const { clients } = useClients();
  const [toast, setToast] = useState('');
  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  return (
    <>
      <div className="pg-title">Configuración Global</div>
      <div className="pg-sub">Parámetros de la plataforma esmegine</div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, maxWidth:800 }}>
        <div className="card">
          <div className="card-hd"><div className="card-title">Plataforma</div></div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[
              { label:'Nombre de la plataforma', val:'esmegine' },
              { label:'Dominio',                 val:'app.indexte.cloud' },
              { label:'Email de soporte',         val:'soporte@indextechnologies.de' },
              { label:'Zona horaria',             val:'America/Asuncion (UTC-4)' },
            ].map(f => (
              <div key={f.label} className="field-group" style={{ marginBottom:0 }}>
                <label className="field-label">{f.label}</label>
                <input className="field-input" defaultValue={f.val} />
              </div>
            ))}
            <button className="btn-primary" style={{ alignSelf:'flex-start' }} onClick={() => showToast('Configuración guardada')}>Guardar</button>
          </div>
        </div>

        <div className="card">
          <div className="card-hd"><div className="card-title">Clientes activos</div></div>
          {clients.map(c => (
            <div key={c.slug} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:18 }}>{c.emoji}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12.5, fontWeight:600 }}>{c.name}</div>
                <div style={{ fontSize:10.5, color:'var(--text-3)' }}>{c.plan} · desde {c.since}</div>
              </div>
              <span className={`badge badge-${c.active ? 'active' : 'inactive'}`}>{c.active ? 'Activo' : 'Inactivo'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={`toast ${toast ? 'show' : ''}`}>
        <div className="toast-ic">✓</div>
        {toast}
      </div>
    </>
  );
}
