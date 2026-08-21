import React, { useRef, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Draggable } from 'gsap/Draggable';
import ThemeToggle from './ThemeToggle';
import NotFound from './NotFound';
import { ShieldCheck, Ticket, ChevronLeft, ChevronRight } from 'lucide-react';

gsap.registerPlugin(useGSAP, Draggable);

const TimeBlock = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center relative overflow-hidden group">
      <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <span className="text-2xl sm:text-3xl font-mono font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-violet-500 drop-shadow-sm">
        {value.toString().padStart(2, '0')}
      </span>
    </div>
    <span className="text-[10px] sm:text-xs font-bold text-zinc-400 dark:text-zinc-500 mt-3 uppercase tracking-widest">{label}</span>
  </div>
);

export default function TicketGrid() {
  const { id } = useParams();
  const containerRef = useRef();
  const trackRef = useRef(null);
  const handleRef = useRef(null);
  const [tickets, setTickets] = useState([]);
  const [raffle, setRaffle] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFoundVariant, setNotFoundVariant] = useState(null);

  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [purchaseStatus, setPurchaseStatus] = useState('');

  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [isEnded, setIsEnded] = useState(false);

  // Ventana de visualización: cuando hay más de WINDOW_SIZE boletos
  // se muestra una página de 100 a la vez, navegable por slider.
  const WINDOW_SIZE = 100;
  const [rangeStart, setRangeStart] = useState(0);

  // Resetear el rango cuando cambia la rifa
  useEffect(() => { setRangeStart(0); }, [id]);

  const loadTickets = () => {
    fetch(`/api/get_tickets.php?id=${id}`)
      .then(res => res.json())
      .then(data => {
        if(data.success) {
          setTickets(data.tickets);
          setRaffle(data.raffle);
          setNotFoundVariant(null);
        } else {
          setRaffle(null);
          setNotFoundVariant(data.code === 'unpublished' ? 'unpublished' : 'not_found');
        }
        setLoading(false);
      })
      .catch(() => {
        setRaffle(null);
        setNotFoundVariant('not_found');
        setLoading(false);
      });
  };

  useEffect(() => { loadTickets(); }, [id]);

  // Countdown Logic
  useEffect(() => {
    if (!raffle || !raffle.draw_date) return;
    const target = new Date(raffle.draw_date.replace(/-/g, '/')).getTime(); // Compatible con iOS/Safari

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(interval);
        setIsEnded(true);
        return;
      }

      setTimeLeft({
        d: Math.floor(distance / (1000 * 60 * 60 * 24)),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [raffle]);

  useGSAP(() => {
    if (tickets.length > 0 && !loading) {
      gsap.fromTo('.ticket-item',
        { y: 40, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.015, ease: 'back.out(1.2)' }
      );
    }
  }, { dependencies: [tickets, loading, rangeStart], scope: containerRef });

  // --- Lógica de la ventana de boletos ---
  const pad = raffle ? Math.max(2, String(Math.max(0, raffle.total_tickets - 1)).length) : 3;
  const showSlider = tickets.length > WINDOW_SIZE;
  const maxStart = Math.max(0, tickets.length - WINDOW_SIZE);
  const rangeEnd = Math.min(rangeStart + WINDOW_SIZE, tickets.length);
  const visibleTickets = showSlider ? tickets.slice(rangeStart, rangeEnd) : tickets;

  const shiftWindow = (delta) => {
    setRangeStart(prev => Math.min(Math.max(prev + delta, 0), maxStart));
  };

  // Slider arrastrable (track + handle) para navegar entre ventanas de 100 boletos
  useGSAP(() => {
    if (!showSlider || !trackRef.current || !handleRef.current) return;

    const track = trackRef.current;
    const handle = handleRef.current;
    const localMaxStart = Math.max(0, tickets.length - WINDOW_SIZE);

    const [instance] = Draggable.create(handle, {
      type: 'x',
      bounds: track,
      inertia: false,
      onDragEnd: function () {
        const maxX = Math.max(1, track.offsetWidth - handle.offsetWidth);
        const fraction = Math.min(1, Math.max(0, this.x / maxX));
        const snapped = Math.round((fraction * localMaxStart) / WINDOW_SIZE) * WINDOW_SIZE;
        setRangeStart(Math.min(Math.max(snapped, 0), localMaxStart));
      },
    });

    return () => instance.kill();
  }, { dependencies: [showSlider, tickets.length], scope: containerRef });

  // Sincroniza la posición del handle cuando la ventana cambia por los botones prev/next
  useGSAP(() => {
    if (!showSlider || !trackRef.current || !handleRef.current) return;

    const track = trackRef.current;
    const handle = handleRef.current;
    const maxX = Math.max(1, track.offsetWidth - handle.offsetWidth);
    const targetX = maxStart > 0 ? (rangeStart / maxStart) * maxX : 0;

    gsap.to(handle, { x: targetX, duration: 0.4, ease: 'power2.out' });
  }, { dependencies: [rangeStart, showSlider, tickets.length], scope: containerRef });

  const handleSelect = (ticket, element) => {
    if (ticket.status !== 'available' || isEnded) return;
    
    gsap.to(element, {
      scale: 0.9, duration: 0.1, yoyo: true, repeat: 1,
      onComplete: () => {
        setSelectedTicket(ticket);
        setPurchaseStatus('');
      }
    });
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
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
          buyer_email: formData.email
        })
      });
      const data = await res.json();
      if(data.success) {
        setPurchaseStatus('¡Boleto bloqueado a tu nombre!');
        setTimeout(() => {
          setSelectedTicket(null);
          setFormData({ name: '', phone: '', email: '' });
          loadTickets();
        }, 2000);
      } else {
        setPurchaseStatus(data.message || 'Error al reservar.');
      }
    } catch(err) { setPurchaseStatus('Error de conexión.'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-sans bg-zinc-50 dark:bg-zinc-950"><div className="animate-pulse flex items-center gap-2"><Ticket className="animate-spin text-blue-500" /> Cargando bóveda...</div></div>;
  if (!raffle) return <NotFound variant={notFoundVariant || 'not_found'} />;

  return (
    <div className="min-h-screen relative font-sans" ref={containerRef}>
      {/* Fondo con imagen desenfocada, adaptado a claro/oscuro */}
      {raffle.background_image && (
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center scale-110 blur-3xl opacity-30 dark:opacity-20"
            style={{ backgroundImage: `url(${raffle.background_image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/70 via-zinc-50/90 to-zinc-50 dark:from-[#09090b]/70 dark:via-[#09090b]/90 dark:to-[#09090b]" />
        </div>
      )}

      {/* Navbar Minimalista */}
      <nav className="w-full p-4 flex justify-between items-center max-w-6xl mx-auto">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <ShieldCheck className="text-blue-500" />
          <span>Ticket<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-violet-500">Vault</span></span>
        </Link>
        <ThemeToggle />
      </nav>

      {/* Header Central con Countdown */}
      <div className="text-center mt-4 mb-16 px-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500">
          {raffle.title}
        </h1>

        {raffle.description && (
          <p className="max-w-xl mx-auto text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
            {raffle.description}
          </p>
        )}

        <div className="inline-flex items-center gap-2 px-6 py-2 mb-8 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm">
          <span className="text-zinc-500 dark:text-zinc-400 font-medium">Inversión por acceso:</span>
          <span className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">${raffle.price_per_ticket}</span>
        </div>

        {/* CONTENEDOR DEL COUNTDOWN */}
        <div className="max-w-md mx-auto">
          {isEnded ? (
            <div className="inline-block px-8 py-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl">
              <h3 className="text-red-600 dark:text-red-500 font-bold text-xl tracking-widest uppercase">El sorteo ha finalizado</h3>
            </div>
          ) : (
            <div className="flex justify-center gap-3 sm:gap-4">
              <TimeBlock value={timeLeft.d} label="Días" />
              <TimeBlock value={timeLeft.h} label="Horas" />
              <TimeBlock value={timeLeft.m} label="Minutos" />
              <TimeBlock value={timeLeft.s} label="Segundos" />
            </div>
          )}
        </div>
      </div>

      {/* Slider de navegación entre ventanas de 100 boletos */}
      {showSlider && (
        <div className={`max-w-2xl mx-auto px-4 mb-8 ${isEnded ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between mb-2 px-1 text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            <span>Mostrando {rangeStart.toString().padStart(pad, '0')}–{(rangeEnd - 1).toString().padStart(pad, '0')}</span>
            <span>{tickets.length} boletos</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => shiftWindow(-WINDOW_SIZE)}
              disabled={rangeStart === 0}
              className="shrink-0 p-2 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>

            <div ref={trackRef} className="relative flex-1 h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                ref={handleRef}
                className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 shadow-md cursor-grab active:cursor-grabbing touch-none"
                style={{ width: `${Math.max(6, (WINDOW_SIZE / tickets.length) * 100)}%` }}
              />
            </div>

            <button
              onClick={() => shiftWindow(WINDOW_SIZE)}
              disabled={rangeStart >= maxStart}
              className="shrink-0 p-2 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Grilla Interactiva */}
      <div className={`grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 sm:gap-3 max-w-5xl mx-auto px-4 pb-20 ${isEnded ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
        {visibleTickets.map((t) => {
          const isAv = t.status === 'available';
          const bgClass = isAv 
            ? 'bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-500 dark:hover:border-blue-400 text-zinc-900 dark:text-zinc-100' 
            : t.status === 'paid' 
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-500 opacity-60 cursor-not-allowed' 
              : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 opacity-50 cursor-not-allowed';

          return (
            <button
              key={t.number}
              onClick={(e) => handleSelect(t, e.currentTarget)}
              disabled={!isAv || isEnded}
              className={`ticket-item h-12 sm:h-14 flex items-center justify-center rounded-xl font-mono text-base sm:text-lg font-bold transition-all duration-300 ${bgClass}`}
            >
              {t.number.toString().padStart(pad, '0')}
            </button>
          );
        })}
      </div>

      {/* Modal Desplegable Premium */}
      {selectedTicket && !isEnded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}></div>
          <div className="relative bg-white dark:bg-zinc-900 p-8 rounded-3xl max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 transform transition-all">
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Reservar Acceso</h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Boleto seleccionado: <span className="font-mono text-blue-500 font-bold">#{selectedTicket.number.toString().padStart(pad, '0')}</span></p>
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
