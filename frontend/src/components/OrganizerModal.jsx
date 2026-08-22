import React from 'react';
import { X, UserCircle2, ShieldCheck } from 'lucide-react';

export default function OrganizerModal({ raffle, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-zinc-900 p-8 rounded-3xl max-w-sm w-full shadow-2xl border border-zinc-200 dark:border-zinc-800">
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
        </div>
      </div>
    </div>
  );
}
