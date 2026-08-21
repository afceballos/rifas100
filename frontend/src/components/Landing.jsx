import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ThemeToggle from './ThemeToggle';
import Countdown from './Countdown';
import { ShieldCheck, Ticket, Sparkles, ArrowRight, Calendar, Clock, Lock, Unlock, Trash2, X } from 'lucide-react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const pad = (n, d) => String(n).padStart(d, '0');

const statusStyles = {
  available: 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-500 dark:hover:border-blue-400 text-zinc-900 dark:text-zinc-100 cursor-pointer',
  reserved:  'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 opacity-70 cursor-not-allowed',
  paid:      'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-500 opacity-60 cursor-not-allowed',
};

export default function Landing() {
  const root = useRef();
  const blob1 = useRef();
  const blob2 = useRef();
  const blob3 = useRef();
  const heroRef = useRef();
  const gridRef = useRef();
  const descRef = useRef();

  const [raffle, setRaffle] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [purchaseStatus, setPurchaseStatus] = useState('');

  const load = () => {
    fetch('/api/get_tickets.php')
      .then(r => r.json())
      .then(d => {
        if (d.success) { setRaffle(d.raffle); setTickets(d.tickets || []); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Hero entrance + floating blobs
  useGSAP(() => {
    // blobs
    gsap.to(blob1.current, { x: 80, y: -50, duration: 14, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to(blob2.current, { x: -60, y: 70, duration: 18, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to(blob3.current, { x: 50, y: 60, duration: 16, repeat: -1, yoyo: true, ease: 'sine.inOut' });

    if (!loading && raffle) {
      const tl = gsap.timeline();
      tl.from('.hero-eyebrow', { y: 20, opacity: 0, duration: 0.5, ease: 'power3.out' })
        .from('.hero-title', { y: 40, opacity: 0, duration: 0.7, ease: 'power3.out' }, '-=0.2')
        .from('.hero-meta', { y: 20, opacity: 0, duration: 0.5, ease: 'power3.out' }, '-=0.4')
        .from('.hero-countdown', { scale: 0.85, opacity: 0, duration: 0.6, ease: 'back.out(1.3)' }, '-=0.3')
        .from('.hero-cta', { y: 20, opacity: 0, duration: 0.4, ease: 'power3.out' }, '-=0.3');
    }

    // Scroll-triggered description fade-in
    if (descRef.current) {
      gsap.from(descRef.current.querySelectorAll('.desc-item'), {
        scrollTrigger: { trigger: descRef.current, start: 'top 85%' },
        y: 30, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out',
      });
    }
  }, { dependencies: [loading, raffle], scope: root });

  // Ticket stagger whenever tickets change
  useGSAP(() => {
    if (tickets.length > 0) {
      gsap.fromTo('.ticket-item',
        { y: 30, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.4, stagger: 0.008, ease: 'back.out(1.2)' }
      );
    }
  }, { dependencies: [tickets], scope: root });

  const handleSelect = (ticket, el) => {
    if (ticket.status !== 'available') return;
    gsap.fromTo(el, { scale: 0.9 }, { scale: 1, duration: 0.18, yoyo: true, repeat: 1,
      onComplete: () => {
        setSelectedTicket(ticket);
        setPurchaseStatus('');
      }
    });
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (!raffle) return;
    setPurchaseStatus('Procesando reserva...');
    try {
      const res = await fetch('/api/reserve_ticket.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raffle_id: raffle.id,
          ticket_number: selectedTicket.number,
          buyer_name: formData.name,
          buyer_phone: formData.phone,
          buyer_email: formData.email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPurchaseStatus('¡Boleto bloqueado a tu nombre!');
        setTimeout(() => {
          setSelectedTicket(null);
          setFormData({ name: '', phone: '', email: '' });
          load();
        }, 1800);
      } else {
        setPurchaseStatus(data.message || 'Error al reservar.');
      }
    } catch {
      setPurchaseStatus('Error de conexión.');
    }
  };

  const drawDate = raffle?.draw_date ? new Date(raffle.draw_date) : null;
  const digits = raffle?.digits ?? 3;
  const gridCols = tickets.length > 500 ? 'grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15'
                    : tickets.length > 100 ? 'grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12'
                    : 'grid-cols-5 sm:grid-cols-8 md:grid-cols-10';

  return (
    <div ref={root} className="min-h-screen relative font-sans overflow-x-hidden">
      {/* Animated background blobs */}
      <div ref={blob1} className="blob bg-blue-500/40 dark:bg-blue-600/30" style={{ width: 420, height: 420, top: -120, left: -120 }} />
      <div ref={blob2} className="blob bg-violet-500/40 dark:bg-violet-600/30" style={{ width: 480, height: 480, top: 220, right: -160 }} />
      <div ref={blob3} className="blob bg-pink-400/30 dark:bg-pink-500/20" style={{ width: 360, height: 360, bottom: -100, left: '40%' }} />

      {/* Navbar */}
      <nav className="relative z-10 w-full p-4 flex justify-between items-center max-w-6xl mx-auto">
        <a href="/" className="flex items-center gap-2 font-extrabold text-xl tracking-tight">
          <ShieldCheck className="text-blue-500" />
          <span>Ticket<span className="text-gradient">Vault</span></span>
        </a>
        <div className="flex items-center gap-2 sm:gap-3">
          <a href="/admin" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            Soy admin
          </a>
          <ThemeToggle />
        </div>
      </nav>

      {/* HERO */}
      <section ref={heroRef} className="relative z-10 max-w-5xl mx-auto px-4 pt-12 pb-20 text-center">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-32 text-zinc-500 animate-pulse">
            <Ticket className="animate-spin text-blue-500" /> Cargando rifa...
          </div>
        ) : !raffle ? (
          <div className="py-32">
            <div className="inline-flex p-4 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 mb-6">
              <Sparkles size={28} />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">Pronto tendremos nuevas rifas</h1>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
              El equipo está preparando el próximo sorteo. Síguenos en redes para enterarte primero.
            </p>
          </div>
        ) : (
          <>
            <div className="hero-eyebrow inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md text-xs font-semibold tracking-wider uppercase text-zinc-600 dark:text-zinc-300">
              <Sparkles size={14} className="text-amber-500" /> Rifa activa
            </div>
            <h1 className="hero-title text-5xl sm:text-7xl font-extrabold tracking-tight mt-6 mb-6 text-gradient leading-[1.05]">
              {raffle.title}
            </h1>

            <div className="hero-meta flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-sm text-zinc-600 dark:text-zinc-300 mb-10">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 backdrop-blur-md">
                <Calendar size={16} className="text-blue-500" />
                {drawDate?.toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 backdrop-blur-md">
                <Clock size={16} className="text-violet-500" />
                {drawDate?.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 text-white font-bold">
                ${Number(raffle.price_per_ticket).toFixed(2)} / boleto
              </span>
            </div>

            <div className="hero-countdown flex justify-center mb-10">
              <Countdown target={raffle.draw_date} />
            </div>

            <a href="#boletos" className="hero-cta inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold hover:scale-105 active:scale-95 transition-transform shadow-2xl shadow-blue-500/20">
              Elegir mi número <ArrowRight size={18} />
            </a>
          </>
        )}
      </section>

      {/* DESCRIPTION */}
      {raffle && raffle.description && (
        <section ref={descRef} className="relative z-10 max-w-4xl mx-auto px-4 pb-16">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="desc-item p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-zinc-200 dark:border-zinc-800">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-2">Sobre el sorteo</div>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm">
                {raffle.description}
              </p>
            </div>
            <div className="desc-item p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-zinc-200 dark:border-zinc-800">
              <div className="text-xs font-bold uppercase tracking-wider text-violet-500 mb-2">¿Cómo participo?</div>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm">
                Elige un número disponible, llena tus datos y lo bloqueamos a tu nombre. Tras confirmar el pago, tu boleto queda listo para el sorteo.
              </p>
            </div>
            <div className="desc-item p-6 rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-zinc-200 dark:border-zinc-800">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-2">Transparencia</div>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm">
                Cada transacción queda registrada. El sorteo se realiza en vivo y los ganadores se publican al instante.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* GRID */}
      <section id="boletos" ref={gridRef} className="relative z-10 max-w-6xl mx-auto px-4 pb-24">
        {raffle && tickets.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Elige tu número de la suerte</h2>
              <div className="hidden sm:flex items-center gap-3 text-xs font-medium text-zinc-500">
                <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-white border border-zinc-300 dark:bg-zinc-900 dark:border-zinc-700" /> Disponible</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-zinc-300 dark:bg-zinc-700" /> Reservado</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-300 dark:bg-emerald-900" /> Pagado</span>
              </div>
            </div>
            <div className={`grid ${gridCols} gap-2 sm:gap-3`}>
              {tickets.map(t => (
                <button
                  key={t.number}
                  onClick={(e) => handleSelect(t, e.currentTarget)}
                  disabled={t.status !== 'available'}
                  className={`ticket-item h-12 sm:h-14 flex items-center justify-center rounded-xl font-mono text-sm sm:text-lg font-bold transition-all duration-300 ${statusStyles[t.status]}`}
                >
                  {pad(t.number, digits)}
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-200 dark:border-zinc-800 py-8 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} TicketVault. Todos los derechos reservados.
      </footer>

      {/* Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}></div>
          <div className="relative bg-white dark:bg-zinc-900 p-8 rounded-3xl max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <button onClick={() => setSelectedTicket(null)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <X size={18} />
            </button>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Reservar Acceso</h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Boleto seleccionado: <span className="font-mono text-blue-500 font-bold">#{pad(selectedTicket.number, digits)}</span></p>
              </div>
            </div>
            {purchaseStatus && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 rounded-2xl border border-blue-100 dark:border-blue-900/50 text-center text-sm font-medium">
                {purchaseStatus}
              </div>
            )}
            <form onSubmit={handlePurchase} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300">Nombre Completo <span className="text-blue-500">*</span></label>
                <input required type="text" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Juan Pérez" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300">Teléfono Celular <span className="text-blue-500">*</span></label>
                <input required type="tel" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+00 0000000" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300">Correo Electrónico (Opcional)</label>
                <input type="email" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="tu@correo.com" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" className="flex-1 px-4 py-3 rounded-xl text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  onClick={() => setSelectedTicket(null)}>Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95">
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
