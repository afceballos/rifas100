import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowRight, ShieldCheck, QrCode, Layers } from 'lucide-react';
import TicketPreview from './TicketPreview';
import TicketParticles from './TicketParticles';
import confettiBurst from './confettiBurst';

gsap.registerPlugin(useGSAP);

const BADGES = [
  { icon: ShieldCheck, label: 'Multi-tenant, cada cuenta aislada' },
  { icon: Layers, label: 'Talonarios de hasta 10,000 números' },
  { icon: QrCode, label: 'Boleto digital con QR verificable' },
];

export default function Hero() {
  const sectionRef = useRef(null);

  useGSAP(() => {
    // El <h1> se mantiene visible desde el primer paint (es el candidato a
    // LCP); solo lo secundario entra escalonado, con una demora mínima.
    gsap.from('.hero-stagger', {
      opacity: 0,
      y: 18,
      duration: 0.6,
      delay: 0.05,
      stagger: 0.09,
      ease: 'power3.out',
    });
  }, { scope: sectionRef });

  const handleCtaClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    confettiBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-velvet">
      <TicketParticles className="absolute inset-0 h-full w-full opacity-70" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-[-10%] h-[420px] w-[420px] rounded-full bg-raffle-gold/20 blur-[110px]"
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-6 pb-20 pt-28 sm:pt-32 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-28">
        <div className="text-center lg:text-left">
          <span className="hero-stagger inline-flex items-center gap-2 rounded-full border border-raffle-gold/30 bg-raffle-gold/10 px-4 py-1.5 text-sm font-bold text-raffle-goldLight">
            Para organizadores de rifas
          </span>

          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-raffle-paper sm:text-6xl">
            Tu rifa,{' '}
            <span className="bg-gold-foil bg-clip-text text-transparent">
              vendida con boletos
            </span>{' '}
            en vez de capturas de WhatsApp.
          </h1>

          <p className="hero-stagger mx-auto mt-6 max-w-xl text-lg text-raffle-paper/70 lg:mx-0">
            Crea tu talonario en minutos, comparte un solo enlace y deja que TicketVault controle reservas,
            pagos y boletos con QR por ti — sin hojas de cálculo ni números repetidos.
          </p>

          <div className="hero-stagger mt-9 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              to="/registro"
              onClick={handleCtaClick}
              className="group inline-flex items-center gap-2 rounded-2xl bg-gold-foil px-7 py-3.5 text-base font-bold text-raffle-ink shadow-gold transition-transform duration-200 hover:scale-[1.04] active:scale-[0.98]"
            >
              Crear mi rifa gratis
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center gap-2 rounded-2xl border border-raffle-paper/20 px-7 py-3.5 text-base font-semibold text-raffle-paper/90 transition-colors hover:border-raffle-gold/50 hover:text-raffle-goldLight"
            >
              Ver cómo funciona
            </a>
          </div>

          <ul className="hero-stagger mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
            {BADGES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center justify-center gap-2 text-sm text-raffle-paper/60 sm:justify-start">
                <Icon size={16} className="shrink-0 text-raffle-gold" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="hero-stagger mx-auto w-full max-w-sm lg:mx-0">
          <TicketPreview />
        </div>
      </div>
    </section>
  );
}
