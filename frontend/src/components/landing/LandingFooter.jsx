import React from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import TicketWordmark from './TicketWordmark';

export default function LandingFooter() {
  return (
    <footer className="border-t border-raffle-ink/10 bg-raffle-paperDim/60 dark:border-raffle-paper/10 dark:bg-raffle-ink/60">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-14 sm:grid-cols-3">
        <div>
          <TicketWordmark className="h-6 w-auto text-raffle-ink dark:text-raffle-paper" />
          <p className="mt-3 max-w-xs font-body text-sm text-raffle-ink/60 dark:text-raffle-paper/60">
            Rifas por números, sin caos de WhatsApp: talonarios, boletos con QR y control de pagos en un solo lugar.
          </p>
        </div>

        <nav aria-label="Enlaces del sitio">
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-raffle-ink/40 dark:text-raffle-paper/40">
            Plataforma
          </h2>
          <ul className="mt-4 space-y-2.5 font-body text-sm text-raffle-ink/70 dark:text-raffle-paper/70">
            <li><a href="#como-funciona" className="hover:text-raffle-blue">Cómo funciona</a></li>
            <li><a href="#confianza" className="hover:text-raffle-blue">Confianza y seguridad</a></li>
            <li><Link to="/registro" className="hover:text-raffle-blue">Crear cuenta</Link></li>
            <li><Link to="/admin" className="hover:text-raffle-blue">Acceso operativo</Link></li>
          </ul>
        </nav>

        <div>
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-raffle-ink/40 dark:text-raffle-paper/40">
            Contacto
          </h2>
          <ul className="mt-4 space-y-2.5 font-body text-sm text-raffle-ink/70 dark:text-raffle-paper/70">
            <li>
              <a href="mailto:hola@ticketvault.app" className="flex items-center gap-2 hover:text-raffle-blue">
                <Mail size={16} /> hola@ticketvault.app
              </a>
            </li>
          </ul>
          <div className="mt-5 flex gap-2">
            <a
              href="#"
              className="rounded-full bg-raffle-ink/5 px-3.5 py-1.5 text-xs font-semibold text-raffle-ink/60 transition-colors hover:bg-raffle-tint hover:text-raffle-blueDark dark:bg-raffle-paper/10 dark:text-raffle-paper/60 dark:hover:text-raffle-blueLight"
            >
              Instagram
            </a>
            <a
              href="#"
              className="rounded-full bg-raffle-ink/5 px-3.5 py-1.5 text-xs font-semibold text-raffle-ink/60 transition-colors hover:bg-raffle-tint hover:text-raffle-blueDark dark:bg-raffle-paper/10 dark:text-raffle-paper/60 dark:hover:text-raffle-blueLight"
            >
              Facebook
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-raffle-ink/10 px-6 py-6 text-center font-mono text-xs text-raffle-ink/45 dark:border-raffle-paper/10 dark:text-raffle-paper/40">
        © {new Date().getFullYear()} Ticket100. Todos los derechos reservados.
      </div>
    </footer>
  );
}
