import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import SlotDigit from './SlotDigit';
import TicketMark from './TicketMark';

gsap.registerPlugin(useGSAP);

const SERIAL = [0, 4, 2, 7];

/**
 * Panel "boleto" del hero: serial con efecto de rodillo (SlotDigit) arriba,
 * divisor perforado, y un sello de marca que golpea el boleto una vez que
 * el serial termina de girar. Es el mockup del producto real: un número
 * reservado siempre se convierte en un boleto con su propio serial.
 */
export default function TicketStubPanel({ className = '' }) {
  const stampRef = useRef(null);

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(stampRef.current, { opacity: 1, scale: 1, rotate: -8 });
      return;
    }
    gsap.fromTo(
      stampRef.current,
      { opacity: 0, scale: 1.5, rotate: -14 },
      { opacity: 1, scale: 1, rotate: -8, duration: 0.5, delay: 1.9, ease: 'back.out(1.7)' }
    );
  }, {});

  return (
    <div className={`relative rounded-[24px] border-[1.6px] border-raffle-ink bg-white shadow-ink dark:border-raffle-paper dark:bg-zinc-900 ${className}`}>
      <div className="flex flex-col items-center gap-1.5 px-6 pb-6 pt-7">
        <p className="font-mono text-[11px] uppercase tracking-wider text-raffle-ink/50 dark:text-raffle-paper/50">
          Boleto N.º
        </p>
        <div className="flex gap-1.5">
          {SERIAL.map((d, i) => (
            <SlotDigit
              key={i}
              value={d}
              spinOnMount
              className="flex h-14 w-9 items-center justify-center rounded-md bg-raffle-ink font-mono text-2xl font-bold text-raffle-blueLight"
            />
          ))}
        </div>
      </div>

      <div className="ticket-notch mx-6" />

      <div className="flex flex-col items-center gap-2 px-6 pb-7 pt-6">
        <div
          ref={stampRef}
          className="flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-full border-[2.5px] border-raffle-blue opacity-0"
        >
          <TicketMark className="h-8 w-auto text-raffle-blue" />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-raffle-blue">
            Verificado
          </span>
        </div>
      </div>
    </div>
  );
}
