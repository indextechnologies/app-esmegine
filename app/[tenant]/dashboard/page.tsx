'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { useClient } from '../../../lib/use-clients';

const TODAY = new Date().toISOString().slice(0, 10);

type LiveRes = { id: string; nombreCliente: string; estado: string; fecha: string; hora: string; notas: string; };

const ESTADO_BADGE: Record<string, string> = {
  Confirmada: 'confirmed', Pendiente: 'pending',
  Cancelada:  'cancelled', Completada: 'confirmed',
};

export default function TenantDashboard() {
  const { tenant } = useParams<{ tenant: string }>();
  const { client }  = useClient(tenant);
  const [reservas, setReservas] = useState<LiveRes[]>([]);

  const load = useCallback(async () => {
    const data = await fetch(`/api/${tenant}/reservas`).then(r => r.json()).catch(() => []);
    setReservas(data);
  }, [tenant]);

  useEffect(() => { load(); }, [load]);

  async function confirm(id: string) {
    await fetch(`/api/${tenant}/reservas/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'Confirmada' }),
    });
    setReservas(prev => prev.map(r => r.id === id ? { ...r, estado: 'Confirmada' } : r));
  }

  const pending = reservas.filter(r => r.estado === 'Pendiente').length;
  const todayRs = reservas.filter(r => r.fecha === TODAY).length;
  const recent  = [...reservas].sort((a,b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora)).slice(0, 8);

  const dateStr = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });

  if (!client) return null;

  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <div className="pg-title">{client.emoji} {client.name}</div>
        <div className="pg-sub" style={{ textTransform: 'capitalize' }}>{dateStr}</div>
      </div>

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

      <div className="quick-grid">
        <Link href={`/${tenant}/website`} className="quick-card">
          <div className="quick-ic" style={{ background: 'rgba(99,102,241,.12)' }}>🌐</div>
          <div className="quick-label">Editar sitio</div>
          <div className="quick-sub">Menú, horarios, galería</div>
        </Link>
        <Link href={`/${tenant}/reservas`} className="quick-card">
          <div className="quick-ic" style={{ background: 'rgba(16,185,129,.12)' }}>📅</div>
          <div className="quick-label">Reservas</div>
          <div className="quick-sub">Ver y gestionar</div>
        </Link>
        <Link href={`/${tenant}/crm`} className="quick-card">
          <div className="quick-ic" style={{ background: 'rgba(245,158,11,.12)' }}>👥</div>
          <div className="quick-label">Clientes</div>
          <div className="quick-sub">Base de datos</div>
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
