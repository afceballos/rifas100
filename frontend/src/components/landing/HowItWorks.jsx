import React from 'react';
import { SlidersHorizontal, Share2, Trophy } from 'lucide-react';
import useScrollReveal from './useScrollReveal';

const STEPS = [
  {
    icon: SlidersHorizontal,
    serial: 'N.º 01',
    title: 'Configura tu talonario',
    desc: 'Elige 2, 3 o 4 cifras (100 a 10,000 números) o un rango a la medida, pon precio, sube la imagen del premio y agrega tus métodos de pago.',
  },
  {
    icon: Share2,
    serial: 'N.º 02',
    title: 'Comparte tu enlace único',
    desc: 'Cada rifa vive en su propia URL pública. Pégala en tus redes o WhatsApp y tus compradores eligen número ahí mismo.',
  },
  {
    icon: Trophy,
    serial: 'N.º 03',
    title: 'Cobra y sortea con respaldo',
    desc: 'Revisa comprobantes, marca pagos y entrega a cada comprador un boleto digital con QR verificable el día del sorteo.',
  },
];

export default function HowItWorks() {
  const scope = useScrollReveal();

  return (
    <section id="como-funciona" ref={scope} className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
      <div className="reveal mx-auto max-w-2xl text-center">
        <span className="font-mono text-sm font-bold uppercase tracking-wider text-raffle-blueDark dark:text-raffle-blueLight">
          Cómo funciona
        </span>
        <h2 className="mt-3 font-display text-3xl font-semibold text-raffle-ink dark:text-raffle-paper sm:text-4xl">
          De cero a talonario vendido, en tres pasos.
        </h2>
      </div>

      <ol className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-0">
        {STEPS.map(({ icon: Icon, serial, title, desc }, i) => (
          <li
            key={serial}
            className={`reveal px-0 sm:px-8 ${i > 0 ? 'sm:border-l sm:border-raffle-ink/10 sm:dark:border-raffle-paper/10' : ''} ${i === 0 ? 'sm:pl-0' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold tracking-widest text-raffle-ink/40 dark:text-raffle-paper/40">
                {serial}
              </span>
              <Icon size={22} className="text-raffle-blue" />
            </div>
            <h3 className="mt-5 font-display text-xl font-semibold text-raffle-ink dark:text-raffle-paper">
              {title}
            </h3>
            <p className="mt-2.5 font-body text-[15px] leading-relaxed text-raffle-ink/65 dark:text-raffle-paper/65">
              {desc}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
