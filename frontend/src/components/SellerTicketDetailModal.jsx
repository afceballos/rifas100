import React, { useState } from 'react';
import { X, MessageCircle, Phone, Ticket, Copy, Check, Receipt, ImagePlus, ZoomIn } from 'lucide-react';
import ImageLightbox from './ImageLightbox';

const STATUS_OPTIONS = [
  {
    value: 'reserved', label: 'Apartado', dot: 'bg-lime-500',
    active: 'bg-lime-600 border-lime-600 text-white shadow-md shadow-lime-500/20',
    inactive: 'bg-white dark:bg-zinc-900 border-lime-200 dark:border-lime-900/50 text-lime-600 dark:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-950/30',
  },
  {
    value: 'reviewing', label: 'Revisando', dot: 'bg-amber-500',
    active: 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20',
    inactive: 'bg-white dark:bg-zinc-900 border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30',
  },
  {
    value: 'paid', label: 'Aprobado', dot: 'bg-emerald-500',
    active: 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20',
    inactive: 'bg-white dark:bg-zinc-900 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
  },
];

const formatRegistro = (value) => {
  if (!value) return '';
  const d = new Date(value.replace(/-/g, '/'));
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${d.getFullYear()} ${hh}:${mm}`;
};

export default function SellerTicketDetailModal({ ticket, pad, pricePerTicket, onClose, onUpdated, showAlert }) {
  const [localTicket, setLocalTicket] = useState(ticket);
  const [savingStatus, setSavingStatus] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showReceiptLightbox, setShowReceiptLightbox] = useState(false);

  const ticketUrl = localTicket.ticket_code ? `${window.location.origin}/ticket/${localTicket.ticket_code}` : null;

  const handleStatusChange = async (newStatus) => {
    if (newStatus === localTicket.status || savingStatus) return;
    setSavingStatus(true);
    try {
      const res = await fetch('/api/seller_update_ticket_status.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ticket_numbers: localTicket.ticket_numbers, new_status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setLocalTicket(prev => ({ ...prev, status: newStatus }));
        onUpdated();
      } else {
        showAlert?.('Error', data.error || 'No se pudo actualizar el estado', 'alert');
      }
    } catch { showAlert?.('Error', 'Error de conexión', 'alert'); }
    setSavingStatus(false);
  };

  const handleReceiptPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    try {
      const fd = new FormData();
      fd.append('ticket_code', localTicket.ticket_code);
      fd.append('image', file);
      const res = await fetch('/api/seller_upload_ticket_receipt.php', { method: 'POST', credentials: 'include', body: fd });
      const data = await res.json();
      if (data.success) {
        setLocalTicket(prev => ({ ...prev, receipt_image: data.receipt_image }));
        onUpdated();
      } else {
        showAlert?.('Error', data.error || 'No se pudo subir el comprobante', 'alert');
      }
    } catch { showAlert?.('Error', 'Error de conexión', 'alert'); }
    setUploadingReceipt(false);
  };

  const handleCopyLink = async () => {
    if (!ticketUrl) return;
    try {
      await navigator.clipboard.writeText(ticketUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch { /* clipboard no disponible */ }
  };

  const waLink = localTicket.buyer_phone ? `https://wa.me/${localTicket.buyer_phone.replace(/\D/g, '')}` : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative min-h-full flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-zinc-900 p-8 rounded-3xl max-w-sm w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 my-8">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Detalles</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
              <X size={20} />
            </button>
          </div>

          <dl className="space-y-3 text-sm mb-6">
            <div className="flex justify-between gap-3">
              <dt className="font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">Números</dt>
              <dd className="flex flex-wrap justify-end gap-1">
                {localTicket.ticket_numbers.map(n => (
                  <span key={n} className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-lime-50 dark:bg-lime-500/10 text-zinc-900 dark:text-white">
                    {n.toString().padStart(pad, '0')}
                  </span>
                ))}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="font-semibold text-zinc-500 dark:text-zinc-400">Nombre</dt>
              <dd className="font-semibold text-right text-zinc-900 dark:text-white">{localTicket.buyer_name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="font-semibold text-zinc-500 dark:text-zinc-400">Registro</dt>
              <dd className="text-right text-zinc-700 dark:text-zinc-300">{formatRegistro(localTicket.created_at)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="font-semibold text-zinc-500 dark:text-zinc-400">Valor</dt>
              <dd className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ${(pricePerTicket * localTicket.ticket_numbers.length).toFixed(2)}
                {localTicket.ticket_numbers.length > 1 && (
                  <span className="text-zinc-400 dark:text-zinc-500 font-normal"> ({localTicket.ticket_numbers.length} × ${pricePerTicket})</span>
                )}
              </dd>
            </div>
            <div className="flex justify-between items-center gap-3">
              <dt className="font-semibold text-zinc-500 dark:text-zinc-400">Tel.</dt>
              <dd className="flex items-center gap-2">
                <span className="font-mono text-zinc-700 dark:text-zinc-300">{localTicket.buyer_phone}</span>
                {waLink && (
                  <a href={waLink} target="_blank" rel="noreferrer" title="WhatsApp" className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors">
                    <MessageCircle size={14} />
                  </a>
                )}
                <a href={`tel:${localTicket.buyer_phone}`} title="Llamar" className="p-1.5 rounded-lg bg-lime-50 dark:bg-lime-500/10 text-lime-600 dark:text-lime-400 hover:bg-lime-100 dark:hover:bg-lime-500/20 transition-colors">
                  <Phone size={14} />
                </a>
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="font-semibold text-zinc-500 dark:text-zinc-400">Email</dt>
              <dd className="text-right text-zinc-700 dark:text-zinc-300 truncate max-w-[60%]">{localTicket.buyer_email || 'Sin correo'}</dd>
            </div>
          </dl>

          <div className="grid grid-cols-3 gap-2 mb-6">
            {STATUS_OPTIONS.map(opt => {
              const active = localTicket.status === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  disabled={savingStatus}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition-all disabled:opacity-50 ${active ? opt.active : opt.inactive}`}
                >
                  <span className={`w-2 h-2 rounded-full ${active ? 'bg-white' : opt.dot}`} />
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 mb-6">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              <Receipt size={15} /> Comprobante
            </p>
            {localTicket.receipt_image ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowReceiptLightbox(true)}
                  title="Ver comprobante"
                  className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 group"
                >
                  <img src={localTicket.receipt_image} alt="Comprobante" className="w-full h-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                    <ZoomIn size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </button>
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-lime-500 cursor-pointer hover:text-lime-600">
                  {uploadingReceipt ? 'Subiendo...' : 'Reemplazar'}
                  <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleReceiptPick} disabled={uploadingReceipt} />
                </label>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">No se ha subido un comprobante.</p>
                <label className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-pointer hover:border-lime-400 hover:text-lime-500 transition-colors">
                  {uploadingReceipt ? <span className="text-[10px]">...</span> : <ImagePlus size={16} />}
                  <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleReceiptPick} disabled={uploadingReceipt} />
                </label>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {ticketUrl && (
              <a
                href={ticketUrl} target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold rounded-xl bg-lime-50 dark:bg-lime-500/10 text-lime-600 dark:text-lime-400 hover:bg-lime-100 dark:hover:bg-lime-500/20 transition-colors"
              >
                <Ticket size={15} /> Abrir ticket
              </a>
            )}
            <button
              onClick={handleCopyLink} disabled={!ticketUrl}
              title="Copiar enlace"
              className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-40"
            >
              {linkCopied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
            </button>
          </div>
        </div>
      </div>

      {showReceiptLightbox && (
        <ImageLightbox src={localTicket.receipt_image} alt="Comprobante" onClose={() => setShowReceiptLightbox(false)} />
      )}
    </div>
  );
}
