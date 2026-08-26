import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Phone, Ticket, Copy, Check, Trash2, StickyNote, Receipt, ImagePlus } from 'lucide-react';

const STATUS_OPTIONS = [
  {
    value: 'reserved', label: 'Apartado', dot: 'bg-blue-500',
    active: 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20',
    inactive: 'bg-white dark:bg-zinc-900 border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30',
  },
  {
    value: 'reviewing', label: 'Revisando', dot: 'bg-amber-500',
    active: 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20',
    inactive: 'bg-white dark:bg-zinc-900 border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30',
  },
  {
    value: 'paid', label: 'Validado', dot: 'bg-emerald-500',
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

export default function ParticipantModal({ raffleId, ticket, pad, pricePerTicket, onClose, onUpdated, onDelete, showAlert }) {
  const [localTicket, setLocalTicket] = useState(ticket);
  const [savingStatus, setSavingStatus] = useState(false);
  const [notes, setNotes] = useState(ticket.admin_notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sellers, setSellers] = useState([]);
  const [savingSeller, setSavingSeller] = useState(false);

  const notesDirty = notes !== (localTicket.admin_notes || '');
  const ticketUrl = localTicket.ticket_code ? `${window.location.origin}/ticket/${localTicket.ticket_code}` : null;

  useEffect(() => {
    fetch(`/api/admin_get_sellers.php?raffle_id=${raffleId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (data.success) setSellers(data.sellers); })
      .catch(() => {});
  }, [raffleId]);

  const handleSellerChange = async (value) => {
    const sellerId = value === '' ? null : parseInt(value, 10);
    setSavingSeller(true);
    try {
      const res = await fetch('/api/admin_update_ticket_seller.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ raffle_id: raffleId, ticket_number: localTicket.ticket_number, seller_id: sellerId }),
      });
      const data = await res.json();
      if (data.success) {
        const seller = sellers.find(s => s.id === sellerId);
        setLocalTicket(prev => ({ ...prev, seller_id: sellerId, seller_name: seller?.name || null }));
        onUpdated();
      } else {
        showAlert?.('Error', data.error || 'No se pudo actualizar el vendedor', 'alert');
      }
    } catch { showAlert?.('Error', 'Error de conexión', 'alert'); }
    setSavingSeller(false);
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === localTicket.status || savingStatus) return;
    setSavingStatus(true);
    try {
      const res = await fetch('/api/admin_mark_paid.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ raffle_id: raffleId, ticket_number: localTicket.ticket_number, new_status: newStatus }),
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

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await fetch('/api/admin_update_ticket_notes.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ raffle_id: raffleId, ticket_number: localTicket.ticket_number, admin_notes: notes }),
      });
      const data = await res.json();
      if (data.success) {
        setLocalTicket(prev => ({ ...prev, admin_notes: notes }));
        onUpdated();
      } else {
        showAlert?.('Error', data.error || 'No se pudo guardar la nota', 'alert');
      }
    } catch { showAlert?.('Error', 'Error de conexión', 'alert'); }
    setSavingNotes(false);
  };

  const handleReceiptPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    try {
      const fd = new FormData();
      fd.append('raffle_id', raffleId);
      fd.append('ticket_number', localTicket.ticket_number);
      fd.append('image', file);
      const res = await fetch('/api/admin_upload_ticket_receipt.php', { method: 'POST', credentials: 'include', body: fd });
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

  const handleDelete = async () => {
    setDeleting(true);
    const deleted = await onDelete(localTicket.ticket_number, localTicket.buyer_name);
    setDeleting(false);
    if (deleted) onClose();
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
              <dt className="font-semibold text-zinc-500 dark:text-zinc-400">Números</dt>
              <dd className="font-mono font-bold text-zinc-900 dark:text-white">{localTicket.ticket_number.toString().padStart(pad, '0')}</dd>
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
              <dd className="font-mono font-bold text-emerald-600 dark:text-emerald-400">${pricePerTicket}</dd>
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
                <a href={`tel:${localTicket.buyer_phone}`} title="Llamar" className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
                  <Phone size={14} />
                </a>
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="font-semibold text-zinc-500 dark:text-zinc-400">Email</dt>
              <dd className="text-right text-zinc-700 dark:text-zinc-300 truncate max-w-[60%]">{localTicket.buyer_email || 'Sin correo'}</dd>
            </div>
            <div className="flex justify-between items-center gap-3">
              <dt className="font-semibold text-zinc-500 dark:text-zinc-400">Vendedor</dt>
              <dd>
                <select
                  value={localTicket.seller_id ?? ''}
                  onChange={e => handleSellerChange(e.target.value)}
                  disabled={savingSeller}
                  className="text-sm font-semibold text-right rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
                >
                  <option value="">No tiene</option>
                  {sellers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </dd>
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

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 mb-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              <StickyNote size={15} /> Notas privadas
            </p>
            <textarea
              rows={2}
              placeholder="Agregar notas"
              className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm resize-none"
              value={notes} onChange={e => setNotes(e.target.value)}
            />
            {notesDirty && (
              <button
                onClick={handleSaveNotes} disabled={savingNotes}
                className="mt-2 px-3 py-1.5 text-xs font-bold rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 disabled:opacity-50"
              >
                {savingNotes ? 'Guardando...' : 'Guardar nota'}
              </button>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 mb-6">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              <Receipt size={15} /> Comprobante
            </p>
            {localTicket.receipt_image ? (
              <div className="flex items-center gap-3">
                <img src={localTicket.receipt_image} alt="Comprobante" className="w-16 h-16 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800" />
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-500 cursor-pointer hover:text-blue-600">
                  {uploadingReceipt ? 'Subiendo...' : 'Reemplazar'}
                  <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleReceiptPick} disabled={uploadingReceipt} />
                </label>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">No se ha subido un comprobante.</p>
                  <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Los participantes no pueden subir comprobantes todavía.</p>
                </div>
                <label className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-pointer hover:border-blue-400 hover:text-blue-500 transition-colors">
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
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
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
            <button
              onClick={handleDelete} disabled={deleting}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-bold rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              <Trash2 size={15} /> Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
