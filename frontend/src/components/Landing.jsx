import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import AccountMenuSection from './AccountMenuSection';
import Hero from './landing/Hero';
import HowItWorks from './landing/HowItWorks';
import RaffleTypes from './landing/RaffleTypes';
import TrustSection from './landing/TrustSection';
import FinalCta from './landing/FinalCta';
import LandingFooter from './landing/LandingFooter';
import { Ticket, Menu } from 'lucide-react';

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
    <div className="min-h-screen bg-raffle-paper font-sans text-raffle-ink dark:bg-raffle-ink dark:text-raffle-paper">
      <header className="sticky top-0 z-30 border-b border-raffle-ink/5 bg-raffle-paper/80 backdrop-blur-md dark:border-raffle-paper/5 dark:bg-raffle-ink/80">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4" aria-label="Principal">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
            <Ticket className="text-raffle-goldDark dark:text-raffle-gold" size={26} />
            Ticket<span className="bg-gold-foil bg-clip-text text-transparent">Vault</span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {me && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(prev => !prev)}
                  className="p-2 rounded-full bg-raffle-ink/5 text-raffle-ink/70 hover:bg-raffle-ink/10 dark:bg-raffle-paper/10 dark:text-raffle-paper/70 dark:hover:bg-raffle-paper/20 transition-colors"
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
              className="hidden sm:inline-flex px-5 py-2 rounded-full text-sm font-semibold bg-raffle-ink/5 hover:bg-raffle-ink/10 dark:bg-raffle-paper/10 dark:hover:bg-raffle-paper/20 transition-colors"
            >
              Acceso operativo
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <Hero />
        <HowItWorks />
        <RaffleTypes />
        <TrustSection />
        <FinalCta />
      </main>

      <LandingFooter />
    </div>
  );
}
