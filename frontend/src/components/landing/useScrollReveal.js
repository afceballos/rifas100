import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Fade+slide de entrada para los elementos `selector` dentro del contenedor,
 * disparado por scroll (no bloquea la carga inicial: ScrollTrigger solo
 * anima lo que entra en viewport).
 */
export default function useScrollReveal(selector = '.reveal', options = {}) {
  const scope = useRef(null);

  useGSAP(() => {
    const targets = gsap.utils.toArray(selector);
    if (!targets.length) return;

    gsap.set(targets, { opacity: 0, y: options.y ?? 28 });

    ScrollTrigger.batch(targets, {
      start: 'top 85%',
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: options.stagger ?? 0.12,
        }),
    });
  }, { scope });

  return scope;
}
