import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowRight, ShieldCheck, QrCode, Layers } from 'lucide-react';
import IconField from './IconField';
import TicketStubPanel from './TicketStubPanel';
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
    <section ref={sectionRef} className="relative overflow-hidden">
      <IconField />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-6 pb-20 pt-28 sm:pt-32 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-28">
        <div className="text-center lg:text-left">
          <span className="hero-stagger inline-flex items-center gap-2 rounded-full bg-raffle-tint px-4 py-1.5 text-sm font-bold text-raffle-blueDark dark:bg-raffle-blue/15 dark:text-raffle-blueLight">
            Boletos de verdad, no capturas
          </span>

          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-raffle-ink dark:text-raffle-paper sm:text-6xl">
            Tu rifa, vendida con{' '}
            <span className="text-raffle-blue">boletos</span>{' '}
            que se sienten como boletos.
          </h1>

          <p className="hero-stagger mx-auto mt-6 max-w-xl font-body text-lg text-raffle-ink/65 dark:text-raffle-paper/65 lg:mx-0">
            Cada número reservado se convierte en un boleto real: serial, QR y todo, listo para compartir con tu
            comprador. Crea tu talonario en minutos y deja que Ticket100 controle reservas y pagos por ti.
          </p>

          <div className="hero-stagger mt-9 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              to="/registro"
              onClick={handleCtaClick}
              className="group inline-flex items-center gap-2 rounded-2xl bg-raffle-blue px-7 py-3.5 text-base font-bold text-white shadow-blue transition-transform duration-200 hover:scale-[1.04] active:scale-[0.98]"
            >
              Crear mi rifa gratis
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center gap-2 rounded-2xl border border-raffle-ink/15 px-7 py-3.5 text-base font-semibold text-raffle-ink/90 transition-colors hover:border-raffle-blue/50 hover:text-raffle-blue dark:border-raffle-paper/20 dark:text-raffle-paper/90"
            >
              Ver cómo funciona
            </a>
          </div>

          <ul className="hero-stagger mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
            {BADGES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center justify-center gap-2 text-sm text-raffle-ink/55 dark:text-raffle-paper/55 sm:justify-start">
                <Icon size={16} className="shrink-0 text-raffle-blue" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="hero-stagger mx-auto w-full max-w-sm lg:mx-0">
          <TicketStubPanel />
        </div>
      </div>
    </section>
  );
}
