import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import ThemeToggle from './ThemeToggle';
import { ShieldCheck, Ticket, Home, Search, EyeOff } from 'lucide-react';

gsap.registerPlugin(useGSAP);

/**
 * NotFound — pantalla 404 con temática de rifas.
 *
 * Props:
 *   variant: 'not_found'  → rifa inexistente o URL inválida (default)
 *           'unpublished' → la rifa existe pero fue despublicada por el admin
 */
export default function NotFound({ variant = 'not_found' }) {
  const containerRef = useRef();

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Boleto cae y rota ligeramente
    tl.fromTo('.nf-ticket',
      { y: -200, rotation: -25, opacity: 0 },
      { y: 0, rotation: -6, opacity: 1, duration: 0.9, ease: 'bounce.out' }
    )
      // "404" hace escala dramática
      .fromTo('.nf-number span',
        { y: 80, opacity: 0, scale: 0.5 },
        { y: 0, opacity: 1, scale: 1, duration: 0.7, stagger: 0.08, ease: 'back.out(2)' },
        '-=0.4'
      )
      // Badge "No premiado"
      .fromTo('.nf-stamp',
        { scale: 2.5, opacity: 0, rotation: 20 },
        { scale: 1, opacity: 1, rotation: -12, duration: 0.5, ease: 'back.out(1.7)' },
        '-=0.3'
      )
      // Texto y botón
      .fromTo('.nf-text',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 },
        '-=0.2'
      );
  }, { scope: containerRef });

  const isUnpublished = variant === 'unpublished';
  const heading = isUnpublished ? 'Esta rifa no está disponible' : 'Boleto no encontrado';
  const message = isUnpublished
    ? 'El sorteo fue despublicado por el administrador o ya no está activo. Vuelve al inicio para ver los sorteos vigentes.'
    : 'No pudimos encontrar esta rifa. Puede que el enlace esté mal escrito o que la bóveda haya sido retirada.';
  const Icon = isUnpublished ? EyeOff : Search;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-zinc-50 dark:bg-zinc-950" ref={containerRef}>
      {/* Navbar */}
      <nav className="w-full p-4 flex justify-between items-center max-w-6xl mx-auto">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <ShieldCheck className="text-blue-500" />
          <span>Ticket<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-violet-500">Vault</span></span>
        </Link>
        <ThemeToggle />
      </nav>

      {/* Contenido */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">

        {/* Boleto decorativo + número 404 */}
        <div className="relative mb-10">
          {/* Boleto */}
          <div className="nf-ticket relative bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl shadow-2xl px-8 py-6 w-64 sm:w-80 mx-auto">
            {/* Perforaciones laterales (estilo boleto) */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-zinc-50 dark:bg-zinc-950 rounded-full"></div>
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-zinc-50 dark:bg-zinc-950 rounded-full"></div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Ticket size={18} className="text-blue-500" />
                <span className="text-xs font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">Ticket Vault</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">N° 000</span>
            </div>

            <div className="nf-number font-mono font-extrabold text-7xl sm:text-8xl tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-br from-blue-500 via-violet-500 to-fuchsia-500">
              <span>4</span><span>0</span><span>4</span>
            </div>

            <div className="mt-4 pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span>SORTEO</span>
              <span className="text-zinc-300 dark:text-zinc-600">·—·—·—·</span>
              <span>SIN PREMIO</span>
            </div>
          </div>

          {/* Sello "NO PREMIADO" */}
          <div className="nf-stamp absolute -top-4 -right-4 sm:-right-8 px-4 py-2 border-4 border-red-500 text-red-500 font-black text-sm sm:text-base tracking-widest rounded-lg rotate-[-12deg] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm shadow-lg">
            NO PREMIADO
          </div>
        </div>

        {/* Texto */}
        <h1 className="nf-text text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-zinc-900 dark:text-white">
          {heading}
        </h1>
        <p className="nf-text text-zinc-500 dark:text-zinc-400 max-w-md mb-8 leading-relaxed">
          {message}
        </p>

        {/* CTA */}
        <div className="nf-text flex flex-col sm:flex-row items-center gap-3">
          <Link
            to="/"
            className="group flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95"
          >
            <Home size={18} />
            Volver al inicio
          </Link>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 px-3">
            <Icon size={14} />
            {isUnpublished ? 'Rifa despublicada' : 'Enlace inválido'}
          </span>
        </div>
      </div>
    </div>
  );
}
