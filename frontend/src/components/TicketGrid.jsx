import React, { useRef, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import ThemeToggle from './ThemeToggle';
import NotFound from './NotFound';
import OrganizerModal from './OrganizerModal';
import VerifyParticipationModal from './VerifyParticipationModal';
import PaymentInfoModal from './PaymentInfoModal';
import AccountMenuSection from './AccountMenuSection';
import TicketQRCode from './TicketQRCode';
import { getRaffleTheme, getNumberStyleClass, getBgColorClass } from '../utils/raffleTheme';
import {
  ShieldCheck, Ticket, ChevronLeft, ChevronRight, Loader2, Trash2, ShoppingBag, Filter, FilterX, Dices, X, RotateCcw,
  Menu, Share2, UserCircle2, Search, Wallet, Check, CheckCircle2, ExternalLink, Phone, Mail, CalendarDays,
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

// Fecha completa y legible del sorteo, p.ej. "31 de diciembre de 2026, 11:59"
const formatDrawDateFull = (value) => {
  if (!value) return '';
  const d = new Date(value.replace(/-/g, '/'));
  return d.toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const TimeBlock = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <div className="w-full aspect-square bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl flex items-center justify-center relative overflow-hidden group">
      <span
        className="text-xl sm:text-2xl font-mono font-extrabold text-transparent bg-clip-text drop-shadow-sm"
        style={{ backgroundImage: 'linear-gradient(135deg, var(--theme-c1), var(--theme-c2))' }}
      >
        {value.toString().padStart(2, '0')}
      </span>
    </div>
    <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mt-1.5 uppercase tracking-widest">{label}</span>
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
  const [numberSearch, setNumberSearch] = useState('');
  const [searchError, setSearchError] = useState('');
  const [pendingHighlight, setPendingHighlight] = useState(null);

  // Vendedores: filtra la grilla por ?seller=CODE (sin cambiar la URL de la rifa)
  const [sellers, setSellers] = useState([]);
  const [sellerCodeParam] = useState(() => new URLSearchParams(window.location.search).get('seller')?.toUpperCase() || null);
  const [sellerPageChecked, setSellerPageChecked] = useState(false);
  const [selectedSellerCode, setSelectedSellerCode] = useState('');

  // Menú hamburguesa (compartir / organizador / verificar / pagos / cuenta)
  const [showMenu, setShowMenu] = useState(false);
  const [showOrganizerModal, setShowOrganizerModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showPaymentInfoModal, setShowPaymentInfoModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [me, setMe] = useState(null);

  useEffect(() => {
    fetch('/api/me.php', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setMe(data.success ? data : null))
      .catch(() => setMe(null));
  }, []);

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
  const [purchasedTickets, setPurchasedTickets] = useState(null);

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
          setSellers(data.sellers || []);
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

  // Entrada orquestada en dos tiempos: primero el póster/encabezado, luego
  // la barra lateral con las acciones — refuerza que el encabezado es lo
  // primero que se lee de la rifa.
  useGSAP(() => {
    if (loading || !raffle) return;
    const tl = gsap.timeline();
    tl.fromTo('.hero-image-el', { scale: 1.12, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9, ease: 'power2.out' })
      .fromTo('.hero-panel', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.6')
      .fromTo('.side-panel', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.35');
  }, { dependencies: [raffle?.id, loading], scope: containerRef });

  const activeSeller = sellerCodeParam ? sellers.find(s => s.code === sellerCodeParam) || null : null;

  // --- Lógica de paginación ---
  const pad = raffle ? Math.max(2, String(Math.max(0, raffle.total_tickets - 1)).length) : 3;
  const totalPages = raffle ? Math.max(1, Math.ceil(raffle.total_tickets / PAGE_SIZE)) : 1;
  // Si hay un filtro de vendedor activo con rango, solo hace falta paginar
  // cuando ese rango realmente cruza más de un bloque de PAGE_SIZE (algo muy
  // raro). Si el vendedor no tiene rango (puede vender toda la rifa), la
  // paginación se comporta como si no hubiera filtro.
  const sellerPageSpan = activeSeller && activeSeller.range_start != null
    ? Math.floor(activeSeller.range_end / PAGE_SIZE) - Math.floor(activeSeller.range_start / PAGE_SIZE) + 1
    : totalPages;
  const showPagination = totalPages > 1 && sellerPageSpan > 1;
  const rangeStart = page * PAGE_SIZE;
  const rangeEnd = raffle ? Math.min(rangeStart + PAGE_SIZE, raffle.total_tickets) : rangeStart;
  const pageList = showPagination ? buildPageList(page, totalPages) : [];

  const goToPage = (targetPage) => {
    const clamped = Math.min(Math.max(targetPage, 0), totalPages - 1);
    if (clamped !== page) setPage(clamped);
  };

  // Si el enlace trae ?seller=CODE y ese vendedor tiene rango, salta una sola
  // vez a la página donde empieza (solo aplica a rifas con varias páginas).
  useEffect(() => {
    if (!activeSeller || sellerPageChecked || pageLoading) return;
    setSellerPageChecked(true);
    if (activeSeller.range_start != null) {
      goToPage(Math.floor(activeSeller.range_start / PAGE_SIZE));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSeller, sellerPageChecked, pageLoading]);

  // Precarga el vendedor del enlace en el selector de "quién te atendió"
  useEffect(() => {
    if (activeSeller && !selectedSellerCode) setSelectedSellerCode(activeSeller.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSeller]);

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

  const removeSelectedNumber = (num) => {
    setSelectedNumbers(prev => {
      const next = new Set(prev);
      next.delete(num);
      return next;
    });
  };

  const viewAvailableNumbers = () => {
    // Refresca los boletos de la página actual en tiempo real (sin recargar el
    // navegador) para reflejar lo que otros compradores hayan tomado mientras
    // tanto, activa el filtro de "solo disponibles" y desplaza hasta la grilla.
    setOnlyAvailable(true);
    loadTickets(page);
    gridSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleNumberSearch = (e) => {
    e.preventDefault();
    if (!raffle || !numberSearch.trim()) return;
    const num = parseInt(numberSearch, 10);
    if (Number.isNaN(num) || num < 0 || num >= raffle.total_tickets) {
      setSearchError(`Ingresa un número entre ${(0).toString().padStart(pad, '0')} y ${(raffle.total_tickets - 1).toString().padStart(pad, '0')}.`);
      return;
    }
    setSearchError('');
    setNumberSearch('');
    setOnlyAvailable(false);
    setPendingHighlight(num);
    goToPage(Math.floor(num / PAGE_SIZE));
  };

  // Cuando hay un número pendiente por resaltar (tras una búsqueda), espera a
  // que la página/grilla correspondiente termine de cargar y lo desplaza a la vista.
  useEffect(() => {
    if (pendingHighlight === null || pageLoading) return;
    const el = document.getElementById(`ticket-${pendingHighlight}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ticket-highlight');
      gsap.fromTo(el, { scale: 1.3 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
      setTimeout(() => el.classList.remove('ticket-highlight'), 1600);
    }
    setPendingHighlight(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets, onlyAvailable, pendingHighlight, pageLoading]);

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
      const sellerParam = activeSeller ? `&seller=${encodeURIComponent(activeSeller.code)}` : '';
      const res = await fetch(`/api/random_tickets.php?raffle_id=${raffle.id}&count=${randomQuantity}${sellerParam}`);
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

  const removeRandomNumber = (num) => {
    setRandomNumbers(prev => prev.filter(n => n !== num));
  };

  const confirmRandomSelection = () => {
    setSelectedNumbers(prev => new Set([...prev, ...randomNumbers]));
    setShowRandomModal(false);
    setPurchaseStatus('');
    setPurchasedTickets(null);
    setShowReserveModal(true);
  };

  const sortedSelection = [...selectedNumbers].sort((a, b) => a - b);
  const selectionTotal = raffle ? (sortedSelection.length * parseFloat(raffle.price_per_ticket)) : 0;
  const randomTotal = raffle ? (randomNumbers.length * parseFloat(raffle.price_per_ticket)) : 0;
  const visibleGridTickets = tickets
    .filter(t => !onlyAvailable || t.status === 'available')
    .filter(t => !activeSeller || activeSeller.range_start == null || (t.number >= activeSeller.range_start && t.number <= activeSeller.range_end));

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
          buyer_email: formData.email,
          seller_code: raffle.allow_seller_selection ? (selectedSellerCode || null) : (activeSeller?.code || null)
        })
      });
      const data = await res.json();
      if(data.success) {
        setPurchasedTickets(data.tickets);
        setSelectedNumbers(new Set());
        setFormData({ name: '', phone: '', email: '' });
        setPurchaseStatus('');
        setSubmitting(false);
        loadTickets(page);
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

  const theme = getRaffleTheme(raffle.theme_color);
  const numberShapeClass = getNumberStyleClass(raffle.number_style);
  const bgColorClass = getBgColorClass(raffle.bg_color);
  const raffleUrl = `${window.location.origin}/sorteo/${raffle.slug}`;

  return (
    <div
      className={`min-h-screen relative font-sans ${bgColorClass}`}
      ref={containerRef}
      style={{ '--theme-c1': theme.c1, '--theme-c2': theme.c2 }}
    >
      {/* Fondo con imagen desenfocada, mezclada con el color de fondo elegido (pastel en claro, versión profunda en oscuro) */}
      {raffle.background_image && (
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center scale-110 blur-3xl opacity-30 dark:opacity-20"
            style={{ backgroundImage: `url(${raffle.background_image})` }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 0%, var(--raffle-bg) 70%)' }} />
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

          <button
            onClick={() => setShowPaymentInfoModal(true)}
            className="p-2 rounded-full text-white shadow-sm hover:shadow-md transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, var(--theme-c1), var(--theme-c2))' }}
            title="Pagos"
          >
            <Wallet size={20} />
          </button>

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

                  <AccountMenuSection me={me} raffleSlug={id} onClose={() => setShowMenu(false)} onLoggedOut={() => setMe(null)} />
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Póster de la rifa: imagen grande, sello del organizador sobre la línea
          perforada, título, fecha y descripción completa — todo con espacio
          de sobra para que una descripción larga nunca quede apretada. */}
      <div className="max-w-6xl mx-auto px-4 pt-2">
        <div className="hero-panel relative bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-900/5 overflow-hidden">
          <div className="hero-image-el relative h-56 sm:h-72 md:h-80 overflow-hidden">
            {raffle.background_image ? (
              <img src={raffle.background_image} alt={raffle.title} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, var(--theme-c1), var(--theme-c2))' }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
          </div>

          {/* Línea perforada, como el talón de un boleto físico */}
          <div className="ticket-perforation h-3 text-zinc-200 dark:text-zinc-800" />

          <div className="relative px-6 sm:px-10 pb-8 sm:pb-10">
            {raffle.organizer_name && (
              <button
                type="button"
                onClick={() => setShowOrganizerModal(true)}
                title="Ver información del organizador"
                className="absolute -top-8 left-6 sm:left-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-4 ring-white dark:ring-zinc-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                {raffle.organizer_photo ? (
                  <img src={raffle.organizer_photo} alt={raffle.organizer_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, var(--theme-c1), var(--theme-c2))' }}>
                    <UserCircle2 size={28} />
                  </div>
                )}
              </button>
            )}

            <div className="pt-12 sm:pt-14">
              {raffle.organizer_name && (
                <button
                  type="button"
                  onClick={() => setShowOrganizerModal(true)}
                  className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                >
                  Organiza {raffle.organizer_name}
                </button>
              )}

              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-white leading-[1.08] mt-1">
                {raffle.title}
              </h1>

              <div
                className="inline-flex items-center gap-2 mt-4 px-3.5 py-1.5 rounded-full text-sm font-semibold bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800"
                style={{ color: 'var(--theme-c1)' }}
              >
                <CalendarDays size={15} />
                {formatDrawDateFull(raffle.draw_date)}
              </div>

              {raffle.description && (
                <p className="mt-5 max-w-2xl text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {raffle.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bóveda: números a la izquierda, información y acciones a la derecha */}
      <div className="max-w-6xl mx-auto px-4 pb-24 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">

          {/* Columna izquierda: paginación + grilla de números */}
          <div className="order-2 lg:order-1 min-w-0">
            {activeSeller && (
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-900/50 text-sm">
                <span className="text-blue-700 dark:text-blue-400 font-semibold truncate">
                  {activeSeller.range_start != null
                    ? `Números de ${activeSeller.name} · ${activeSeller.range_start.toString().padStart(pad, '0')}–${activeSeller.range_end.toString().padStart(pad, '0')}`
                    : `Comprando a través de ${activeSeller.name}`}
                </span>
                {(activeSeller.phone || activeSeller.email) && (
                  <div className="flex items-center gap-3 shrink-0">
                    {activeSeller.phone && (
                      <a href={`tel:${activeSeller.phone}`} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 whitespace-nowrap">
                        <Phone size={13} /> {activeSeller.phone}
                      </a>
                    )}
                    {activeSeller.email && (
                      <a href={`mailto:${activeSeller.email}`} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 whitespace-nowrap">
                        <Mail size={13} /> Escribir
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
            {/* Barra de acciones pegajosa: siempre a mano mientras se recorre la grilla, sin importar cuántos números tenga la rifa */}
            {!isEnded && (
              <div className="sticky top-2 z-20 mb-5 p-2 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-md space-y-2">
                <form onSubmit={handleNumberSearch} className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    type="text" inputMode="numeric" placeholder={`Buscar número (ej. ${(0).toString().padStart(pad, '0')})`}
                    value={numberSearch}
                    onChange={e => { setNumberSearch(e.target.value.replace(/\D/g, '')); if (searchError) setSearchError(''); }}
                    className="w-full pl-9 pr-14 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-bold rounded-lg text-white transition-transform active:scale-95"
                    style={{ background: 'linear-gradient(135deg, var(--theme-c1), var(--theme-c2))' }}
                  >
                    Ir
                  </button>
                </form>
                {searchError && <p className="text-xs text-red-500 px-1">{searchError}</p>}
                <div className="flex items-center gap-2">
                <button
                  onClick={openRandomModal}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm transition-all active:scale-95 shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--theme-c1), var(--theme-c2))' }}
                >
                  <Dices size={15} /> <span className="hidden sm:inline">Elegir al azar</span>
                </button>
                <button
                  onClick={onlyAvailable ? () => setOnlyAvailable(false) : viewAvailableNumbers}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border transition-colors ${
                    onlyAvailable
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-500/10'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {onlyAvailable ? <><FilterX size={15} /> Mostrar todos</> : <><Filter size={15} /> Ver disponibles</>}
                </button>
                </div>
              </div>
            )}

            {showPagination && (
              <div className={`mb-6 ${isEnded ? 'opacity-50 pointer-events-none' : ''}`}>
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
                      style={item.value === page ? { background: 'linear-gradient(135deg, var(--theme-c1), var(--theme-c2))' } : undefined}
                      className={`min-w-[2.5rem] h-10 px-3 rounded-xl font-mono font-bold text-sm transition-colors ${
                        item.value === page
                          ? 'text-white shadow-md'
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

            <div ref={gridSectionRef} className="relative scroll-mt-4">
              {pageLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <Loader2 className="animate-spin text-blue-500" size={28} />
                </div>
              )}
              {(onlyAvailable || activeSeller) && visibleGridTickets.length === 0 && !pageLoading && (
                <div className="text-center py-16 text-zinc-500 dark:text-zinc-400">
                  {activeSeller ? 'Este vendedor no tiene números en esta página.' : 'No quedan boletos disponibles en esta página.'}
                </div>
              )}
              <div className={`grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 sm:gap-3 transition-opacity duration-200 ${isEnded ? 'opacity-50 pointer-events-none grayscale' : ''} ${pageLoading ? 'opacity-30 pointer-events-none' : ''}`}>
                {visibleGridTickets.map((t) => {
                  const isAv = t.status === 'available';
                  const isSelected = isAv && selectedNumbers.has(t.number);
                  const bgClass = isSelected
                    ? 'border border-transparent text-white shadow-lg scale-105'
                    : isAv
                      ? 'bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-400 text-zinc-900 dark:text-zinc-100'
                      : t.status === 'paid'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-500 opacity-60 cursor-not-allowed'
                        : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 opacity-50 cursor-not-allowed';

                  return (
                    <button
                      key={t.number}
                      id={`ticket-${t.number}`}
                      onClick={(e) => toggleSelect(t, e.currentTarget)}
                      disabled={!isAv || isEnded}
                      style={isSelected ? { background: 'linear-gradient(135deg, var(--theme-c1), var(--theme-c2))' } : undefined}
                      className={`ticket-item h-12 sm:h-14 flex items-center justify-center ${numberShapeClass} font-mono text-base sm:text-lg font-bold transition-all duration-300 ${bgClass}`}
                    >
                      {t.number.toString().padStart(pad, '0')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Columna derecha: imagen, info y acciones de la rifa */}
          <div className="order-1 lg:order-2 lg:sticky lg:top-6">
            <div className="side-panel bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-900/5 overflow-hidden">
              <div className="relative h-52 sm:h-60 overflow-hidden">
                {raffle.background_image ? (
                  <img src={raffle.background_image} alt={raffle.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, var(--theme-c1), var(--theme-c2))' }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h1 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-sm leading-tight">
                    {raffle.title}
                  </h1>
                </div>
              </div>

              <div className="p-5 space-y-5">
                <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--theme-c1)' }}>
                  <CalendarDays size={13} />
                  {formatDrawDateFull(raffle.draw_date)}
                </div>

                {raffle.organizer_name && (
                  <button
                    type="button"
                    onClick={() => setShowOrganizerModal(true)}
                    className="flex items-center gap-2.5 w-full p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500 transition-colors text-left"
                  >
                    {raffle.organizer_photo ? (
                      <img src={raffle.organizer_photo} alt={raffle.organizer_name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: 'linear-gradient(135deg, var(--theme-c1), var(--theme-c2))' }}>
                        <UserCircle2 size={18} />
                      </div>
                    )}
                    <span className="min-w-0">
                      <span className="block text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Organiza</span>
                      <span className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200 truncate">{raffle.organizer_name}</span>
                    </span>
                  </button>
                )}

                <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Valor por número</span>
                  <span className="font-mono text-lg font-bold" style={{ color: 'var(--theme-c1)' }}>${raffle.price_per_ticket}</span>
                </div>

                {isEnded ? (
                  <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl text-center">
                    <h3 className="text-red-600 dark:text-red-500 font-bold text-sm tracking-widest uppercase">Sorteo finalizado</h3>
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2 text-center">Cierra en</p>
                    <div className="grid grid-cols-4 gap-2">
                      <TimeBlock value={timeLeft.d} label="Días" />
                      <TimeBlock value={timeLeft.h} label="Horas" />
                      <TimeBlock value={timeLeft.m} label="Minutos" />
                      <TimeBlock value={timeLeft.s} label="Segundos" />
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer: QR que enlaza directo a esta rifa, útil para compartir en flyers/pantallas */}
      <footer className="max-w-6xl mx-auto px-4 pb-28">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-5 rounded-3xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-800">
          <div className="p-2 bg-white rounded-xl shrink-0">
            <TicketQRCode value={raffleUrl} size={88} />
          </div>
          <div className="text-center sm:text-left">
            <p className="font-bold text-sm text-zinc-700 dark:text-zinc-200">Escanea para abrir esta rifa</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Ideal para compartir en flyers, redes o pantallas.</p>
          </div>
        </div>
      </footer>

      {/* Barra flotante: resumen de la rifa cuando no hay selección, controles de reserva cuando sí la hay */}
      {!isEnded && (
        <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40">
          <div ref={barContentRef} className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl pl-3 pr-3 py-2.5 sm:pl-4 sm:pr-4 sm:py-3">
            {selectedNumbers.size === 0 ? (
              <div className="flex items-stretch divide-x divide-zinc-200 dark:divide-zinc-800">
                <div className="flex flex-col items-center px-4 sm:px-6">
                  <span className="font-mono font-extrabold text-lg text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, var(--theme-c1), var(--theme-c2))' }}>
                    {availableCount ?? '—'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mt-0.5 whitespace-nowrap">Disponibles</span>
                </div>
                <div className="flex flex-col items-center px-4 sm:px-6">
                  <span className="font-mono font-extrabold text-lg text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, var(--theme-c1), var(--theme-c2))' }}>
                    ${raffle.price_per_ticket}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mt-0.5 whitespace-nowrap">Por número</span>
                </div>
                <div className="flex flex-col items-center px-4 sm:px-6">
                  <span className="font-mono font-extrabold text-lg text-transparent bg-clip-text whitespace-nowrap" style={{ backgroundImage: 'linear-gradient(135deg, var(--theme-c1), var(--theme-c2))' }}>
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
                  onClick={() => { setPurchaseStatus(''); setPurchasedTickets(null); setShowReserveModal(true); }}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-[var(--theme-c1)] text-white font-bold rounded-xl hover:brightness-90 shadow-lg transition-all active:scale-95 whitespace-nowrap"
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
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => !submitting && setShowReserveModal(false)}></div>
          <div className="relative min-h-full flex items-center justify-center p-4">
          <div className="relative bg-white dark:bg-zinc-900 p-8 rounded-3xl max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 transform transition-all my-8">

            {purchasedTickets ? (
              <>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3">
                    <CheckCircle2 size={28} />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">¡Boletos reservados!</h2>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                    Guarda el enlace de cada boleto — es tu comprobante digital.
                  </p>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto mb-6">
                  {purchasedTickets.map(t => (
                    <a
                      key={t.code}
                      href={`/ticket/${t.code}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                    >
                      <span className="font-mono font-bold text-blue-500">#{t.number.toString().padStart(pad, '0')}</span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        Ver boleto <ExternalLink size={12} />
                      </span>
                    </a>
                  ))}
                </div>

                <button
                  onClick={() => { setShowReserveModal(false); setPurchasedTickets(null); }}
                  className="w-full py-3 bg-[var(--theme-c1)] text-white font-bold rounded-xl hover:brightness-90 shadow-lg transition-all active:scale-95"
                >
                  Listo
                </button>
              </>
            ) : (
              <>
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
                    <span key={num} className="flex items-center gap-1 font-mono text-xs font-bold pl-2 pr-1 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-blue-500">
                      #{num.toString().padStart(pad, '0')}
                      <button
                        type="button"
                        onClick={() => removeSelectedNumber(num)}
                        title="Quitar número"
                        className="p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <X size={11} />
                      </button>
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

                  {raffle.allow_seller_selection && sellers.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300">¿Quién te atendió? (Opcional)</label>
                      <select
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                        value={selectedSellerCode} onChange={e => setSelectedSellerCode(e.target.value)}
                      >
                        <option value="">Sin vendedor / No sé</option>
                        {sellers.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                      </select>
                    </div>
                  )}

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
                    <button type="submit" disabled={submitting || sortedSelection.length === 0} className="flex-1 px-4 py-3 bg-[var(--theme-c1)] text-white font-bold rounded-xl hover:brightness-90 shadow-lg transition-all active:scale-95 disabled:opacity-50">
                      Reservar
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
          </div>
        </div>
      )}

      {/* Modal de selección al azar */}
      {showRandomModal && !isEnded && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => !randomLoading && setShowRandomModal(false)}></div>
          <div className="relative min-h-full flex items-center justify-center p-4">
          <div className="relative bg-white dark:bg-zinc-900 p-8 rounded-3xl max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 transform transition-all my-8">

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
                      style={randomQuantity === n ? { background: 'linear-gradient(135deg, var(--theme-c1), var(--theme-c2))' } : undefined}
                      className={`flex flex-col items-center justify-center gap-1 py-5 rounded-2xl font-bold transition-all ${
                        randomQuantity === n
                          ? 'text-white shadow-lg scale-[1.02]'
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
                  className="w-full py-3 bg-[var(--theme-c1)] text-white font-bold rounded-xl hover:brightness-90 shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
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
                    <span key={num} className="flex items-center gap-1 font-mono text-xs font-bold pl-2 pr-1 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-blue-500">
                      #{num.toString().padStart(pad, '0')}
                      <button
                        type="button"
                        onClick={() => removeRandomNumber(num)}
                        title="Quitar número"
                        className="p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <X size={11} />
                      </button>
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
                    disabled={randomNumbers.length === 0}
                    className="flex-1 px-4 py-3 bg-[var(--theme-c1)] text-white font-bold rounded-xl hover:brightness-90 shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    Continuar
                  </button>
                </div>
              </>
            )}
          </div>
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
