import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowLeft, RefreshCw, Eraser, CheckCircle2, Clock, Trash2 } from 'lucide-react';

const pad = (n, d) => String(n).padStart(d, '0');

const statusStyles = {
  available: 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:border-blue-500',
  reserved:  'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/50 text-orange-600 dark:text-orange-400',
  paid:      'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400',
};

/**
 * Admin ticket grid for one raffle. Click cycles status: available → reserved → paid → available.
 * Right-click or long-press deletes the ticket.
 */
export default function RaffleEditor({ raffle, onBack }) {
  const root = useRef();
  const [tickets, setTickets] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);

  const digits = raffle.digits;
  const gridCols = raffle.total_tickets > 500 ? 'grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15'
                  : raffle.total_tickets > 100 ? 'grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12'
                  : 'grid-cols-5 sm:grid-cols-8 md:grid-cols-10';

  const load = async () => {
    setLoading(true);
    try {
      const [d1, d2] = await Promise.all([
        fetch(`/api/admin_get_tickets.php?raffle_id=${raffle.id}`).then(r => r.json()),
        fetch(`/api/admin_dashboard.php?raffle_id=${raffle.id}`).then(r => r.json()),
      ]);
      if (d1.success) setTickets(d1.tickets || []);
      if (d2.success) setBuyers(d2.buyers || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [raffle.id]);

  useGSAP(() => {
    if (tickets.length > 0) {
      gsap.fromTo('.ae-ticket',
        { y: 12, opacity: 0, scale: 0.92 },
        { y: 0, opacity: 1, scale: 1, duration: 0.25, stagger: 0.003, ease: 'power2.out' }
      );
    }
  }, { dependencies: [tickets], scope: root });

  const cycleStatus = async (t) => {
    const order = ['available', 'reserved', 'paid'];
    const next = order[(order.indexOf(t.status) + 1) % order.length];
    // Optimistic update
    setTickets(prev => prev.map(x => x.number === t.number ? { ...x, status: next } : x));
    try {
      await fetch('/api/admin_ticket_action.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_status',
          raffle_id: raffle.id,
          ticket_number: t.number,
          new_status: next,
        }),
      });
    } catch {
      load();
    }
  };

  const deleteTicket = async (t) => {
    if (!window.confirm(`¿Eliminar el boleto #${pad(t.number, digits)}? Esta acción no se puede deshacer.`)) return;
    setTickets(prev => prev.filter(x => x.number !== t.number));
    try {
      await fetch('/api/admin_ticket_action.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          raffle_id: raffle.id,
          ticket_number: t.number,
        }),
      });
    } catch {
      load();
    }
  };

  const counts = tickets.reduce(
    (acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; },
    { available: 0, reserved: 0, paid: 0 }
  );

  return (
    <div ref={root} className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
          <ArrowLeft size={16} /> Volver a rifas
        </button>
        <button onClick={load}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white ml-auto">
          <RefreshCw size={16} /> Refrescar
        </button>
      </div>

      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">{raffle.title}</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Click en un boleto para ciclar: disponible → reservado → pagado. Click derecho para eliminar.
        </p>
      </div>

      {/* counters */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Disponibles</div>
          <div className="text-2xl font-extrabold font-mono text-zinc-900 dark:text-white">{counts.available}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="text-xs uppercase tracking-wider text-orange-500">Reservados</div>
          <div className="text-2xl font-extrabold font-mono text-orange-500">{counts.reserved}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="text-xs uppercase tracking-wider text-emerald-500">Pagados</div>
          <div className="text-2xl font-extrabold font-mono text-emerald-500">{counts.paid}</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-zinc-500 py-12 animate-pulse">Cargando boletos...</div>
      ) : tickets.length === 0 ? (
        <div className="text-center text-zinc-500 py-12 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-3xl">
          Esta rifa aún no tiene boletos generados.
        </div>
      ) : (
        <div className={`grid ${gridCols} gap-2 sm:gap-3 p-4 rounded-3xl bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800`}>
          {tickets.map(t => (
            <button
              key={t.number}
              onClick={() => cycleStatus(t)}
              onContextMenu={(e) => { e.preventDefault(); deleteTicket(t); }}
              className={`ae-ticket h-12 sm:h-14 flex items-center justify-center rounded-xl font-mono text-sm sm:text-base font-bold border transition-all ${statusStyles[t.status]}`}
              title="Click: cambiar estado · Click derecho: eliminar"
            >
              {pad(t.number, digits)}
            </button>
          ))}
        </div>
      )}

      {/* buyers table for this raffle */}
      {buyers.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 font-bold">Compradores</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Num</th>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Contacto</th>
                  <th className="px-6 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {buyers.map(b => (
                  <tr key={b.ticket_number} className="border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
                    <td className="px-6 py-3 font-mono font-bold text-blue-500">#{pad(b.ticket_number, digits)}</td>
                    <td className="px-6 py-3 font-medium">{b.buyer_name}</td>
                    <td className="px-6 py-3 text-zinc-500">{b.buyer_phone}{b.buyer_email && <div className="text-xs">{b.buyer_email}</div>}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        b.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                             : 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400'}`}>
                        {b.status === 'paid' ? 'PAGADO' : 'PENDIENTE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
