'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const PIN_LEN = 5;

export default function LoginPage() {
  const router = useRouter();
  const [name, setName]       = useState('');
  const [digits, setDigits]   = useState<string[]>([]);
  const [error, setError]     = useState('');
  const [shake, setShake]     = useState(false);
  const [phase, setPhase]     = useState<'idle' | 'busy' | 'welcome'>('idle');
  const [guest, setGuest]     = useState('');
  const nameRef               = useRef('');
  const digitsRef             = useRef<string[]>([]);

  // Keep refs in sync for use inside closures
  useEffect(() => { nameRef.current = name; }, [name]);
  useEffect(() => { digitsRef.current = digits; }, [digits]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const verify = async (pin: string) => {
    const key = nameRef.current.trim().toLowerCase();
    if (!key) {
      setError('Ingresá tu nombre');
      triggerShake();
      setDigits([]);
      return;
    }
    setPhase('busy');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: key, pin }),
      });
      if (!res.ok) throw new Error('auth');
      const user = await res.json();
      sessionStorage.setItem('esm-session', JSON.stringify({
        name:   user.display,
        role:   user.role,
        tenant: user.tenant,
      }));
      setGuest(user.display);
      setPhase('welcome');
      setTimeout(() => router.push(user.dest), 1300);
    } catch {
      setPhase('idle');
      setError('Nombre o PIN incorrecto');
      triggerShake();
      setDigits([]);
    }
  };

  const addDigit = (d: string) => {
    if (phase !== 'idle') return;
    setError('');
    setDigits(prev => {
      if (prev.length >= PIN_LEN) return prev;
      const next = [...prev, d];
      if (next.length === PIN_LEN) setTimeout(() => verify(next.join('')), 80);
      return next;
    });
  };

  const delDigit = () => {
    if (phase !== 'idle') return;
    setError('');
    setDigits(prev => prev.slice(0, -1));
  };

  // Physical keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'idle') return;
      if (/^[0-9]$/.test(e.key)) addDigit(e.key);
      if (e.key === 'Backspace')  delDigit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ── Welcome screen ───────────────────────────────────────────────────────────
  if (phase === 'welcome') {
    return (
      <div className="esm-login-screen">
        <div className="esm-welcome-text in">
          <div className="esm-welcome-greeting">Bienvenido,</div>
          <div className="esm-welcome-name">{guest}</div>
        </div>
      </div>
    );
  }

  // ── Login screen ─────────────────────────────────────────────────────────────
  return (
    <div className="esm-login-screen">
      <div className="esm-login-inner">

        {/* Logo */}
        <div className="esm-login-logo-wrap">
          <img src="/icon-index.png" className="esm-login-icon" alt="Index" />
          <div className="esm-login-brand">Indexte</div>
        </div>

        {/* Name */}
        <div className="esm-field-wrap">
          <div className="esm-field-label">Usuario</div>
          <input
            className="esm-name-input"
            type="text"
            placeholder="Tu nombre"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={name}
            onChange={e => { setName(e.target.value); setError(''); setDigits([]); }}
          />
        </div>

        {/* PIN squares */}
        <div className="esm-field-wrap">
          <div className="esm-field-label">PIN</div>
          <div className={`esm-pin-row ${shake ? 'shake' : ''}`}>
            {Array.from({ length: PIN_LEN }).map((_, i) => (
              <div key={i} className={`esm-pin-sq ${i < digits.length ? 'filled' : ''}`}>
                {i < digits.length && <div className="esm-pin-dot" />}
              </div>
            ))}
          </div>
          <div className="esm-pin-error">{error}</div>
        </div>

        {/* Numpad */}
        <div className="esm-numpad">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => {
            if (k === '')  return <button key={i} className="esm-key empty" disabled aria-hidden />;
            if (k === '⌫') return <button key={i} className="esm-key del" type="button" onClick={delDigit}>{k}</button>;
            return <button key={i} className="esm-key" type="button" onClick={() => addDigit(k)}>{k}</button>;
          })}
        </div>

        {phase === 'busy' && <div className="esm-login-loading">Verificando…</div>}
      </div>
    </div>
  );
}
