'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { useClient } from '../../../lib/use-clients';
import { tieneMenuDelDia } from '../../../lib/features';

const TODAY = new Date().toISOString().slice(0, 10);

type LiveRes  = { id: string; nombreCliente: string; estado: string; fecha: string; hora: string; notas: string; };
type MenuItem = { id: string; nombre: string; activo: boolean; platoDelDia: boolean; };
type MenuData = { items: MenuItem[]; categories: unknown[]; subcategories: unknown[]; };

const ESTADO_BADGE: Record<string, string> = {
  Confirmada: 'confirmed', Pendiente: 'pending',
  Cancelada:  'cancelled', Completada: 'confirmed',
};

export default function TenantDashboard() {
  const { tenant } = useParams<{ tenant: string }>();
  const { client }  = useClient(tenant);
  const [reservas, setReservas] = useState<LiveRes[]>([]);
  const [menu, setMenu]         = useState<MenuData | null>(null);

  const has = (k: string) => client?.modules.includes(k) ?? false;

  const loadReservas = useCallback(async () => {
    const data = await fetch(`/api/${tenant}/reservas`).then(r => r.json()).catch(() => []);
    setReservas(Array.isArray(data) ? data : []);
  }, [tenant]);

  const loadMenu = useCallback(async () => {
    const data = await fetch(`/api/${tenant}/menu`).then(r => r.json()).catch(() => null);
    setMenu(data);
  }, [tenant]);

  // Only fetch data for modules this client actually has enabled.
  useEffect(() => {
    if (!client) return;
    if (client.modules.includes('reservas')) loadReservas();
    if (client.modules.includes('menu'))     loadMenu();
  }, [client, loadReservas, loadMenu]);

  async function confirm(id: string) {
    await fetch(`/api/${tenant}/reservas/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'Confirmada' }),
    });
    setReservas(prev => prev.map(r => r.id === id ? { ...r, estado: 'Confirmada' } : r));
  }

  const pending = reservas.filter(r => r.estado === 'Pendiente').length;
  const todayRs = reservas.filter(r => r.fecha === TODAY).length;
  const recent  = [...reservas].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora)).slice(0, 8);

  const menuItems  = menu?.items ?? [];
  const menuActive = menuItems.filter(i => i.activo).length;
  const menuDaily  = menuItems.filter(i => i.platoDelDia);
  const menuCats   = menu?.categories?.length ?? 0;

  const dateStr = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });

  if (!client) return null;

  const noModules = client.modules.length === 0;

  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <div className="pg-title">{client.emoji} {client.name}</div>
        <div className="pg-sub" style={{ textTransform: 'capitalize' }}>{dateStr}</div>
      </div>

      {/* ── RESERVAS ─────────────────────────────────────────────────────── */}
      {has('reservas') && (
        <section style={{ marginBottom: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <Link href={`/${tenant}/reservas`} className="today-hero"
              style={{ background: pending > 0 ? 'linear-gradient(135deg,rgba(245,158,11,.14),rgba(245,158,11,.06))' : 'linear-gradient(135deg,rgba(99,102,241,.14),rgba(139,92,246,.06))', borderColor: pending > 0 ? 'rgba(245,158,11,.25)' : 'rgba(99,102,241,.22)' }}>
              <div className="today-val" style={{ color: pending > 0 ? 'var(--yellow)' : '#a5b4fc' }}>{pending}</div>
              <div>
                <div className="today-label">{pending === 1 ? 'Pendiente' : 'Pendientes'}</div>
                <div className="today-sub">{pending > 0 ? 'Necesitan confirmación' : 'Todo confirmado ✓'}</div>
              </div>
            </Link>
            <Link href={`/${tenant}/reservas`} className="today-hero"
              style={{ background: 'linear-gradient(135deg,rgba(16,185,129,.12),rgba(16,185,129,.05))', borderColor: 'rgba(16,185,129,.22)' }}>
              <div className="today-val" style={{ color: 'var(--green)' }}>{todayRs}</div>
              <div>
                <div className="today-label">Hoy</div>
                <div className="today-sub">{todayRs === 0 ? 'Sin reservas hoy' : `${todayRs} ${todayRs === 1 ? 'reserva' : 'reservas'}`}</div>
              </div>
            </Link>
          </div>

          <div className="card">
            <div className="card-hd">
              <div className="card-title">Últimas reservas</div>
              <Link href={`/${tenant}/reservas`} className="card-link">Ver todas →</Link>
            </div>
            {recent.length === 0 ? (
              <div className="empty">Sin reservas aún</div>
            ) : (
              <div className="stagger">
                {recent.map(r => (
                  <div key={r.id} className="res-row">
                    <div className="res-av">{r.nombreCliente.slice(0, 2).toUpperCase()}</div>
                    <div className="res-info">
                      <div className="res-name">{r.nombreCliente}</div>
                      <div className="res-meta">{r.hora}{r.notas ? ` · ${r.notas}` : ''}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span className={`badge badge-${ESTADO_BADGE[r.estado] ?? 'pending'}`}>{r.estado}</span>
                      {r.estado === 'Pendiente' && (
                        <button className="abtn abtn-conf" onClick={() => confirm(r.id)} title="Confirmar">✓</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── MENÚ ─────────────────────────────────────────────────────────── */}
      {has('menu') && (
        <section style={{ marginBottom: 18 }}>
          <div className="card">
            <div className="card-hd">
              <div className="card-title">🍽️ Menú</div>
              <Link href={`/${tenant}/menu`} className="card-link">Gestionar →</Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, paddingTop: 4 }}>
              {[
                { val: menuItems.length, label: 'Platos' },
                { val: menuActive,       label: 'Activos' },
                { val: menuCats,         label: menuCats === 1 ? 'Categoría' : 'Categorías' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Syne' }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {tieneMenuDelDia(tenant) && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>
                  ★ Menú del día {menuDaily.length > 0 && `(${menuDaily.length})`}
                </div>
                {menuDaily.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                    Ningún plato del día seleccionado. <Link href={`/${tenant}/menu`} style={{ color: 'var(--accent-1)', textDecoration: 'none' }}>Elegir platos →</Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {menuDaily.map(it => (
                      <span key={it.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)', borderRadius: 8, padding: '5px 11px', fontSize: 12.5, fontWeight: 600 }}>
                        <span style={{ color: '#f59e0b' }}>★</span> {it.nombre}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── CONTENIDO ────────────────────────────────────────────────────── */}
      {has('contenido') && (
        <section style={{ marginBottom: 18 }}>
          <Link href={`/${tenant}/contenido`} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', color: 'inherit' }}>
            <div className="quick-ic" style={{ background: 'rgba(245,158,11,.12)', flexShrink: 0 }}>🌐</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Contenido del sitio</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Galería, horarios, reseñas, Instagram, promos y contacto</div>
            </div>
            <span style={{ color: 'var(--text-3)', fontSize: 18 }}>→</span>
          </Link>
        </section>
      )}

      {/* ── CRM ──────────────────────────────────────────────────────────── */}
      {has('crm') && (
        <section style={{ marginBottom: 18 }}>
          <Link href={`/${tenant}/crm`} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', color: 'inherit' }}>
            <div className="quick-ic" style={{ background: 'rgba(16,185,129,.12)', flexShrink: 0 }}>👥</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Clientes (CRM)</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Base de datos de clientes y contactos</div>
            </div>
            <span style={{ color: 'var(--text-3)', fontSize: 18 }}>→</span>
          </Link>
        </section>
      )}

      {noModules && (
        <div className="empty" style={{ padding: 40 }}>
          Este portal no tiene módulos activos todavía.
        </div>
      )}

      {client.website && (
        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <a href={client.website} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: 'var(--text-3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ opacity: .6 }}>🌐</span> Ver sitio web público
          </a>
        </div>
      )}
    </>
  );
}
