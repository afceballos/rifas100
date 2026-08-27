const COLORS = ['#0579FB', '#3E97FF', '#141414', '#FBF9F4'];

/**
 * Ráfaga de confeti breve desde (x, y) en coordenadas de viewport. Se usa en
 * el CTA principal como micro-celebración ("puedo ganar algo grande"). Crea
 * un canvas overlay temporal y se autodestruye; no deja nada montado.
 */
export default function confettiBurst(x, y) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;';
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const pieces = Array.from({ length: 46 }, () => {
    const angle = Math.random() * Math.PI - Math.PI * 1.5;
    const speed = (Math.random() * 6 + 4) * devicePixelRatio;
    return {
      x: x * devicePixelRatio,
      y: y * devicePixelRatio,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4 * devicePixelRatio,
      size: (Math.random() * 5 + 3) * devicePixelRatio,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.3,
      life: 1,
    };
  });

  const gravity = 0.28 * devicePixelRatio;
  let frame = 0;
  const maxFrames = 70;

  const tick = () => {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pieces) {
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;
      p.life = 1 - frame / maxFrames;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (frame < maxFrames) {
      requestAnimationFrame(tick);
    } else {
      canvas.remove();
    }
  };

  requestAnimationFrame(tick);
}
