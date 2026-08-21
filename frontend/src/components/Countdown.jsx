import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

/**
 * Countdown to a target ISO date.
 * Pulses each second with GSAP for visual feedback.
 */
export default function Countdown({ target }) {
  const [now, setNow] = useState(() => Date.now());
  const digitRefs = useRef({});

  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  const targetMs = target ? new Date(target).getTime() : 0;
  const diff = Math.max(0, targetMs - now);
  const finished = targetMs > 0 && diff === 0;

  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);

  const pad = (n, len = 2) => String(n).padStart(len, '0');

  // Pulse animation whenever seconds change
  const lastS = useRef(s);
  useEffect(() => {
    if (lastS.current === s) return;
    lastS.current = s;
    const el = digitRefs.current['s'];
    if (!el) return;
    gsap.fromTo(el,
      { scale: 1.18, color: '#3b82f6' },
      { scale: 1, color: 'currentColor', duration: 0.45, ease: 'power2.out' }
    );
  }, [s]);

  const Cell = ({ value, label, keyName }) => (
    <div className="flex flex-col items-center">
      <div className="relative">
        <span
          ref={el => (digitRefs.current[keyName] = el)}
          className="countdown-digit tabular-nums text-5xl sm:text-6xl font-extrabold tracking-tight"
        >
          {pad(value, keyName === 'd' ? 3 : 2)}
        </span>
      </div>
      <span className="mt-2 text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
    </div>
  );

  if (!target) return null;

  return (
    <div className="inline-flex items-end gap-3 sm:gap-6 p-5 sm:p-6 rounded-3xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-xl">
      {finished ? (
        <div className="text-2xl font-extrabold text-blue-500 px-2">¡El sorteo está en curso!</div>
      ) : (
        <>
          <Cell value={d} label="Días" keyName="d" />
          <span className="text-3xl sm:text-4xl font-extrabold text-zinc-300 dark:text-zinc-700 mb-7">:</span>
          <Cell value={h} label="Horas" keyName="h" />
          <span className="text-3xl sm:text-4xl font-extrabold text-zinc-300 dark:text-zinc-700 mb-7">:</span>
          <Cell value={m} label="Min" keyName="m" />
          <span className="text-3xl sm:text-4xl font-extrabold text-zinc-300 dark:text-zinc-700 mb-7">:</span>
          <Cell value={s} label="Seg" keyName="s" />
        </>
      )}
    </div>
  );
}
