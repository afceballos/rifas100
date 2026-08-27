import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import AccountMenuSection from './AccountMenuSection';
import HeroOrbital from './landing/HeroOrbital';
import HowItWorks from './landing/HowItWorks';
import RaffleTypes from './landing/RaffleTypes';
import TrustSection from './landing/TrustSection';
import FinalCta from './landing/FinalCta';
import LandingFooter from './landing/LandingFooter';
import TicketMark from './landing/TicketMark';
import { Menu } from 'lucide-react';

const NAV_LINKS = [
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#confianza', label: 'Confianza' },
  { href: '#talonarios', label: 'Talonarios' },
];

export default function Landing() {
  const [showMenu, setShowMenu] = useState(false);
  const [me, setMe] = useState(null);

  useEffect(() => {
    fetch('/api/me.php', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setMe(data.success ? data : null))
      .catch(() => setMe(null));
  }, []);

  return (
    <div className="min-h-screen bg-raffle-paper font-body text-raffle-ink dark:bg-raffle-ink dark:text-raffle-paper">
      <header className="sticky top-0 z-30 border-b border-[#ECEDE7]/10 bg-[#0B100D]/90 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4" aria-label="Principal">
          <Link to="/" className="flex items-center gap-2 font-mono text-sm tracking-wide text-[#ECEDE7]">
            <TicketMark className="h-5 w-auto text-raffle-green" />
            TICKET<span className="text-raffle-green">100</span>
          </Link>

          <ul className="hidden items-center gap-8 font-mono text-xs uppercase tracking-wider text-[#ECEDE7]/55 sm:flex">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="rounded-sm transition-colors hover:text-[#ECEDE7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-raffle-green focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B100D]"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <ThemeToggle variant="dark" />

            {me && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(prev => !prev)}
                  className="p-2 rounded-full bg-[#ECEDE7]/10 text-[#ECEDE7]/80 hover:bg-[#ECEDE7]/15 transition-colors"
                  title="Más opciones"
                >
                  <Menu size={20} />
                </button>

                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden py-1.5">
                      <AccountMenuSection me={me} onClose={() => setShowMenu(false)} onLoggedOut={() => setMe(null)} />
                    </div>
                  </>
                )}
              </div>
            )}

            <Link
              to="/admin"
              className="hidden sm:inline-flex px-5 py-2 rounded-full text-sm font-semibold bg-[#ECEDE7]/10 text-[#ECEDE7] hover:bg-[#ECEDE7]/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-raffle-green focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B100D]"
            >
              Acceso operativo
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <HeroOrbital />
        <HowItWorks />
        <RaffleTypes />
        <TrustSection />
        <FinalCta />
      </main>

      <LandingFooter />
    </div>
  );
}
