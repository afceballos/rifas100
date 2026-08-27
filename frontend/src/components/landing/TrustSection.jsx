import React from 'react';
import { ShieldCheck, Lock, QrCode, Eye, Wallet } from 'lucide-react';
import useScrollReveal from './useScrollReveal';
import useTilt from './useTilt';

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Aislamiento multi-tenant',
    desc: 'Tu cuenta es tu propio espacio de trabajo: nadie más ve ni toca tus rifas, tus compradores o tus pagos.',
  },
  {
    icon: Lock,
    title: 'Anticolisión en cada reserva',
    desc: 'Bloqueos a nivel de base de datos evitan que dos personas reserven el mismo número al mismo tiempo.',
  },
  {
    icon: QrCode,
    title: 'Boleto digital verificable',
    desc: 'Cada número reservado genera su propio boleto con código QR, listo para compartir o descargar en PDF.',
  },
  {
    icon: Eye,
    title: 'Participación verificable',
    desc: 'Cualquier comprador confirma en segundos que su número quedó registrado, sin necesidad de iniciar sesión.',
  },
];

function TrustCard({ icon: Icon, title, desc }) {
  const tiltRef = useTilt(5);
  return (
    <div style={{ perspective: '800px' }}>
      <article
        ref={tiltRef}
        className="reveal flex gap-4 rounded-2xl border border-raffle-ink/10 bg-white p-6 transition-transform duration-200 [transition-timing-function:cubic-bezier(.23,1,.32,1)] dark:border-raffle-paper/10 dark:bg-zinc-900"
        style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-raffle-green text-raffle-ink">
          <Icon size={20} />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-raffle-ink dark:text-raffle-paper">{title}</h3>
          <p className="mt-1.5 font-body text-[15px] leading-relaxed text-raffle-ink/65 dark:text-raffle-paper/65">{desc}</p>
        </div>
      </article>
    </div>
  );
}

export default function TrustSection() {
  const scope = useScrollReveal();

  return (
    <section id="confianza" ref={scope} className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
      <div className="reveal mx-auto max-w-2xl text-center">
        <span className="font-mono text-sm font-bold uppercase tracking-wider text-raffle-greenDark dark:text-raffle-greenLight">
          Confianza
        </span>
        <h2 className="mt-3 font-display text-3xl font-semibold text-raffle-ink dark:text-raffle-paper sm:text-4xl">
          Diseñado para que nadie dude de tu sorteo.
        </h2>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <TrustCard key={f.title} {...f} />
        ))}
      </div>

      <div className="reveal mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-raffle-green/40 bg-raffle-tint/60 p-6 text-center dark:bg-raffle-green/5 sm:flex-row sm:text-left">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-raffle-ink text-raffle-green dark:bg-raffle-paper dark:text-raffle-greenDark">
          <Wallet size={20} />
        </div>
        <p className="font-body text-[15px] text-raffle-ink/70 dark:text-raffle-paper/70">
          <span className="font-semibold text-raffle-ink dark:text-raffle-paper">Cobra como ya cobras: </span>
          transferencia, efectivo, Zelle o cualquier otro método — cada uno con sus propios datos de cobro,
          visibles para tus compradores desde el boleto.
        </p>
      </div>
    </section>
  );
}
