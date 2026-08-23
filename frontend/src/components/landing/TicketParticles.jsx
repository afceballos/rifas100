import React, { useEffect, useRef } from 'react';

const COUNT = 22;
const GOLD = [232, 184, 75];

/**
 * Partículas doradas ambientales para el fondo del hero. Puramente
 * atmosférico: se posterga con requestIdleCallback para no competir con el
 * render inicial, se pausa cuando la pestaña no está visible o el viewport
 * sale de vista, y no se monta si el usuario prefiere movimiento reducido.
 */
export default function TicketParticles({ className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf = null;
    let running = false;
    let particles = [];

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    const spawn = () => ({
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 100,
      r: (Math.random() * 1.8 + 0.6) * devicePixelRatio,
      speed: (Math.random() * 0.35 + 0.15) * devicePixelRatio,
      drift: (Math.random() - 0.5) * 0.3 * devicePixelRatio,
      alpha: Math.random() * 0.5 + 0.2,
      sway: Math.random() * Math.PI * 2,
    });

    const tick = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.y -= p.speed;
        p.sway += 0.01;
        p.x += p.drift + Math.sin(p.sway) * 0.15;
        if (p.y < -20) Object.assign(p, spawn(), { y: canvas.height + 20 });
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${GOLD[0]},${GOLD[1]},${GOLD[2]},${p.alpha})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
    };

    resize();
    particles = Array.from({ length: COUNT }, spawn);

    const io = new IntersectionObserver(([entry]) => {
      entry.isIntersecting ? start() : stop();
    });
    io.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', resize);

    const idle = ('requestIdleCallback' in window ? window.requestIdleCallback : (fn) => setTimeout(fn, 200))(start);

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', resize);
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(idle);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none ${className}`} />;
}
