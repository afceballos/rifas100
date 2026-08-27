import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import TicketMark from './TicketMark';
import useScrollReveal from './useScrollReveal';
import confettiBurst from './confettiBurst';

export default function FinalCta() {
  const scope = useScrollReveal();
  const wrapRef = useRef(null);
  const [markVisible, setMarkVisible] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMarkVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    confettiBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  return (
    <section ref={scope} className="relative mx-auto max-w-6xl px-6 pb-24">
      <div ref={wrapRef} className="reveal relative mx-auto flex max-w-3xl overflow-hidden rounded-[24px] border-[1.6px] border-raffle-ink bg-raffle-ink dark:border-raffle-paper">
        <TicketMark
          aria-hidden="true"
          className={`pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 text-raffle-paper transition-all duration-700 ${
            markVisible ? 'scale-100 opacity-[0.06]' : 'scale-90 opacity-0'
          }`}
        />

        <div className="relative flex-1 px-8 py-14 text-center sm:px-14 sm:py-16 sm:text-left">
          <h2 className="font-display text-3xl font-semibold text-raffle-paper sm:text-4xl">
            Empieza tu talonario hoy.
          </h2>
          <p className="mt-4 max-w-md font-body text-raffle-paper/65">
            Sin hojas de cálculo ni números repetidos. Crea una cuenta y arma tu talonario en minutos.
          </p>
          <Link
            to="/registro"
            onClick={handleClick}
            className="relative mt-8 inline-flex items-center gap-2 rounded-2xl bg-raffle-blue px-8 py-3.5 text-base font-bold text-white shadow-blue transition-transform duration-200 hover:scale-[1.04] active:scale-[0.98]"
          >
            Crear mi rifa gratis
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="ticket-notch-v relative hidden w-32 shrink-0 items-center justify-center sm:flex">
          <span
            className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-raffle-blueLight"
            style={{ writingMode: 'vertical-rl' }}
          >
            Ticket100
          </span>
        </div>
      </div>
    </section>
  );
}
