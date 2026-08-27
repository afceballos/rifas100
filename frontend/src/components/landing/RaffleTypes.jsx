import React, { useEffect, useRef, useState } from 'react';
import SlotDigit from './SlotDigit';
import TicketMark from './TicketMark';
import useScrollReveal from './useScrollReveal';

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
          className="text-2xl font-mono font-bold text-raffle-blueLight"
        />
      ))}
    </div>
  );
}

function TicketCard({ children, isStamped, forwardedRef }) {
  return (
    <article
      ref={forwardedRef}
      className="relative w-72 shrink-0 snap-start rounded-[20px] border-[1.6px] border-raffle-ink bg-white dark:border-raffle-paper dark:bg-zinc-900"
    >
      <span
        aria-hidden="true"
        className={`absolute right-4 top-4 flex h-8 w-8 items-center justify-center text-raffle-blue transition-all duration-300 ${
          isStamped ? 'rotate-[8deg] scale-100 opacity-90' : 'rotate-[18deg] scale-50 opacity-0'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(.34,1.56,.64,1)' }}
      >
        <TicketMark className="h-full w-full" />
      </span>
      {children}
    </article>
  );
}

export default function RaffleTypes() {
  const scope = useScrollReveal();
  const scrollRef = useRef(null);
  const [stamped, setStamped] = useState(() => new Set());
  const cardRefs = useRef([]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.dataset.idx);
            setStamped((prev) => (prev.has(idx) ? prev : new Set(prev).add(idx)));
            io.unobserve(entry.target);
          }
        });
      },
      { root, threshold: 0.6 }
    );
    cardRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section ref={scope} className="bg-raffle-paperDim/60 py-24 dark:bg-raffle-ink/40 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="font-mono text-sm font-bold uppercase tracking-wider text-raffle-blueDark dark:text-raffle-blueLight">
            Tamaños de talonario
          </span>
          <h2 className="mt-3 font-display text-3xl font-semibold text-raffle-ink dark:text-raffle-paper sm:text-4xl">
            Elige tu talonario y hojéalo como una baraja.
          </h2>
          <p className="mt-4 font-body text-raffle-ink/65 dark:text-raffle-paper/65">
            Desliza para ver los tamaños disponibles — cada ticket se sella al pasar por el centro.
          </p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="reveal mt-14 flex snap-x snap-proximity gap-6 overflow-x-auto px-6 pb-4 sm:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]"
      >
        {TYPES.map((t, i) => (
          <TicketCard key={t.title} isStamped={stamped.has(i)} forwardedRef={(el) => { cardRefs.current[i] = el; if (el) el.dataset.idx = i; }}>
            <div className="p-7">
              <DigitStamp digits={t.digits} />
              <h3 className="mt-5 font-display text-xl font-semibold text-raffle-ink dark:text-raffle-paper">Rifas de {t.title}</h3>
              <p className="mt-1 text-sm font-semibold text-raffle-blueDark dark:text-raffle-blueLight">{t.count}</p>
              <p className="mt-2.5 font-body text-[15px] leading-relaxed text-raffle-ink/65 dark:text-raffle-paper/65">{t.desc}</p>
            </div>
            <div className="ticket-notch mx-6" />
            <div className="flex items-center justify-between px-6 py-3.5 font-mono text-[11px] text-raffle-ink/45 dark:text-raffle-paper/45">
              <span>{t.range}</span>
              <span>{t.serial}</span>
            </div>
          </TicketCard>
        ))}

        <TicketCard isStamped={stamped.has(3)} forwardedRef={(el) => { cardRefs.current[3] = el; if (el) el.dataset.idx = 3; }}>
          <div className="p-7">
            <div className="flex h-[52px] w-fit items-center rounded-lg bg-raffle-ink px-3.5 font-mono text-sm font-bold text-raffle-blueLight">
              x–y
            </div>
            <h3 className="mt-5 font-display text-xl font-semibold text-raffle-ink dark:text-raffle-paper">Modo rango</h3>
            <p className="mt-1 text-sm font-semibold text-raffle-blueDark dark:text-raffle-blueLight">A la medida</p>
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

      <p className="mx-auto mt-2 max-w-6xl px-6 font-mono text-xs text-raffle-ink/40 dark:text-raffle-paper/40">
        ← desliza el talonario →
      </p>
    </section>
  );
}
