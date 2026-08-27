import React, { useState } from 'react';
import SlotDigit from './SlotDigit';
import TicketMark from './TicketMark';
import useScrollReveal from './useScrollReveal';
import useTilt from './useTilt';

const TYPES = [
  {
    digits: [0, 0],
    title: '2 cifras',
    count: '100 números',
    range: '00–99',
    serial: 'N.º 01',
    desc: 'Ideales para premios pequeños y rifas exprés: meriendas, accesorios, fin de semana.',
  },
  {
    digits: [0, 0, 0],
    title: '3 cifras',
    count: '1,000 números',
    range: '000–999',
    serial: 'N.º 02',
    desc: 'La más usada: celulares, electrodomésticos, viajes cortos — el punto justo entre alcance y velocidad de venta.',
  },
  {
    digits: [0, 0, 0, 0],
    title: '4 cifras',
    count: '10,000 números',
    range: '0000–9999',
    serial: 'N.º 03',
    desc: 'Para el premio grande: motos, autos, remodelaciones — el talonario más largo que genera el sistema.',
  },
];

function DigitStamp({ digits }) {
  const [shuffle, setShuffle] = useState(0);
  return (
    <div
      onMouseEnter={() => setShuffle((s) => s + 1)}
      className="flex gap-0.5 rounded-lg bg-raffle-ink px-3 py-2.5 w-fit"
    >
      {digits.map((d, i) => (
        <SlotDigit
          key={i}
          value={d}
          spinOnMount
          shuffleTrigger={shuffle}
          className="text-2xl font-mono font-bold text-raffle-greenLight"
        />
      ))}
    </div>
  );
}

// Anillo de "luz" animada alrededor del borde, visible solo al hover (se
// desactiva con movimiento reducido: queda como borde fijo, sin girar).
function GlowRing() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-[-60%] opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-safe:group-hover:animate-[spin_2.4s_linear_infinite]"
      style={{
        background:
          'conic-gradient(from 0deg, transparent 0%, #C7FF43 6%, #DFFF8A 12%, transparent 24%, transparent 100%)',
      }}
    />
  );
}

function TicketCard({ children, className = '' }) {
  const tiltRef = useTilt(6);

  return (
    <div style={{ perspective: '900px' }} className={`group h-full ${className}`}>
      <div
        ref={tiltRef}
        className="relative h-full overflow-hidden rounded-[22px] p-[1.5px] transition-transform duration-200 [transition-timing-function:cubic-bezier(.23,1,.32,1)]"
        style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      >
        <GlowRing />
        <article className="relative z-10 flex h-full flex-col rounded-[20.5px] border-[1.6px] border-raffle-ink bg-white dark:border-raffle-paper dark:bg-zinc-900">
          <span
            aria-hidden="true"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center text-raffle-greenDark opacity-0 transition-all duration-300 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] group-hover:rotate-[8deg] group-hover:scale-100 group-hover:opacity-90 dark:text-raffle-greenLight"
          >
            <TicketMark className="h-full w-full" />
          </span>
          {children}
        </article>
      </div>
    </div>
  );
}

export default function RaffleTypes() {
  const scope = useScrollReveal();

  return (
    <section id="talonarios" ref={scope} className="bg-raffle-paperDim/60 py-24 dark:bg-raffle-ink/40 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="font-mono text-sm font-bold uppercase tracking-wider text-raffle-greenDark dark:text-raffle-greenLight">
            Tamaños de talonario
          </span>
          <h2 className="mt-3 font-display text-3xl font-semibold text-raffle-ink dark:text-raffle-paper sm:text-4xl">
            El mismo sistema, del premio chico al grande.
          </h2>
          <p className="mt-4 font-body text-raffle-ink/65 dark:text-raffle-paper/65">
            Pasa el cursor sobre cualquier talonario para verlo en detalle.
          </p>
        </div>

        <div className="reveal mt-14 grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TYPES.map((t) => (
            <TicketCard key={t.title}>
              <div className="flex flex-1 flex-col p-7">
                <DigitStamp digits={t.digits} />
                <h3 className="mt-5 font-display text-xl font-semibold text-raffle-ink dark:text-raffle-paper">Rifas de {t.title}</h3>
                <p className="mt-1 text-sm font-semibold text-raffle-greenDark dark:text-raffle-greenLight">{t.count}</p>
                <p className="mt-2.5 font-body text-[15px] leading-relaxed text-raffle-ink/65 dark:text-raffle-paper/65">{t.desc}</p>
              </div>
              <div className="ticket-notch mx-6" />
              <div className="flex items-center justify-between px-6 py-3.5 font-mono text-[11px] text-raffle-ink/45 dark:text-raffle-paper/45">
                <span>{t.range}</span>
                <span>{t.serial}</span>
              </div>
            </TicketCard>
          ))}

          <TicketCard>
            <div className="flex flex-1 flex-col p-7">
              <div className="flex h-[52px] w-fit items-center rounded-lg bg-raffle-ink px-3.5 font-mono text-sm font-bold text-raffle-greenLight">
                x–y
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-raffle-ink dark:text-raffle-paper">Modo rango</h3>
              <p className="mt-1 text-sm font-semibold text-raffle-greenDark dark:text-raffle-greenLight">A la medida</p>
              <p className="mt-2.5 font-body text-[15px] leading-relaxed text-raffle-ink/65 dark:text-raffle-paper/65">
                Elige cualquier inicio y final: no todo talonario tiene que empezar en cero.
              </p>
            </div>
            <div className="ticket-notch mx-6" />
            <div className="flex items-center justify-between px-6 py-3.5 font-mono text-[11px] text-raffle-ink/45 dark:text-raffle-paper/45">
              <span>500–1500</span>
              <span>N.º 04</span>
            </div>
          </TicketCard>
        </div>
      </div>
    </section>
  );
}
