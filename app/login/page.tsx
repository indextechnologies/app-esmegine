'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CLIENTS } from '../../lib/demo-data';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole]   = useState<'admin' | 'client'>('admin');
  const [pin, setPin]     = useState('');
  const [slug, setSlug]   = useState('bom-pain');
  const [error, setError] = useState('');

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (role === 'admin') {
      if (pin !== '1234') { setError('PIN incorrecto'); return; }
      localStorage.setItem('esm_role', 'admin');
      router.push('/admin');
    } else {
      if (pin !== '1234') { setError('PIN incorrecto'); return; }
      const client = CLIENTS.find(c => c.slug === slug);
      if (!client) { setError('Cliente no encontrado'); return; }
      localStorage.setItem('esm_role', 'client');
      localStorage.setItem('esm_tenant', slug);
      router.push(`/${slug}/dashboard`);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-gem">E</div>
          <div className="login-brand">esmegine</div>
          <div className="login-sub">Plataforma de gestión · Index Technologies</div>
        </div>

        <div className="role-toggle">
          <button
            type="button"
            className={`role-btn ${role === 'admin' ? 'active' : ''}`}
            onClick={() => setRole('admin')}
          >
            🔑 Index Admin
          </button>
          <button
            type="button"
            className={`role-btn ${role === 'client' ? 'active' : ''}`}
            onClick={() => setRole('client')}
          >
            🏪 Mi negocio
          </button>
        </div>

        <form onSubmit={handleLogin}>
          {role === 'client' && (
            <div className="field-group">
              <label className="field-label">Negocio</label>
              <select
                className="field-input"
                value={slug}
                onChange={e => setSlug(e.target.value)}
              >
                {CLIENTS.map(c => (
                  <option key={c.slug} value={c.slug}>{c.emoji} {c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="field-group">
            <label className="field-label">PIN de acceso</label>
            <input
              type="password"
              className="field-input"
              placeholder="••••"
              maxLength={4}
              value={pin}
              onChange={e => setPin(e.target.value)}
              style={{ letterSpacing: '0.3em', fontSize: 18 }}
            />
          </div>

          {error && (
            <div style={{ padding: '8px 12px', background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 8, color: 'var(--red)', fontSize: 13, marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
            Ingresar →
          </button>
        </form>

        <div className="login-hint">
          <strong>Demo:</strong> PIN <code style={{ background: 'var(--bg-base)', padding: '1px 5px', borderRadius: 4 }}>1234</code> para todos los accesos.
          <br />
          Admin Index → acceso total · Mi negocio → vista de cliente.
        </div>
      </div>
    </div>
  );
}
