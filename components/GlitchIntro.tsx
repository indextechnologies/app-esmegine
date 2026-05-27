'use client';

import { useEffect, useRef } from 'react';

export default function GlitchIntro() {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = el.current;
    if (!node) return;

    if (sessionStorage.getItem('ix-seen')) {
      node.style.display = 'none';
      return;
    }
    sessionStorage.setItem('ix-seen', '1');

    const timer = setTimeout(() => {
      node.classList.add('gl-exit');
      setTimeout(() => node.remove(), 380);
    }, 2100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div ref={el} id="intro-overlay">
        <div className="gl">
          <div className="gl-main" />
          <div className="gl-r" />
          <div className="gl-b" />
        </div>
      </div>
      <style>{`
        #intro-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.35s ease;
        }
        #intro-overlay.gl-exit { opacity: 0; pointer-events: none; }

        .gl {
          position: relative;
          width: 150px;
          height: 150px;
        }

        .gl-main, .gl-r, .gl-b {
          position: absolute;
          inset: 0;
          background: url('/icon-index-transparent.png') center / contain no-repeat;
        }

        .gl-r {
          mix-blend-mode: screen;
          filter: sepia(1) saturate(20) hue-rotate(-15deg);
          opacity: 0;
          animation: glitch-r 1.6s steps(1) 0.4s forwards;
        }

        .gl-b {
          mix-blend-mode: screen;
          filter: sepia(1) saturate(20) hue-rotate(190deg);
          opacity: 0;
          animation: glitch-b 1.6s steps(1) 0.4s forwards;
        }

        .gl-main {
          animation: glitch-main 1.6s steps(1) 0.3s forwards;
        }

        @keyframes glitch-main {
          0%,100%  { transform: none; clip-path: none; opacity: 1; }
          18%  { transform: none; clip-path: none; opacity: 1; }
          20%  { transform: translateX(-5px) skewX(-3deg); clip-path: inset(8% 0 58% 0); opacity: 0.85; }
          22%  { transform: translateX(6px) skewX(2deg); clip-path: inset(48% 0 18% 0); }
          24%  { transform: none; clip-path: none; opacity: 1; }
          43%  { transform: none; clip-path: none; }
          45%  { transform: translateX(-8px); clip-path: inset(28% 0 32% 0); opacity: 0.75; }
          46%  { transform: translateX(8px); clip-path: inset(3% 0 72% 0); }
          48%  { transform: none; clip-path: none; opacity: 1; }
          66%  { transform: none; clip-path: none; }
          68%  { transform: translateX(-12px) scaleX(1.04); clip-path: inset(18% 0 42% 0); opacity: 0.7; }
          69%  { transform: translateX(12px) scaleX(0.96); clip-path: inset(52% 0 12% 0); }
          70%  { transform: translateX(-6px); clip-path: inset(78% 0 3% 0); opacity: 0.5; }
          72%  { transform: none; clip-path: none; opacity: 1; }
          86%  { transform: none; clip-path: none; }
          88%  { transform: translateX(-3px); clip-path: inset(38% 0 28% 0); opacity: 0.9; }
          90%  { transform: none; clip-path: none; opacity: 1; }
        }

        @keyframes glitch-r {
          0%,100% { opacity: 0; }
          20%  { opacity: 0.7; transform: translateX(7px);  clip-path: inset(8%  0 58% 0); }
          22%  { opacity: 0; }
          45%  { opacity: 0.7; transform: translateX(9px);  clip-path: inset(48% 0 18% 0); }
          48%  { opacity: 0; }
          68%  { opacity: 0.65; transform: translateX(14px); clip-path: inset(3%  0 72% 0); }
          72%  { opacity: 0; }
          88%  { opacity: 0.5; transform: translateX(4px);  clip-path: inset(52% 0 12% 0); }
          90%  { opacity: 0; }
        }

        @keyframes glitch-b {
          0%,100% { opacity: 0; }
          20%  { opacity: 0.7; transform: translateX(-7px);  clip-path: inset(52% 0 15% 0); }
          22%  { opacity: 0; }
          45%  { opacity: 0.7; transform: translateX(-9px);  clip-path: inset(10% 0 65% 0); }
          48%  { opacity: 0; }
          68%  { opacity: 0.65; transform: translateX(-14px); clip-path: inset(68% 0 5%  0); }
          72%  { opacity: 0; }
          88%  { opacity: 0.5; transform: translateX(-4px);  clip-path: inset(20% 0 55% 0); }
          90%  { opacity: 0; }
        }
      `}</style>
    </>
  );
}
