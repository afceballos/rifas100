import React, { useState } from 'react';
import { X, Banknote, Building2, CreditCard, Copy, Check, ExternalLink } from 'lucide-react';
import { parsePaymentMethods } from '../utils/paymentInfo';

const methodIcon = (method) => {
  const m = (method || '').toLowerCase();
  if (m.includes('efectivo')) return Banknote;
  if (m.includes('transferencia') || m.includes('móvil') || m.includes('movil') || m.includes('banco')) return Building2;
  return CreditCard;
};

const CopyButton = ({ value }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard no disponible */ }
  };
  return (
    <button type="button" onClick={handleCopy} title="Copiar" className="p-1 text-zinc-400 hover:text-lime-500 transition-colors shrink-0">
      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
    </button>
  );
};

export default function PaymentInfoModal({ raffle, onClose }) {
  const methods = parsePaymentMethods(raffle?.payment_info);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative min-h-full flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-zinc-900 p-8 rounded-3xl max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 my-8">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Pagos</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {raffle?.online_payment_link && (
          <a
            href={raffle.online_payment_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 mb-4 rounded-2xl bg-gradient-to-r from-lime-500 to-lime-600 text-white font-bold shadow-lg shadow-lime-500/30 hover:shadow-xl hover:shadow-lime-500/40 transition-all active:scale-95"
          >
            <CreditCard size={18} /> Pagar en línea <ExternalLink size={15} className="opacity-70" />
          </a>
        )}

        {methods.length > 0 ? (
          <div className="space-y-3 mb-6">
            {methods.map((pm, i) => {
              const Icon = methodIcon(pm.method);
              return (
                <div key={i} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-lime-500 shrink-0">
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-900 dark:text-white">{pm.institution || pm.method}</p>
                      {pm.institution && <p className="text-xs text-zinc-500 dark:text-zinc-400">{pm.method}</p>}
                    </div>
                  </div>
                  {pm.details?.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {pm.details.map((d, j) => (
                        <div key={j} className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-zinc-500 dark:text-zinc-400">{d.type}</span>
                          <span className="flex items-center gap-1.5 font-mono font-semibold">
                            {d.value} <CopyButton value={d.value} />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {pm.description && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">{pm.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-dashed border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500 dark:text-zinc-400 text-center mb-6">
            El organizador aún no configuró métodos de pago.
          </div>
        )}

        <div className="text-center pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold mb-1">Valor del número</p>
          <p className="text-2xl font-mono font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-lime-500 to-lime-600">
            ${raffle?.price_per_ticket}
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
