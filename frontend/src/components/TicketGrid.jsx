import React, { useRef, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import ThemeToggle from './ThemeToggle';
import NotFound from './NotFound';
import { ShieldCheck, Ticket, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

gsap.registerPlugin(useGSAP);

// Construye la lista de botones de página con elipsis para no saturar la UI
// cuando hay muchas páginas (p.ej. una rifa de 4 cifras tiene 100 páginas).
const buildPageList = (current, total) => {
  const keep = new Set([0, total - 1, current - 1, current, current + 1]);
  const pages = [...keep].filter(p => p >= 0 && p < total).sort((a, b) => a - b);
  const result = [];
  let prev = null;
  for (const p of pages) {
    if (prev !== null && p - prev > 1) result.push({ type: 'ellipsis', key: `e${p}` });
    result.push({ type: 'page', value: p });
    prev = p;
  }
  return result;
};

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
  const [tickets, setTickets] = useState([]);
  const [raffle, setRaffle] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [notFoundVariant, setNotFoundVariant] = useState(null);

  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [purchaseStatus, setPurchaseStatus] = useState('');

  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [isEnded, setIsEnded] = useState(false);

  // Paginación: cuando la rifa tiene más de PAGE_SIZE boletos, se piden
  // al servidor de a PAGE_SIZE por vez (carga diferida por página).
  const PAGE_SIZE = 100;
  const [page, setPage] = useState(0);

  // Resetear la página cuando cambia la rifa
  useEffect(() => { setPage(0); }, [id]);

  const loadTickets = (targetPage) => {
    setPageLoading(true);
    fetch(`/api/get_tickets.php?id=${id}&offset=${targetPage * PAGE_SIZE}&limit=${PAGE_SIZE}`)
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
        setPageLoading(false);
      })
      .catch(() => {
        setRaffle(null);
        setNotFoundVariant('not_found');
        setLoading(false);
        setPageLoading(false);
      });
  };

  useEffect(() => { loadTickets(page); }, [id, page]);

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
  }, { dependencies: [tickets, loading], scope: containerRef });

  // --- Lógica de paginación ---
  const pad = raffle ? Math.max(2, String(Math.max(0, raffle.total_tickets - 1)).length) : 3;
  const totalPages = raffle ? Math.max(1, Math.ceil(raffle.total_tickets / PAGE_SIZE)) : 1;
  const showPagination = totalPages > 1;
  const rangeStart = page * PAGE_SIZE;
  const rangeEnd = raffle ? Math.min(rangeStart + PAGE_SIZE, raffle.total_tickets) : rangeStart;
  const pageList = showPagination ? buildPageList(page, totalPages) : [];

  const goToPage = (targetPage) => {
    const clamped = Math.min(Math.max(targetPage, 0), totalPages - 1);
    if (clamped !== page) setPage(clamped);
  };

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
          loadTickets(page);
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

      {/* Paginación: cada página trae 100 boletos nuevos desde el servidor */}
      {showPagination && (
        <div className={`max-w-2xl mx-auto px-4 mb-8 ${isEnded ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="text-center mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Mostrando {rangeStart.toString().padStart(pad, '0')}–{(rangeEnd - 1).toString().padStart(pad, '0')} de {raffle.total_tickets}
          </div>
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 0}
              className="shrink-0 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>

            {pageList.map(item => item.type === 'ellipsis' ? (
              <span key={item.key} className="px-1 text-zinc-400 select-none">…</span>
            ) : (
              <button
                key={item.value}
                onClick={() => goToPage(item.value)}
                className={`min-w-[2.5rem] h-10 px-3 rounded-xl font-mono font-bold text-sm transition-colors ${
                  item.value === page
                    ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-blue-400 dark:hover:border-blue-500'
                }`}
              >
                {item.value + 1}
              </button>
            ))}

            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages - 1}
              className="shrink-0 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Grilla Interactiva */}
      <div className="relative max-w-5xl mx-auto px-4 pb-20">
        {pageLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="animate-spin text-blue-500" size={28} />
          </div>
        )}
        <div className={`grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 sm:gap-3 transition-opacity duration-200 ${isEnded ? 'opacity-50 pointer-events-none grayscale' : ''} ${pageLoading ? 'opacity-30 pointer-events-none' : ''}`}>
          {tickets.map((t) => {
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
