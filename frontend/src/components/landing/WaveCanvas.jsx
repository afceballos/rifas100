import React, { useEffect, useRef } from 'react';

const LINES = 12;
const STEP = 18;
const MAX_DPR = 1.5;

/**
 * Campo de ondas finas de fondo para el hero técnico: respira lentamente y
 * reacciona con un desplazamiento sutil cerca del puntero. Se pausa fuera de
 * viewport/pestaña oculta y se desactiva por completo (un solo frame estático,
 * sin puntero) si el usuario prefiere movimiento reducido.
 */
export default function WaveCanvas({ className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = null;
    let running = false;
    let w = 0;
    let h = 0;
    const pointerTarget = { x: -9999, y: -9999 };
    const pointer = { x: -9999, y: -9999 };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      const spacing = h / (LINES + 1);
      for (let li = 0; li < LINES; li++) {
        const baseY = spacing * (li + 1);
        const breathe = 0.55 + 0.45 * Math.sin(t * 0.00025 + li * 0.4);
        const amp = 9 * breathe;
        ctx.beginPath();
        for (let x = 0; x <= w; x += STEP) {
          let y = baseY + Math.sin(x * 0.008 + t * 0.0006 + li * 0.6) * amp;
          const dx = x - pointer.x;
          const dy = baseY - pointer.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const radius = 170;
          if (dist < radius) {
            const influence = 1 - dist / radius;
            y -= influence * influence * 20;
          }
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(236,237,231,${(0.05 + 0.05 * breathe).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    const tick = (t) => {
      if (!running) return;
      pointer.x += (pointerTarget.x - pointer.x) * 0.08;
      pointer.y += (pointerTarget.y - pointer.y) * 0.08;
      draw(t);
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || reduced) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
    };

    const onPointerMove = (e) => {
      const rect = parent.getBoundingClientRect();
      pointerTarget.x = e.clientX - rect.left;
      pointerTarget.y = e.clientY - rect.top;
    };
    const onPointerLeave = () => {
      pointerTarget.x = -9999;
      pointerTarget.y = -9999;
    };

    resize();

    if (reduced) {
      draw(0);
      const onResize = () => { resize(); draw(0); };
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }

    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    io.observe(canvas);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', resize);
    parent.addEventListener('pointermove', onPointerMove);
    parent.addEventListener('pointerleave', onPointerLeave);

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', resize);
      parent.removeEventListener('pointermove', onPointerMove);
      parent.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none ${className}`} />;
}
