'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const PIN_LEN = 5;
const SQ_STEP = 56; // 48px de cuadro + 8px de gap

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export default function LoginPage() {
  const router = useRouter();
  const [name, setName]       = useState('');
  const [digits, setDigits]   = useState<string[]>([]);
  const [error, setError]     = useState('');
  const [shake, setShake]     = useState(false);
  const [phase, setPhase]     = useState<'idle' | 'busy' | 'welcome'>('idle');
  const [pinAnim, setPinAnim] = useState<'none' | 'fusing' | 'success'>('none');
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
    setPinAnim('fusing'); // los 5 cuadros viajan al centro mientras se verifica
    try {
      const [res] = await Promise.all([
        fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario: key, pin }),
        }),
        delay(550), // que la fusión se vea aunque la API responda al instante
      ]);
      if (!res.ok) throw new Error('auth');
      const user = await res.json();
      sessionStorage.setItem('esm-session', JSON.stringify({
        name:   user.display,
        role:   user.role,
        tenant: user.tenant,
      }));
      setGuest(user.display);
      setPinAnim('success'); // se vuelven uno con check verde
      await delay(900);
      setPhase('welcome');
      setTimeout(() => router.push(user.dest), 1300);
    } catch {
      setPinAnim('none'); // vuelven a su posición original
      await delay(380);
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

  const center = Math.floor(PIN_LEN / 2);
  const pinRowCls = [
    'esm-pin-row',
    shake ? 'shake' : '',
    pinAnim === 'fusing'  ? 'fusing'  : '',
    pinAnim === 'success' ? 'success' : '',
  ].filter(Boolean).join(' ');

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
          <div className={pinRowCls}>
            {Array.from({ length: PIN_LEN }).map((_, i) => (
              <div
                key={i}
                className={`esm-pin-sq ${i < digits.length ? 'filled' : ''}`}
                style={{ '--fuse-x': `${(center - i) * SQ_STEP}px` } as React.CSSProperties}
              >
                {pinAnim === 'success' && i === center
                  ? <div className="esm-pin-check">✓</div>
                  : i < digits.length && <div className="esm-pin-dot" />}
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
