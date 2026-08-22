import React, { useRef, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import ThemeToggle from './ThemeToggle';
import NotFound from './NotFound';
import OrganizerModal from './OrganizerModal';
import VerifyParticipationModal from './VerifyParticipationModal';
import PaymentInfoModal from './PaymentInfoModal';
import {
  ShieldCheck, Ticket, ChevronLeft, ChevronRight, Loader2, Trash2, ShoppingBag, Filter, FilterX, Dices, X, RotateCcw,
  Menu, Share2, UserCircle2, Search, Wallet, Check,
} from 'lucide-react';

const RANDOM_PRESETS = [1, 2, 3, 5];

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

const formatDrawDate = (value) => {
  if (!value) return '';
  const d = new Date(value.replace(/-/g, '/'));
  const formatted = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  return formatted.replace(/\.$/, '').replace(/^(\d+ )([a-záéíóúñ])/i, (_, day, letter) => day + letter.toUpperCase());
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
  const { slug: id } = useParams();
  const containerRef = useRef();
  const gridSectionRef = useRef(null);
  const [tickets, setTickets] = useState([]);
  const [raffle, setRaffle] = useState(null);
  const [selectedNumbers, setSelectedNumbers] = useState(new Set());
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [availableCount, setAvailableCount] = useState(null);
  const barContentRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [notFoundVariant, setNotFoundVariant] = useState(null);
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Menú hamburguesa (compartir / organizador / verificar / pagos)
  const [showMenu, setShowMenu] = useState(false);
  const [showOrganizerModal, setShowOrganizerModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showPaymentInfoModal, setShowPaymentInfoModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Selección al azar
  const [showRandomModal, setShowRandomModal] = useState(false);
  const [randomStep, setRandomStep] = useState('pick'); // 'pick' | 'preview'
  const [randomQuantity, setRandomQuantity] = useState(null);
  const [randomNumbers, setRandomNumbers] = useState([]);
  const [randomLoading, setRandomLoading] = useState(false);
  const [randomError, setRandomError] = useState('');

  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [purchaseStatus, setPurchaseStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [isEnded, setIsEnded] = useState(false);

  // Paginación: solo aplica a rifas de más de 3 cifras (más de 1000 boletos).
  // Cada página trae 1000 boletos del servidor (0-999, 1000-1999, ...).
  const PAGE_SIZE = 1000;
  const [page, setPage] = useState(0);

  // Resetear la página cuando cambia la rifa
  useEffect(() => { setPage(0); }, [id]);

  // Restaurar la selección guardada para esta rifa (sobrevive a recargas de página)
  const storageKey = `ticketvault_selection_${id}`;
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setSelectedNumbers(raw ? new Set(JSON.parse(raw)) : new Set());
    } catch {
      setSelectedNumbers(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Persistir la selección en cada cambio
  useEffect(() => {
    try {
      if (selectedNumbers.size > 0) localStorage.setItem(storageKey, JSON.stringify([...selectedNumbers]));
      else localStorage.removeItem(storageKey);
    } catch { /* localStorage no disponible */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNumbers, id]);

  // Si un número seleccionado ya no está disponible (lo tomó alguien más), se limpia de la selección
  useEffect(() => {
    setSelectedNumbers(prev => {
      let changed = false;
      const next = new Set(prev);
      tickets.forEach(t => {
        if (next.has(t.number) && t.status !== 'available') {
          next.delete(t.number);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [tickets]);

  const loadTickets = (targetPage) => {
    setPageLoading(true);
    fetch(`/api/get_tickets.php?slug=${encodeURIComponent(id)}&offset=${targetPage * PAGE_SIZE}&limit=${PAGE_SIZE}`)
      .then(res => res.json())
      .then(data => {
        if(data.success) {
          setTickets(data.tickets);
          setRaffle(data.raffle);
          setAvailableCount(data.available_count);
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
      // stagger por "amount" total (no por ítem): con páginas de hasta 1000
      // boletos, un stagger fijo por ítem tardaría demasiado en terminar.
      gsap.fromTo('.ticket-item',
        { y: 40, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: { amount: 0.7, from: 'start' }, ease: 'back.out(1.2)' }
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

  // Crossfade entre el resumen de la rifa y los controles de selección en la barra flotante
  useGSAP(() => {
    if (!barContentRef.current) return;
    gsap.fromTo(barContentRef.current, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' });
  }, { dependencies: [selectedNumbers.size > 0], scope: containerRef });

  const toggleSelect = (ticket, element) => {
    if (ticket.status !== 'available' || isEnded) return;

    gsap.to(element, { scale: 0.9, duration: 0.1, yoyo: true, repeat: 1 });
    setSelectedNumbers(prev => {
      const next = new Set(prev);
      if (next.has(ticket.number)) next.delete(ticket.number);
      else next.add(ticket.number);
      return next;
    });
  };

  const shareRaffle = async () => {
    setShowMenu(false);
    const shareData = { title: raffle?.title || 'Sorteo', url: window.location.href };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* usuario canceló */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch { /* clipboard no disponible */ }
  };

  const clearSelection = () => setSelectedNumbers(new Set());

  const viewAvailableNumbers = () => {
    // Refresca los boletos de la página actual en tiempo real (sin recargar el
    // navegador) para reflejar lo que otros compradores hayan tomado mientras
    // tanto, activa el filtro de "solo disponibles" y desplaza hasta la grilla.
    setOnlyAvailable(true);
    loadTickets(page);
    gridSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openRandomModal = () => {
    setRandomStep('pick');
    setRandomQuantity(null);
    setRandomNumbers([]);
    setRandomError('');
    setShowRandomModal(true);
  };

  const drawRandomNumbers = async () => {
    if (!randomQuantity) return;
    setRandomLoading(true);
    setRandomError('');
    try {
      const res = await fetch(`/api/random_tickets.php?raffle_id=${raffle.id}&count=${randomQuantity}`);
      const data = await res.json();
      if (data.success && data.ticket_numbers.length > 0) {
        setRandomNumbers(data.ticket_numbers.sort((a, b) => a - b));
        setRandomStep('preview');
      } else {
        setRandomError(data.message || 'No hay suficientes boletos disponibles para elegir al azar.');
      }
    } catch {
      setRandomError('Error de conexión.');
    }
    setRandomLoading(false);
  };

  const confirmRandomSelection = () => {
    setSelectedNumbers(prev => new Set([...prev, ...randomNumbers]));
    setShowRandomModal(false);
    setPurchaseStatus('');
    setShowReserveModal(true);
  };

  const sortedSelection = [...selectedNumbers].sort((a, b) => a - b);
  const selectionTotal = raffle ? (sortedSelection.length * parseFloat(raffle.price_per_ticket)) : 0;
  const randomTotal = raffle ? (randomNumbers.length * parseFloat(raffle.price_per_ticket)) : 0;
  const visibleGridTickets = onlyAvailable ? tickets.filter(t => t.status === 'available') : tickets;

  const handlePurchase = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setPurchaseStatus('Procesando reserva...');
    try {
      const res = await fetch('/api/reserve_ticket.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raffle_id: raffle.id,
          ticket_numbers: sortedSelection,
          buyer_name: formData.name,
          buyer_phone: formData.phone,
          buyer_email: formData.email
        })
      });
      const data = await res.json();
      if(data.success) {
        setPurchaseStatus('¡Boletos bloqueados a tu nombre!');
        setTimeout(() => {
          setShowReserveModal(false);
          setSelectedNumbers(new Set());
          setFormData({ name: '', phone: '', email: '' });
          setPurchaseStatus('');
          loadTickets(page);
        }, 2000);
      } else {
        if (Array.isArray(data.unavailable) && data.unavailable.length > 0) {
          const stale = new Set(data.unavailable);
          setSelectedNumbers(prev => new Set([...prev].filter(n => !stale.has(n))));
          setPurchaseStatus(`Los boletos ${data.unavailable.map(n => n.toString().padStart(pad, '0')).join(', ')} ya no estaban disponibles y fueron quitados de tu selección. Revisa e intenta de nuevo.`);
        } else {
          setPurchaseStatus(data.message || 'Error al reservar.');
        }
        setSubmitting(false);
      }
    } catch(err) {
      setPurchaseStatus('Error de conexión.');
      setSubmitting(false);
    }
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
      <nav className="w-full p-4 flex justify-between items-center max-w-6xl mx-auto relative">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <ShieldCheck className="text-blue-500" />
          <span>Ticket<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-violet-500">Vault</span></span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <div className="relative">
            <button
              onClick={() => setShowMenu(prev => !prev)}
              className="p-2 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
              title="Más opciones"
            >
              <Menu size={20} />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden py-1.5">
                  <button
                    onClick={shareRaffle}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {linkCopied ? <Check size={16} className="text-emerald-500" /> : <Share2 size={16} />}
                    {linkCopied ? '¡Enlace copiado!' : 'Compartir'}
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); setShowOrganizerModal(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <UserCircle2 size={16} /> Ver el organizador
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); setShowVerifyModal(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Search size={16} /> Verificar participación
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); setShowPaymentInfoModal(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Wallet size={16} /> Pagos
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
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
          <span className="text-zinc-500 dark:text-zinc-400 font-medium">Valor sorteo:</span>
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

        {!isEnded && (
          <div className="flex items-center justify-center gap-3 mt-10 flex-wrap">
            <button
              onClick={onlyAvailable ? () => setOnlyAvailable(false) : viewAvailableNumbers}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border transition-colors backdrop-blur-md ${
                onlyAvailable
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-500/10'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 bg-white/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {onlyAvailable ? <><FilterX size={16} /> Mostrar todos</> : <><Filter size={16} /> Ver números disponibles</>}
            </button>
            <button
              onClick={openRandomModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-500 to-violet-500 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all active:scale-95"
            >
              <Dices size={16} /> Elegir al azar
            </button>
          </div>
        )}
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
      <div ref={gridSectionRef} className="relative max-w-5xl mx-auto px-4 pb-20 scroll-mt-4">
        {pageLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="animate-spin text-blue-500" size={28} />
          </div>
        )}
        {onlyAvailable && visibleGridTickets.length === 0 && !pageLoading && (
          <div className="text-center py-16 text-zinc-500 dark:text-zinc-400">
            No quedan boletos disponibles en esta página.
          </div>
        )}
        <div className={`grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 sm:gap-3 transition-opacity duration-200 ${isEnded ? 'opacity-50 pointer-events-none grayscale' : ''} ${pageLoading ? 'opacity-30 pointer-events-none' : ''}`}>
          {visibleGridTickets.map((t) => {
            const isAv = t.status === 'available';
            const isSelected = isAv && selectedNumbers.has(t.number);
            const bgClass = isSelected
              ? 'bg-gradient-to-br from-blue-500 to-violet-500 border border-transparent text-white shadow-lg shadow-blue-500/30 scale-105'
              : isAv
                ? 'bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-500 dark:hover:border-blue-400 text-zinc-900 dark:text-zinc-100'
                : t.status === 'paid'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-500 opacity-60 cursor-not-allowed'
                  : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 opacity-50 cursor-not-allowed';

            return (
              <button
                key={t.number}
                onClick={(e) => toggleSelect(t, e.currentTarget)}
                disabled={!isAv || isEnded}
                className={`ticket-item h-12 sm:h-14 flex items-center justify-center rounded-xl font-mono text-base sm:text-lg font-bold transition-all duration-300 ${bgClass}`}
              >
                {t.number.toString().padStart(pad, '0')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra flotante: resumen de la rifa cuando no hay selección, controles de reserva cuando sí la hay */}
      {!isEnded && (
        <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40">
          <div ref={barContentRef} className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl pl-3 pr-3 py-2.5 sm:pl-4 sm:pr-4 sm:py-3">
            {selectedNumbers.size === 0 ? (
              <div className="flex items-stretch divide-x divide-zinc-200 dark:divide-zinc-800">
                <div className="flex flex-col items-center px-4 sm:px-6">
                  <span className="font-mono font-extrabold text-lg text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-violet-500">
                    {availableCount ?? '—'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mt-0.5 whitespace-nowrap">Disponibles</span>
                </div>
                <div className="flex flex-col items-center px-4 sm:px-6">
                  <span className="font-mono font-extrabold text-lg text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-violet-500">
                    ${raffle.price_per_ticket}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mt-0.5 whitespace-nowrap">Por número</span>
                </div>
                <div className="flex flex-col items-center px-4 sm:px-6">
                  <span className="font-mono font-extrabold text-lg text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-violet-500 whitespace-nowrap">
                    {formatDrawDate(raffle.draw_date)}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mt-0.5">Sorteo</span>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={clearSelection}
                  title="Vaciar selección"
                  className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors shrink-0"
                >
                  <Trash2 size={18} />
                </button>
                <div className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                  {selectedNumbers.size} boleto{selectedNumbers.size === 1 ? '' : 's'} 
                </div>
                <button
                  onClick={() => { setPurchaseStatus(''); setShowReserveModal(true); }}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95 whitespace-nowrap"
                >
                  <ShoppingBag size={16} /> Tomar números
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Desplegable Premium */}
      {showReserveModal && !isEnded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => !submitting && setShowReserveModal(false)}></div>
          <div className="relative bg-white dark:bg-zinc-900 p-8 rounded-3xl max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 transform transition-all max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Reservar Acceso</h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                  {sortedSelection.length} boleto{sortedSelection.length === 1 ? '' : 's'} seleccionado{sortedSelection.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto mb-6 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
              {sortedSelection.map(num => (
                <span key={num} className="font-mono text-xs font-bold px-2 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-blue-500">
                  #{num.toString().padStart(pad, '0')}
                </span>
              ))}
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

              <div className="flex items-center justify-between px-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div>
                  <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold">Cantidad</p>
                  <p className="font-mono font-bold text-lg">{sortedSelection.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold">Total</p>
                  <p className="font-mono font-bold text-lg text-emerald-600 dark:text-emerald-400">${selectionTotal.toFixed(2)}</p>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" disabled={submitting} className="flex-1 px-4 py-3 rounded-xl text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  onClick={() => setShowReserveModal(false)}>Cancelar</button>
                <button type="submit" disabled={submitting || sortedSelection.length === 0} className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50">
                  Reservar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de selección al azar */}
      {showRandomModal && !isEnded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => !randomLoading && setShowRandomModal(false)}></div>
          <div className="relative bg-white dark:bg-zinc-900 p-8 rounded-3xl max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 transform transition-all max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Seleccionar números</h2>
              <button onClick={() => setShowRandomModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            {randomStep === 'pick' ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {RANDOM_PRESETS.map(n => (
                    <button
                      key={n}
                      onClick={() => setRandomQuantity(n)}
                      className={`flex flex-col items-center justify-center gap-1 py-5 rounded-2xl font-bold transition-all ${
                        randomQuantity === n
                          ? 'bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                          : 'bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-blue-400 dark:hover:border-blue-500'
                      }`}
                    >
                      <span className="text-2xl">+{n}</span>
                      <span className="text-xs font-medium opacity-80">Tomar al azar</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-2 mb-6 text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">Valor del número:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">${raffle.price_per_ticket}</span>
                </div>

                {randomError && (
                  <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/50 text-center text-sm font-medium">
                    {randomError}
                  </div>
                )}

                <button
                  onClick={drawRandomNumbers}
                  disabled={!randomQuantity || randomLoading}
                  className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {randomLoading ? 'Sorteando...' : 'Continuar'}
                </button>
              </>
            ) : (
              <>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
                  {randomNumbers.length} boleto{randomNumbers.length === 1 ? '' : 's'} elegido{randomNumbers.length === 1 ? '' : 's'} al azar
                </p>

                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto mb-6 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                  {randomNumbers.map(num => (
                    <span key={num} className="font-mono text-xs font-bold px-2 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-blue-500">
                      #{num.toString().padStart(pad, '0')}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between px-1 pb-6 mb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold">Cantidad</p>
                    <p className="font-mono font-bold text-lg">{randomNumbers.length}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold">Total</p>
                    <p className="font-mono font-bold text-lg text-emerald-600 dark:text-emerald-400">${randomTotal.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={drawRandomNumbers}
                    disabled={randomLoading}
                    title="Elegir otros números al azar"
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    <RotateCcw size={16} /> Elegir otros
                  </button>
                  <button
                    onClick={confirmRandomSelection}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                  >
                    Continuar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showOrganizerModal && (
        <OrganizerModal raffle={raffle} onClose={() => setShowOrganizerModal(false)} />
      )}

      {showVerifyModal && (
        <VerifyParticipationModal raffle={raffle} pad={pad} onClose={() => setShowVerifyModal(false)} />
      )}

      {showPaymentInfoModal && (
        <PaymentInfoModal raffle={raffle} onClose={() => setShowPaymentInfoModal(false)} />
      )}
    </div>
  );
}
