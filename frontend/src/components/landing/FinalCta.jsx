import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import useScrollReveal from './useScrollReveal';
import confettiBurst from './confettiBurst';

export default function FinalCta() {
  const scope = useScrollReveal();

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    confettiBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  return (
    <section ref={scope} className="mx-auto max-w-6xl px-6 pb-24">
      <div className="reveal relative overflow-hidden rounded-[28px] bg-velvet px-8 py-14 text-center shadow-plum sm:px-16 sm:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-raffle-gold/20 blur-[100px]"
        />
        <h2 className="relative font-display text-3xl font-semibold text-raffle-paper sm:text-4xl">
          Tu próxima rifa puede estar en línea hoy.
        </h2>
        <p className="relative mx-auto mt-4 max-w-md text-raffle-paper/70">
          Crea una cuenta, arma tu talonario y comparte tu enlace. Sin tarjeta de crédito para empezar.
        </p>
        <Link
          to="/registro"
          onClick={handleClick}
          className="relative mt-8 inline-flex items-center gap-2 rounded-2xl bg-gold-foil px-8 py-3.5 text-base font-bold text-raffle-ink shadow-gold transition-transform duration-200 hover:scale-[1.04] active:scale-[0.98]"
        >
          Crear mi rifa gratis
          <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}
