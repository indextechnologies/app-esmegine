'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { CLIENTS } from '../../../lib/demo-data';

export default function TenantConfigPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const client = CLIENTS.find(c => c.slug === tenant);
  const [toast, setToast] = useState('');

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  return (
    <>
      <div className="pg-title">Configuración</div>
      <div className="pg-sub">{client?.name}</div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, maxWidth:860 }}>
        <div className="card">
          <div className="card-hd"><div className="card-title">Plan & acceso</div></div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'var(--bg-elevated)', borderRadius:9 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700 }}>{client?.plan}</div>
                <div style={{ fontSize:11, color:'var(--text-3)' }}>Plan activo desde {client?.since}</div>
              </div>
              <span className="badge badge-active">Activo</span>
            </div>
            <div className="field-group">
              <label className="field-label">PIN de acceso</label>
              <input className="field-input" type="password" defaultValue="1234" />
            </div>
            <button className="btn-primary" style={{ alignSelf:'flex-start' }} onClick={() => showToast('PIN actualizado')}>Actualizar PIN</button>
          </div>
        </div>

        <div className="card">
          <div className="card-hd"><div className="card-title">Notificaciones</div></div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { label:'Nueva reserva',      sub:'Recibir aviso por email al recibir una reserva' },
              { label:'Reserva cancelada',  sub:'Notificación cuando un cliente cancela' },
              { label:'Recordatorio diario',sub:'Resumen de reservas del día' },
            ].map(n => (
              <div key={n.label} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                <input type="checkbox" defaultChecked style={{ accentColor:'var(--accent-1)', width:15, height:15, marginTop:2, flexShrink:0 }} />
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{n.label}</div>
                  <div style={{ fontSize:11, color:'var(--text-3)' }}>{n.sub}</div>
                </div>
              </div>
            ))}
            <button className="btn-primary" style={{ alignSelf:'flex-start', marginTop:4 }} onClick={() => showToast('Preferencias guardadas')}>Guardar</button>
          </div>
        </div>

        <div className="card">
          <div className="card-hd"><div className="card-title">Integración de reservas</div></div>
          <div style={{ fontSize:12.5, color:'var(--text-2)', marginBottom:12 }}>
            Embebé el formulario de reservas en tu sitio web con este snippet:
          </div>
          <div style={{ background:'var(--bg-base)', borderRadius:8, padding:14, fontFamily:'monospace', fontSize:11.5, color:'#a5b4fc', lineHeight:1.7, marginBottom:12, border:'1px solid var(--border)' }}>
            <span style={{ color:'#f472b6' }}>&lt;script</span>
            <span style={{ color:'#86efac' }}> src</span>
            =<span style={{ color:'#fbbf24' }}>&quot;https://app.indexte.com/widget.js&quot;</span>
            <span style={{ color:'#f472b6' }}>&gt;&lt;/script&gt;</span><br />
            <span style={{ color:'#f472b6' }}>&lt;div</span><br />
            &nbsp;&nbsp;<span style={{ color:'#86efac' }}>id</span>=<span style={{ color:'#fbbf24' }}>&quot;ix-reservas&quot;</span><br />
            &nbsp;&nbsp;<span style={{ color:'#86efac' }}>data-tenant</span>=<span style={{ color:'#fbbf24' }}>&quot;{tenant}&quot;</span><br />
            <span style={{ color:'#f472b6' }}>&gt;&lt;/div&gt;</span>
          </div>
          <button className="btn-sec" onClick={() => showToast('Código copiado al portapapeles')}>Copiar snippet</button>
        </div>

        <div className="card">
          <div className="card-hd"><div className="card-title">Zona peligrosa</div></div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ padding:'10px 14px', background:'var(--red-bg)', border:'1px solid rgba(239,68,68,.2)', borderRadius:9, fontSize:12, color:'var(--red)' }}>
              Estas acciones son irreversibles. Proceder con cuidado.
            </div>
            <button className="btn-sec" style={{ color:'var(--red)', borderColor:'rgba(239,68,68,.3)' }} onClick={() => showToast('Función disponible próximamente')}>
              Exportar todos los datos
            </button>
            <button className="btn-sec" style={{ color:'var(--red)', borderColor:'rgba(239,68,68,.3)' }} onClick={() => showToast('Contactar a soporte para desactivar')}>
              Desactivar cuenta
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
