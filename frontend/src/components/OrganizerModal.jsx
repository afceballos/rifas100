import React from 'react';
import { X, UserCircle2, ShieldCheck, Phone, Mail } from 'lucide-react';

export default function OrganizerModal({ raffle, onClose }) {
  const hasContact = raffle?.organizer_phone || raffle?.organizer_email;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative min-h-full flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-zinc-900 p-8 rounded-3xl max-w-sm w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 my-8">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Organizador</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center text-center gap-4">
          {raffle?.organizer_photo ? (
            <img src={raffle.organizer_photo} alt={raffle.organizer_name || 'Organizador'} className="w-24 h-24 rounded-full object-cover border border-zinc-200 dark:border-zinc-800 shadow-sm" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              {raffle?.organizer_name ? <UserCircle2 size={44} /> : <ShieldCheck size={40} />}
            </div>
          )}
          <div>
            <p className="font-bold text-lg text-zinc-900 dark:text-white">
              {raffle?.organizer_name || 'Organizador no especificado'}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Responsable de este sorteo en TicketVault.
            </p>
          </div>

          {hasContact && (
            <div className="w-full space-y-2 pt-2">
              {raffle.organizer_phone && (
                <a
                  href={`tel:${raffle.organizer_phone}`}
                  className="flex items-center gap-3 w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500 transition-colors text-left"
                >
                  <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                    <Phone size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs text-zinc-400 uppercase tracking-widest font-bold">Llamar</span>
                    <span className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200 truncate">{raffle.organizer_phone}</span>
                  </span>
                </a>
              )}
              {raffle.organizer_email && (
                <a
                  href={`mailto:${raffle.organizer_email}`}
                  className="flex items-center gap-3 w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500 transition-colors text-left"
                >
                  <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                    <Mail size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs text-zinc-400 uppercase tracking-widest font-bold">Escribir</span>
                    <span className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200 truncate">{raffle.organizer_email}</span>
                  </span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
