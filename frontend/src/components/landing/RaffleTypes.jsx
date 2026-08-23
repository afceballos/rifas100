import React, { useState } from 'react';
import SlotDigit from './SlotDigit';
import useScrollReveal from './useScrollReveal';

const TYPES = [
  {
    digits: [0, 0],
    title: 'Rifas de 2 cifras',
    count: '100 números',
    desc: 'Ideales para premios pequeños y rifas exprés: meriendas, accesorios, rifas de fin de semana.',
  },
  {
    digits: [0, 0, 0],
    title: 'Rifas de 3 cifras',
    count: '1,000 números',
    desc: 'La más usada: celulares, electrodomésticos, viajes cortos — el punto justo entre alcance y velocidad de venta.',
  },
  {
    digits: [0, 0, 0, 0],
    title: 'Rifas de 4 cifras',
    count: '10,000 números',
    desc: 'Para el premio grande: motos, autos, remodelaciones — el talonario más largo que genera el sistema.',
  },
];

function TypeCard({ digits, title, count, desc }) {
  const [shuffle, setShuffle] = useState(0);

  return (
    <article
      onMouseEnter={() => setShuffle((s) => s + 1)}
      className="reveal group rounded-2xl border border-raffle-ink/10 bg-raffle-paper p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-gold dark:border-raffle-paper/10 dark:bg-raffle-plum/40"
    >
      <div className="flex gap-1 rounded-xl bg-raffle-ink px-3 py-2.5 w-fit shadow-plum ring-1 ring-raffle-gold/20">
        {digits.map((d, i) => (
          <SlotDigit
            key={i}
            value={d}
            spinOnMount
            shuffleTrigger={shuffle}
            className="text-2xl font-mono font-bold text-raffle-goldLight"
          />
        ))}
      </div>
      <h3 className="mt-5 font-display text-xl font-semibold text-raffle-ink dark:text-raffle-paper">{title}</h3>
      <p className="mt-1 text-sm font-semibold text-raffle-goldDark dark:text-raffle-gold">{count}</p>
      <p className="mt-2.5 text-[15px] leading-relaxed text-raffle-ink/65 dark:text-raffle-paper/65">{desc}</p>
    </article>
  );
}

export default function RaffleTypes() {
  const scope = useScrollReveal();

  return (
    <section ref={scope} className="bg-raffle-paperDim/60 py-24 dark:bg-raffle-ink/40 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-raffle-goldDark dark:text-raffle-gold">
            Tamaños de talonario
          </span>
          <h2 className="mt-3 font-display text-3xl font-semibold text-raffle-ink dark:text-raffle-paper sm:text-4xl">
            El mismo sistema, del premio chico al grande.
          </h2>
          <p className="mt-4 text-raffle-ink/65 dark:text-raffle-paper/65">
            Pasa el cursor sobre cualquier cifra para verla girar.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TYPES.map((t) => (
            <TypeCard key={t.title} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}
