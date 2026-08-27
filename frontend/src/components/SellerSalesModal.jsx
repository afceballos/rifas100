import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

const STATUS_PILL = {
  reserved: { label: 'APARTADO', cls: 'bg-lime-100 text-lime-700 dark:bg-lime-500/10 dark:text-lime-400' },
  reviewing: { label: 'REVISANDO', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
  paid: { label: 'VALIDADO', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
};

export default function SellerSalesModal({ raffleId, seller, pad, onClose }) {
  const [tickets, setTickets] = useState(null);

  useEffect(() => {
    fetch(`/api/admin_get_seller_tickets.php?raffle_id=${raffleId}&seller_id=${seller.id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setTickets(data.success ? data.tickets : []))
      .catch(() => setTickets([]));
  }, [raffleId, seller.id]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative min-h-full flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-zinc-900 p-8 rounded-3xl max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 my-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Números vendidos</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{seller.name} · {seller.code}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {tickets === null ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-lime-500" size={24} />
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-dashed border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500 dark:text-zinc-400 text-center">
            Este vendedor todavía no tiene números vendidos.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tickets.map(t => (
              <div key={t.ticket_number} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                <div className="min-w-0">
                  <span className="font-mono font-bold text-lime-500">#{t.ticket_number.toString().padStart(pad, '0')}</span>
                  {t.buyer_name && <span className="block text-xs text-zinc-500 dark:text-zinc-400 truncate">{t.buyer_name}</span>}
                </div>
                <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_PILL[t.status]?.cls}`}>
                  {STATUS_PILL[t.status]?.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
