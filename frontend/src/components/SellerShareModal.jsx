import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import TicketQRCode from './TicketQRCode';

export default function SellerShareModal({ seller, raffleUrl, pad = 2, onClose }) {
  const [copied, setCopied] = useState(false);
  const sellerUrl = `${raffleUrl}?seller=${seller.code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sellerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard no disponible */ }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative min-h-full flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-zinc-900 p-8 rounded-3xl max-w-sm w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 my-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">{seller.name}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">Código: {seller.code}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="p-3 bg-white rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <TicketQRCode value={sellerUrl} size={160} />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
            {seller.range_start != null
              ? `Comparte este enlace o código QR: solo mostrará los números ${String(seller.range_start).padStart(pad, '0')}–${String(seller.range_end).padStart(pad, '0')} que tiene asignados.`
              : 'Comparte este enlace o código QR: al no tener rango asignado, muestra todos los números de la rifa.'}
          </p>
          <div className="w-full">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-lg px-3 py-2 font-mono mb-2">
              {sellerUrl}
            </p>
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-xl bg-lime-600 text-white hover:bg-lime-700 transition-colors"
            >
              {copied ? <><Check size={15} /> Copiado</> : <><Copy size={15} /> Copiar enlace</>}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
