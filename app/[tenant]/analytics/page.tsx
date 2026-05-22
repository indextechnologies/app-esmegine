'use client';
import { useParams } from 'next/navigation';
import { CLIENTS, SEO_DATA } from '../../../lib/demo-data';

export default function AnalyticsPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const client  = CLIENTS.find(c => c.slug === tenant);
  const seo     = SEO_DATA[tenant as string] ?? SEO_DATA['bom-pain'];

  const maxVisit  = Math.max(...seo.visits);
  const thisMonth = seo.visits[seo.visits.length - 1];
  const lastMonth = seo.visits[seo.visits.length - 2];
  const growth    = Math.round((thisMonth - lastMonth) / lastMonth * 100);
  const total     = seo.visits.reduce((a, b) => a + b, 0);
  const avgBounce = '34%';
  const avgTime   = '2m 18s';

  return (
    <>
      <div className="pg-title">Analytics & SEO</div>
      <div className="pg-sub">{client?.name} · Datos de los últimos 12 meses</div>

      {/* KPIs */}
      <div className="kpi-grid">
        {[
          { l:'Visitas este mes', v:thisMonth.toLocaleString(),        ch:`${growth > 0 ? '+' : ''}${growth}% vs mes anterior`, col: growth >= 0 ? 'var(--green)' : 'var(--red)' },
          { l:'Total anual',      v:total.toLocaleString(),            ch:'Últimos 12 meses',     col:'var(--accent-1)'  },
          { l:'Tasa de rebote',   v:avgBounce,                        ch:'↓ 3% vs mes anterior', col:'var(--green)'     },
          { l:'Tiempo promedio',  v:avgTime,                          ch:'↑ 15s vs mes anterior',col:'var(--green)'     },
          { l:'Páginas/visita',   v:'3.2',                            ch:'↑ 0.4 vs mes anterior',col:'var(--green)'     },
          { l:'Posición Google',  v:'#4',                             ch:'↑ 2 posiciones',       col:'var(--yellow)'    },
        ].map(k => (
          <div key={k.l} className="kpi-card">
            <div className="kpi-val">{k.v}</div>
            <div className="kpi-lbl">{k.l}</div>
            <div className="kpi-ch" style={{ color: k.col }}>{k.ch}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:14, marginBottom:14 }}>

        {/* Visits chart */}
        <div className="card">
          <div className="card-hd">
            <div className="card-title">Visitas mensuales</div>
            <span style={{ fontSize:11, color:'var(--text-3)' }}>Últimos 12 meses</span>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:140, padding:'8px 0' }}>
            {seo.visits.map((v, i) => {
              const pct = (v / maxVisit) * 100;
              const isLast = i === seo.visits.length - 1;
              return (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div
                    style={{
                      width:'100%', height:`${pct}%`,
                      background: isLast ? 'var(--accent-1)' : 'rgba(99,102,241,.25)',
                      borderRadius:'4px 4px 0 0',
                      transition:'background .2s',
                      minHeight: 4,
                      position:'relative',
                    }}
                    title={`${v} visitas`}
                  >
                    {isLast && (
                      <div style={{ position:'absolute', top:-22, left:'50%', transform:'translateX(-50%)', fontSize:9.5, fontWeight:700, color:'var(--accent-1)', whiteSpace:'nowrap' }}>
                        {v.toLocaleString()}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize:9.5, color:'var(--text-3)', textAlign:'center' }}>{seo.labels[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Traffic sources */}
        <div className="card">
          <div className="card-hd">
            <div className="card-title">Fuentes de tráfico</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {seo.sources.map(s => (
              <div key={s.name} className="prog-bar">
                <div className="prog-top">
                  <div className="prog-name">
                    <div style={{ width:8, height:8, borderRadius:'50%', background:s.color }} />
                    {s.name}
                  </div>
                  <div className="prog-cnt" style={{ color:s.color }}>{s.pct}%</div>
                </div>
                <div className="prog-track">
                  <div className="prog-fill" style={{ width:`${s.pct}%`, background:s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top pages */}
      <div className="card">
        <div className="card-hd">
          <div className="card-title">Páginas más visitadas</div>
          <span style={{ fontSize:11, color:'var(--text-3)' }}>Último mes</span>
        </div>
        <div className="tbl-wrap" style={{ border:'none', borderRadius:0, overflow:'hidden' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>#</th>
                <th>Página</th>
                <th>Visitas</th>
                <th>Tasa de rebote</th>
                <th>Rendimiento</th>
              </tr>
            </thead>
            <tbody>
              {seo.pages.map((p, i) => {
                const pct = Math.round((p.views / seo.pages[0].views) * 100);
                return (
                  <tr key={p.page}>
                    <td style={{ color:'var(--text-3)', fontSize:11 }}>{i + 1}</td>
                    <td>
                      <code style={{ background:'var(--bg-elevated)', padding:'2px 7px', borderRadius:4, fontSize:12, color:'var(--accent-1)' }}>
                        {p.page}
                      </code>
                    </td>
                    <td><strong>{p.views.toLocaleString()}</strong></td>
                    <td style={{ color: parseFloat(p.bounce) < 40 ? 'var(--green)' : 'var(--yellow)' }}>{p.bounce}</td>
                    <td style={{ width:160 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ flex:1, height:4, background:'var(--bg-elevated)', borderRadius:2, overflow:'hidden' }}>
                          <div style={{ width:`${pct}%`, height:'100%', background:'var(--accent-1)', borderRadius:2 }} />
                        </div>
                        <span style={{ fontSize:11, color:'var(--text-3)', minWidth:28 }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop:14, padding:'12px 16px', background:'rgba(99,102,241,.06)', border:'1px solid var(--border-acc)', borderRadius:10, fontSize:12, color:'var(--text-2)' }}>
        💡 <strong style={{ color:'var(--text-1)' }}>Consejo SEO:</strong> Tu página <code style={{ background:'var(--bg-elevated)', padding:'1px 5px', borderRadius:3 }}>/reservar</code> tiene la menor tasa de rebote ({seo.pages.find(p=>p.page==='/reservar')?.bounce ?? '12%'}) — es el mejor punto de conversión. Considera agregar un CTA más visible en la página principal.
      </div>
    </>
  );
}
