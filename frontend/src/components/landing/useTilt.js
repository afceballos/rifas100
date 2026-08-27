import { useEffect, useRef } from 'react';

/**
 * Inclinación 3D sutil que sigue al puntero dentro del elemento (mismo gesto
 * que el dispositivo del hero). Desactivada por completo con movimiento
 * reducido — el elemento se queda plano, sin listeners.
 */
export default function useTilt(maxTilt = 6) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `rotateX(${(-ny * maxTilt).toFixed(2)}deg) rotateY(${(nx * maxTilt).toFixed(2)}deg)`;
    };
    const onLeave = () => {
      el.style.transform = 'rotateX(0deg) rotateY(0deg)';
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [maxTilt]);

  return ref;
}
