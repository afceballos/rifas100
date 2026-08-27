import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import ThemeToggle from './ThemeToggle';
import NotFound from './NotFound';
import TicketQRCode from './TicketQRCode';
import PaymentInfoModal from './PaymentInfoModal';
import AccountMenuSection from './AccountMenuSection';
import { Ticket, Copy, Check, CreditCard, ArrowUpRight, Download, Loader2, Menu, Upload, Image as ImageIcon, Share2 } from 'lucide-react';
import TicketMark from './landing/TicketMark';

gsap.registerPlugin(useGSAP);

const formatLongDate = (value) => {
  if (!value) return '';
  const d = new Date(value.replace(/-/g, '/'));
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
};

const Divider = () => <div className="border-t-2 border-dashed border-zinc-200 dark:border-zinc-800 my-6" />;

// APARTADO = azul (recién reservado), REVISANDO = ámbar (comprobante en revisión), PAGADO = esmeralda (confirmado)
const STATUS_BADGE_CLASSES = {
  APARTADO: 'bg-lime-100 text-lime-700 dark:bg-lime-500/10 dark:text-lime-400',
  REVISANDO: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  PAGADO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
};
const STATUS_PULSE_CLASSES = {
  APARTADO: 'bg-lime-400',
  REVISANDO: 'bg-amber-400',
  PAGADO: 'bg-emerald-400',
};
const STATUS_CHIP_CLASSES = {
  APARTADO: 'bg-lime-50 dark:bg-lime-950/30 border-lime-200 dark:border-lime-900/50 text-lime-600 dark:text-lime-400',
  REVISANDO: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400',
  PAGADO: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400',
};

export default function TicketPage() {
  const { code } = useParams();
  const containerRef = useRef();
  const cardRef = useRef(null);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sharingReceipt, setSharingReceipt] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [me, setMe] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      const probe = new File(['x'], 'probe.png', { type: 'image/png' });
      setCanShareFiles(!!navigator.canShare && navigator.canShare({ files: [probe] }));
    } catch {
      setCanShareFiles(false);
    }
  }, []);

  const refreshTicket = () =>
    fetch(`/api/get_ticket.php?code=${encodeURIComponent(code)}`)
      .then(res => res.json())
      .then(data => { if (data.success) setTicket(data); })
      .catch(() => {});

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetch(`/api/get_ticket.php?code=${encodeURIComponent(code)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setTicket(data);
        else setNotFound(true);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [code]);

  useEffect(() => {
    fetch('/api/me.php', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setMe(data.success ? data : null))
      .catch(() => setMe(null));
  }, []);

  const ticketUrl = typeof window !== 'undefined' ? `${window.location.origin}/ticket/${code}` : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ticketUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard no disponible */ }
  };

  const handleReceiptFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError('');
    setUploadingReceipt(true);
    try {
      const formData = new FormData();
      formData.append('ticket_code', code);
      formData.append('image', file);
      const res = await fetch('/api/upload_ticket_receipt.php', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) await refreshTicket();
      else setUploadError(data.error || 'No se pudo subir el comprobante.');
    } catch {
      setUploadError('Error de conexión con el servidor.');
    }
    setUploadingReceipt(false);
  };

  const handleDownloadPdf = async () => {
    if (!cardRef.current || downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      // Carga diferida: jsPDF/html2canvas solo se descargan si de verdad se usa el botón.
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#ffffff', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      const numbersLabel = ticket.ticket_numbers.map(n => n.toString().padStart(pad, '0')).join('-');
      pdf.save(`comprobante-boleto-${numbersLabel}.pdf`);
    } catch (err) {
      console.error(err);
    }
    setDownloadingPdf(false);
  };

  const handleShareReceipt = async () => {
    if (!cardRef.current || sharingReceipt) return;
    setSharingReceipt(true);
    try {
      const { default: html2canvas } = await import('html2canvas-pro');
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#ffffff', scale: 2 });
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('No se pudo generar la imagen');
      const numbersLabel = ticket.ticket_numbers.map(n => n.toString().padStart(pad, '0')).join('-');
      const file = new File([blob], `boleto-${numbersLabel}.png`, { type: 'image/png' });
      await navigator.share({
        files: [file],
        title: ticket.raffle.title,
        text: `Mi boleto para "${ticket.raffle.title}" — número${ticket.ticket_numbers.length > 1 ? 's' : ''} ${ticket.ticket_numbers.map(n => '#' + n.toString().padStart(pad, '0')).join(', ')}.`,
      });
    } catch (err) {
      if (err?.name !== 'AbortError') console.error(err);
    }
    setSharingReceipt(false);
  };

  useGSAP(() => {
    if (!ticket) return;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo('.ticket-card', { y: 40, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.6 })
      .fromTo('.ticket-reveal', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.08 }, '-=0.3');

    if (ticket.status !== 'PAGADO') {
      gsap.to('.status-pulse', { scale: 1.25, opacity: 0, duration: 1.4, repeat: -1, ease: 'sine.out' });
    }
  }, { dependencies: [ticket], scope: containerRef });

  const pad = ticket ? Math.max(2, String(Math.max(0, (ticket.raffle.number_start || 0) + ticket.raffle.total_tickets - 1)).length) : 2;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans bg-zinc-50 dark:bg-zinc-950">
        <div className="animate-pulse flex items-center gap-2"><Ticket className="animate-spin text-lime-500" /> Cargando boleto...</div>
      </div>
    );
  }

  if (notFound || !ticket) return <NotFound variant="not_found" />;

  return (
    <div className="min-h-screen font-sans" ref={containerRef}>
      <nav className="w-full p-4 flex justify-between items-center max-w-6xl mx-auto">
        <Link to="/" className="flex items-center gap-2 font-mono font-bold text-xl tracking-tight">
          <TicketMark className="h-6 w-auto text-raffle-greenDark dark:text-raffle-green" />
          <span>TICKET<span className="text-raffle-greenDark dark:text-raffle-green">100</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {me && (
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
                    <AccountMenuSection me={me} raffleSlug={ticket?.raffle?.slug} onClose={() => setShowMenu(false)} onLoggedOut={() => setMe(null)} />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-md mx-auto px-4 pb-16 pt-4">
        <div className="ticket-card relative" ref={cardRef}>
          {/* Encabezado degradado */}
          <div className="relative bg-gradient-to-br from-lime-500 to-lime-600 rounded-t-3xl px-8 pt-8 pb-10 text-center overflow-hidden">
            <p className="text-white font-extrabold text-lg tracking-tight uppercase">{ticket.raffle.title}</p>
            <p className="text-white/80 text-sm font-medium mt-1">{formatLongDate(ticket.raffle.draw_date)}</p>
          </div>

          {/* Muescas estilo boleto físico: viven en la costura entre encabezado y cuerpo */}
          <div className="relative h-0 flex justify-between z-10 pointer-events-none">
            <div className="w-6 h-6 rounded-full bg-zinc-50 dark:bg-[#09090b] -translate-x-3 -translate-y-1/2" />
            <div className="w-6 h-6 rounded-full bg-zinc-50 dark:bg-[#09090b] translate-x-3 -translate-y-1/2" />
          </div>

          {/* Cuerpo blanco */}
          <div className="bg-white dark:bg-zinc-900 rounded-b-3xl shadow-2xl border border-t-0 border-zinc-200 dark:border-zinc-800 px-8 pt-10 pb-8">

            <div className="ticket-reveal flex justify-center mb-2">
              <div className="p-3 bg-white rounded-2xl border border-zinc-100 shadow-sm">
                <TicketQRCode value={ticketUrl} size={180} />
              </div>
            </div>

            <div className="ticket-reveal text-center">
              <p className="font-mono text-xs font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-lime-500 to-lime-600 uppercase break-all">
                {code}
              </p>
              <button
                onClick={handleCopy}
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-lime-500 transition-colors break-all"
              >
                {copied ? <Check size={12} className="text-emerald-500 shrink-0" /> : <Copy size={12} className="shrink-0" />}
                {ticketUrl}
              </button>
            </div>

            <Divider />

            <div className="ticket-reveal text-center">
              <p className="font-bold text-xl text-zinc-900 dark:text-white">{ticket.buyer_name}</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">Tel. {ticket.buyer_phone}</p>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                {ticket.ticket_numbers.map(n => (
                  <span key={n} className="font-mono font-extrabold text-lg px-4 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white">
                    #{n.toString().padStart(pad, '0')}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-center mt-3">
                <span className="relative inline-flex">
                  {ticket.status !== 'PAGADO' && (
                    <span className={`status-pulse absolute inset-0 rounded-xl ${STATUS_PULSE_CLASSES[ticket.status]}`} />
                  )}
                  <span className={`relative font-bold text-sm px-4 py-1.5 rounded-xl ${STATUS_BADGE_CLASSES[ticket.status]}`}>
                    {ticket.status}
                  </span>
                </span>
              </div>

              {ticket.status === 'APARTADO' && (
                <p className="text-xs font-semibold text-lime-600 dark:text-lime-400 mt-3 uppercase tracking-wide">
                  {ticket.ticket_numbers.length > 1 ? 'Estos números están reservados temporalmente.' : 'Este número está reservado temporalmente.'}
                </p>
              )}
              {ticket.status === 'REVISANDO' && (
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-3 uppercase tracking-wide">
                  Tu comprobante está siendo revisado por el organizador.
                </p>
              )}
            </div>

            {ticket.other_tickets.length > 0 && (
              <>
                <Divider />
                <div className="ticket-reveal">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2 text-center">
                    Otros números de {ticket.buyer_name.split(' ')[0]}
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {ticket.other_tickets.map(t => (
                      <Link
                        key={t.code}
                        to={`/ticket/${t.code}`}
                        className={`flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${STATUS_CHIP_CLASSES[t.status]}`}
                      >
                        #{t.ticket_number.toString().padStart(pad, '0')} <ArrowUpRight size={11} />
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Divider />

            <button
              onClick={() => setShowPaymentModal(true)}
              className="ticket-reveal w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-lime-500 to-lime-600 text-white font-bold rounded-2xl shadow-lg shadow-lime-500/30 hover:shadow-xl hover:shadow-lime-500/40 transition-all active:scale-95"
            >
              <CreditCard size={18} /> Pagar
            </button>

            {ticket.raffle.receipt_upload_enabled && ticket.status !== 'PAGADO' && (
              <div className="ticket-reveal mt-2.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleReceiptFileChange}
                />
                {ticket.receipt_image ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-lime-200 dark:border-lime-900/50 bg-lime-50 dark:bg-lime-950/30 px-4 py-3">
                    <a
                      href={ticket.receipt_image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-semibold text-lime-700 dark:text-lime-400 min-w-0"
                    >
                      <ImageIcon size={16} className="shrink-0" />
                      <span className="truncate">Ver comprobante subido</span>
                    </a>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingReceipt}
                      className="shrink-0 text-xs font-semibold text-zinc-500 hover:text-lime-600 dark:text-zinc-400 disabled:opacity-50"
                    >
                      {uploadingReceipt ? 'Subiendo...' : 'Reemplazar'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingReceipt}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-lime-400 hover:text-lime-600 dark:hover:text-lime-400 transition-colors disabled:opacity-50"
                  >
                    {uploadingReceipt ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                    {uploadingReceipt ? 'Subiendo comprobante...' : 'Subir comprobante de pago'}
                  </button>
                )}
                {uploadError && (
                  <p className="text-xs text-red-500 mt-1.5 text-center">{uploadError}</p>
                )}
              </div>
            )}

            <div className="ticket-reveal flex gap-2 mt-2.5">
              {canShareFiles && (
                <button
                  onClick={handleShareReceipt}
                  disabled={sharingReceipt}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors disabled:opacity-50"
                >
                  {sharingReceipt ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} />}
                  {sharingReceipt ? 'Preparando...' : 'Compartir'}
                </button>
              )}
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors disabled:opacity-50"
              >
                {downloadingPdf ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                {downloadingPdf ? 'Generando...' : canShareFiles ? 'PDF' : 'Descargar comprobante (PDF)'}
              </button>
            </div>

            <Divider />

            <div className="ticket-reveal text-center">
              <p className="font-bold text-sm text-zinc-900 dark:text-white">{ticket.raffle.title}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Organizado por <span className="font-semibold text-zinc-700 dark:text-zinc-300">{ticket.raffle.organizer_name || 'Ticket100'}</span>
              </p>
              <Link to={`/sorteo/${ticket.raffle.slug}`} className="inline-flex items-center gap-1 text-xs font-semibold text-lime-500 hover:text-lime-600 mt-2">
                Ver sorteo completo <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed mt-6 px-2">
          Esta página representa tu boleto digital y muestra el estado actual de tu participación en el sorteo.
          Ticket100 únicamente provee el talonario digital; cada persona es responsable de decidir su participación
          bajo las condiciones presentadas por el organizador.
        </p>
      </div>

      {showPaymentModal && (
        <PaymentInfoModal raffle={ticket.raffle} onClose={() => setShowPaymentModal(false)} />
      )}
    </div>
  );
}
