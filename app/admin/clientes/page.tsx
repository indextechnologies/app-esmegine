'use client';
import Link from 'next/link';
import { CLIENTS, RESERVATIONS } from '../../../lib/demo-data';
import { ExternalIcon, ResIcon, GlobeIcon, BarChartIcon } from '../../../components/Icons';

export default function ClientesPage() {
  const enriched = CLIENTS.map(c => ({
    ...c,
    total:  RESERVATIONS.filter(r => r.tenant === c.slug).length,
    pending:RESERVATIONS.filter(r => r.tenant === c.slug && r.status === 'pending').length,
  }));

  return (
    <>
      <div className="pg-title">Clientes</div>
      <div className="pg-sub">Gestión centralizada de todos los negocios</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 28 }}>
        {enriched.map(c => (
          <div key={c.slug} className="card" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div className="client-icon" style={{ background: c.colorBg, margin: 0 }}>{c.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{c.industry}</div>
              </div>
              <span className={`badge badge-${c.active ? 'active' : 'inactive'}`}>{c.active ? 'Activo' : 'Inactivo'}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
              {[
                { label: 'Reservas', val: c.total, color: 'var(--accent-1)' },
                { label: 'Pendientes', val: c.pending, color: 'var(--yellow)' },
                { label: 'Plan', val: c.plan, color: 'var(--text-1)' },
              ].map(kv => (
                <div key={kv.label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: kv.color }}>{kv.val}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{kv.label}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div>📧 {c.email}</div>
              <div>📱 {c.instagram}</div>
              <div>📍 {c.address}</div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Link href={`/${c.slug}/dashboard`} className="btn-primary" style={{ fontSize: 12, padding: '5px 12px', gap: 4 }}>
                <ResIcon size={12} /> Dashboard
              </Link>
              <Link href={`/${c.slug}/website`} className="btn-sec" style={{ fontSize: 12, padding: '5px 12px', gap: 4 }}>
                <GlobeIcon size={12} /> Website
              </Link>
              <Link href={`/${c.slug}/analytics`} className="btn-sec" style={{ fontSize: 12, padding: '5px 12px', gap: 4 }}>
                <BarChartIcon size={12} /> Stats
              </Link>
              {c.website && (
                <a href={c.website} target="_blank" rel="noopener" className="btn-sec" style={{ fontSize: 12, padding: '5px 10px', gap: 4 }}>
                  <ExternalIcon size={12} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-hd">
          <div className="card-title">Todos los clientes</div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Negocio</th>
                <th>Industria</th>
                <th>Plan</th>
                <th>Reservas</th>
                <th>Pendientes</th>
                <th>Desde</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {enriched.map(c => (
                <tr key={c.slug}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{c.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-2)' }}>{c.industry}</td>
                  <td><span style={{ fontWeight: 600 }}>{c.plan}</span></td>
                  <td><strong style={{ color: 'var(--accent-1)' }}>{c.total}</strong></td>
                  <td><strong style={{ color: 'var(--yellow)' }}>{c.pending}</strong></td>
                  <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{c.since}</td>
                  <td><span className={`badge badge-${c.active ? 'active' : 'inactive'}`}>{c.active ? 'Activo' : 'Inactivo'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Link href={`/${c.slug}/dashboard`} className="abtn abtn-conf">Gestionar</Link>
                      <button className="abtn abtn-edit">Editar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
