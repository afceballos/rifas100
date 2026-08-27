import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import WaveCanvas from './WaveCanvas';
import SlotDigit from './SlotDigit';

const NUMBERS = [128, 356, 742, 891, 34];
const MAX_TILT = 8;

/**
 * Hero fullscreen técnico: campo de ondas en Canvas 2D de fondo, y un
 * dispositivo con CSS 3D (halo orbital + dos métricas flotantes) que se
 * inclina hasta 8° siguiendo el puntero, sin desplazarse de su sitio.
 * Respeta prefers-reduced-motion en cada pieza (ondas, halo, inclinación).
 * El header del sitio vive en Landing.jsx (un solo nav para toda la página).
 */
export default function HeroOrbital() {
  const sectionRef = useRef(null);
  const deviceRef = useRef(null);
  const [numberIndex, setNumberIndex] = useState(0);
  const [shuffle, setShuffle] = useState(0);
  const digits = String(NUMBERS[numberIndex]).padStart(3, '0').split('').map(Number);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setInterval(() => {
      setNumberIndex((i) => (i + 1) % NUMBERS.length);
      setShuffle((s) => s + 1);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const device = deviceRef.current;
    if (!section || !device) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let raf = null;
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;

    const onPointerMove = (e) => {
      const rect = section.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      targetY = nx * MAX_TILT;
      targetX = -ny * MAX_TILT;
    };
    const onPointerLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const tick = () => {
      curX += (targetX - curX) * 0.08;
      curY += (targetY - curY) * 0.08;
      device.style.transform = `rotateX(${curX.toFixed(2)}deg) rotateY(${curY.toFixed(2)}deg)`;
      raf = requestAnimationFrame(tick);
    };

    section.addEventListener('pointermove', onPointerMove);
    section.addEventListener('pointerleave', onPointerLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      section.removeEventListener('pointermove', onPointerMove);
      section.removeEventListener('pointerleave', onPointerLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex min-h-[92vh] flex-col overflow-hidden bg-[#0B100D] text-[#ECEDE7]"
    >
      <WaveCanvas className="absolute inset-0 z-0 h-full w-full" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-14 px-6 py-16 lg:grid-cols-[1fr_2fr] lg:gap-8">
        <div className="order-1 text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-raffle-green/30 bg-raffle-green/10 px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-raffle-green">
            Para organizadores de rifas
          </span>

          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
            Tu rifa, vendida con <span className="text-raffle-green">boletos</span> que se sienten como boletos.
          </h1>

          <p className="mx-auto mt-6 max-w-md font-body text-lg text-[#ECEDE7]/65 lg:mx-0">
            Cada número reservado se convierte en un boleto real: serial, QR y todo, listo para compartir con tu
            comprador. Crea tu talonario en minutos.
          </p>

          <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              to="/registro"
              className="inline-flex items-center gap-2 rounded-2xl bg-raffle-green px-7 py-3.5 text-base font-bold text-[#0B100D] transition-transform duration-200 hover:scale-[1.04] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-raffle-green focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B100D]"
            >
              Crear mi rifa gratis
              <ArrowRight size={18} />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center gap-2 rounded-2xl border border-[#ECEDE7]/20 px-7 py-3.5 text-base font-semibold text-[#ECEDE7]/90 transition-colors hover:border-raffle-green/50 hover:text-raffle-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-raffle-green focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B100D]"
            >
              Ver cómo funciona
            </a>
          </div>
        </div>

        <div className="order-2 flex justify-center lg:justify-end">
          <div
            className="relative flex h-[300px] w-[220px] items-center justify-center sm:h-[360px] sm:w-[260px]"
            style={{ perspective: '900px' }}
          >
            <div
              aria-hidden="true"
              className="absolute inset-[-18%] rounded-full motion-safe:animate-[spin_16s_linear_infinite] motion-reduce:animate-none"
              style={{
                background:
                  'conic-gradient(from 0deg, transparent 0deg, rgba(199,255,67,0.35) 60deg, transparent 140deg, transparent 220deg, rgba(199,255,67,0.2) 300deg, transparent 360deg)',
                maskImage: 'radial-gradient(closest-side, transparent 78%, black 80%, black 84%, transparent 86%)',
                WebkitMaskImage:
                  'radial-gradient(closest-side, transparent 78%, black 80%, black 84%, transparent 86%)',
              }}
            />

            <div
              ref={deviceRef}
              className="relative flex h-full w-full flex-col items-center justify-between rounded-[32px] border border-[#ECEDE7]/12 bg-gradient-to-b from-[#141914] to-[#0B100D] px-5 py-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
              style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ECEDE7]/40">Boleto en vivo</p>

              <div className="flex gap-1">
                {digits.map((d, i) => (
                  <SlotDigit
                    key={i}
                    value={d}
                    spinOnMount
                    shuffleTrigger={shuffle}
                    className="flex h-12 w-8 items-center justify-center font-mono text-3xl font-bold text-raffle-green"
                  />
                ))}
              </div>

              <div className="flex gap-1" aria-hidden="true">
                {Array.from({ length: 14 }).map((_, i) => (
                  <span key={i} className="h-3 w-[2px] rounded-full bg-[#ECEDE7]/15" />
                ))}
              </div>
            </div>

            <div className="absolute -right-4 top-2 hidden rounded-xl border border-[#ECEDE7]/10 bg-[#141914]/80 px-3 py-2 backdrop-blur-sm motion-safe:animate-float motion-reduce:animate-none sm:block lg:-right-10">
              <p className="font-mono text-[9px] uppercase tracking-wider text-[#ECEDE7]/45">Talonario</p>
              <p className="font-mono text-sm font-semibold text-[#ECEDE7]">1,000 números</p>
            </div>

            <div
              className="absolute -left-2 bottom-4 rounded-xl border border-[#ECEDE7]/10 bg-[#141914]/80 px-3 py-2 backdrop-blur-sm motion-safe:animate-float motion-reduce:animate-none sm:-left-8"
              style={{ animationDelay: '1.4s' }}
            >
              <p className="font-mono text-[9px] uppercase tracking-wider text-[#ECEDE7]/45">Boleto</p>
              <p className="font-mono text-sm font-semibold text-[#ECEDE7]">QR verificable</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
