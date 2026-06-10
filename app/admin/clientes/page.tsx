'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useClients, setCachedClientModules, type Client } from '../../../lib/use-clients';
import { useModules } from '../../../lib/use-modules';
import { ExternalIcon, ResIcon, GlobeIcon, BarChartIcon } from '../../../components/Icons';

export default function ClientesPage() {
  const { clients: fetched, loading } = useClients();
  const { modules } = useModules();

  // Local working copy so module toggles update instantly.
  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  useEffect(() => { setClients(fetched); }, [fetched]);

  async function toggleModule(slug: string, key: string) {
    const client = clients.find(c => c.slug === slug);
    if (!client || saving) return;
    const prev = client.modules;
    const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];

    // optimistic
    setClients(cs => cs.map(c => (c.slug === slug ? { ...c, modules: next } : c)));
    setSaving(slug);
    try {
      const r = await fetch(`/api/${slug}/modules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: next }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data?.error ?? 'save failed');
      const applied: string[] = data.keys ?? next;
      setClients(cs => cs.map(c => (c.slug === slug ? { ...c, modules: applied } : c)));
      setCachedClientModules(slug, applied);
    } catch {
      setClients(cs => cs.map(c => (c.slug === slug ? { ...c, modules: prev } : c)));
      alert('No se pudo guardar el cambio de módulos. Intentá de nuevo.');
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <div className="empty" style={{ padding: 48 }}>Cargando clientes…</div>;

  return (
    <>
      <div className="pg-title">Clientes</div>
      <div className="pg-sub">Gestión centralizada de todos los negocios</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 28 }}>
        {clients.map(c => (
          <div key={c.slug} className="card" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div className="client-icon" style={{ background: c.colorBg, margin: 0 }}>{c.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{c.industry}</div>
              </div>
              <span className={`badge badge-${c.active ? 'active' : 'inactive'}`}>{c.active ? 'Activo' : 'Inactivo'}</span>
            </div>

            <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {c.email    && <div>📧 {c.email}</div>}
              {c.instagram && <div>📱 {c.instagram}</div>}
              {c.address  && <div>📍 {c.address}</div>}
            </div>

            {/* Módulos del portal: toggles que guardan al instante en Notion */}
            <div style={{ marginBottom: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 8 }}>
                Módulos del portal
                {saving === c.slug && <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--text-3)' }}>guardando…</span>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {modules.length === 0 && <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>—</span>}
                {modules.map(m => {
                  const on = c.modules.includes(m.key);
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => toggleModule(c.slug, m.key)}
                      disabled={saving === c.slug}
                      title={on ? `Desactivar ${m.nombre}` : `Activar ${m.nombre}`}
                      style={{
                        fontSize: 11.5,
                        padding: '4px 11px',
                        borderRadius: 999,
                        cursor: saving === c.slug ? 'default' : 'pointer',
                        border: on ? '1px solid var(--accent)' : '1px solid var(--border)',
                        background: on ? c.colorBg : 'transparent',
                        color: on ? 'var(--text-1)' : 'var(--text-3)',
                        fontWeight: on ? 600 : 500,
                        opacity: saving === c.slug ? 0.55 : 1,
                        transition: 'all .12s ease',
                      }}
                    >
                      {on ? '✓ ' : ''}{m.nombre}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Link href={`/${c.slug}/dashboard`} className="btn-primary" style={{ fontSize: 12, padding: '5px 12px', gap: 4 }}>
                <ResIcon size={12} /> Dashboard
              </Link>
              {c.modules.includes('menu') && (
                <Link href={`/${c.slug}/menu`} className="btn-sec" style={{ fontSize: 12, padding: '5px 12px', gap: 4 }}>
                  <BarChartIcon size={12} /> Menú
                </Link>
              )}
              {c.modules.includes('contenido') && (
                <Link href={`/${c.slug}/contenido`} className="btn-sec" style={{ fontSize: 12, padding: '5px 12px', gap: 4 }}>
                  <GlobeIcon size={12} /> Contenido
                </Link>
              )}
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
                <th>Módulos</th>
                <th>Desde</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
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
                  <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{c.modules.length} activos</td>
                  <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{c.since}</td>
                  <td><span className={`badge badge-${c.active ? 'active' : 'inactive'}`}>{c.active ? 'Activo' : 'Inactivo'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Link href={`/${c.slug}/dashboard`} className="abtn abtn-conf">Gestionar</Link>
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
