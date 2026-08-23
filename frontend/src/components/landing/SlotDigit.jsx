import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const LOOPS = 3;
const DIGITS = Array.from({ length: 10 * LOOPS }, (_, i) => i % 10);

/**
 * Un solo dígito con efecto de rodillo tipo "máquina tragamonedas": al montar
 * gira desde arriba hasta asentarse en `value`; en cada cambio posterior
 * (tick del contador) rueda con un giro corto. Puramente decorativo
 * (aria-hidden) — el valor accesible lo expone el componente que lo usa.
 */
export default function SlotDigit({ value, spinOnMount = true, shuffleTrigger = 0, className = '' }) {
  const stripRef = useRef(null);
  const mounted = useRef(false);
  const prevShuffle = useRef(shuffleTrigger);

  useGSAP(() => {
    const strip = stripRef.current;
    const rowH = strip?.firstChild?.offsetHeight;
    if (!strip || !rowH) return;

    const targetY = -(10 + value) * rowH;
    const reshuffled = shuffleTrigger !== prevShuffle.current;
    prevShuffle.current = shuffleTrigger;

    if (!mounted.current && spinOnMount) {
      gsap.set(strip, { y: -value * rowH });
      gsap.to(strip, { y: targetY, duration: 1.1, delay: 0.15, ease: 'back.out(1.4)' });
    } else if (!mounted.current) {
      gsap.set(strip, { y: targetY });
    } else if (reshuffled) {
      gsap.set(strip, { y: -value * rowH });
      gsap.to(strip, { y: targetY, duration: 0.85, ease: 'back.out(1.6)' });
    } else {
      gsap.to(strip, { y: targetY, duration: 0.45, ease: 'power2.out' });
    }
    mounted.current = true;
  }, { dependencies: [value, shuffleTrigger], scope: stripRef });

  return (
    <span aria-hidden="true" className={`relative inline-block overflow-hidden select-none ${className}`} style={{ lineHeight: 1 }}>
      <span className="block invisible">0</span>
      <span ref={stripRef} className="absolute inset-x-0 top-0 flex flex-col will-change-transform">
        {DIGITS.map((d, i) => (
          <span key={i} className="block">{d}</span>
        ))}
      </span>
    </span>
  );
}
