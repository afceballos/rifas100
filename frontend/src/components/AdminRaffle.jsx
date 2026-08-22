import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import Dialog from './Dialog';
import AdminRaffleSidebar from './AdminRaffleSidebar';
import ParticipantModal from './ParticipantModal';
import { DollarSign, Ticket, Clock, Eye as EyeIcon, CheckCircle2, ArrowLeft, Trash2, Search, ChevronLeft, ChevronRight, Info } from 'lucide-react';

const CircularProgress = ({ percent, size = 132, strokeWidth = 11 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth={strokeWidth}
          className="stroke-zinc-100 dark:stroke-zinc-800"
        />
        <defs>
          <linearGradient id="raffleProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="url(#raffleProgressGradient)" strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-mono font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-violet-500">
          {Math.round(clamped)}%
        </span>
      </div>
    </div>
  );
};

const STATUS_PILL = {
  reserved: { label: 'APARTADO', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' },
  reviewing: { label: 'REVISANDO', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
  paid: { label: 'VALIDADO', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
};

const PAGE_SIZE = 10;

export default function AdminRaffle() {
  const { id } = useParams();
  const [raffle, setRaffle] = useState(null);
  const [stats, setStats] = useState({ available: 0, reserved: 0, reviewing: 0, paid: 0 });
  const [money, setMoney] = useState(0);
  const [buyers, setBuyers] = useState([]);
  const [viewingTicket, setViewingTicket] = useState(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  // Dialog state
  const [dialog, setDialog] = useState({ open: false });

  const showAlert = (title, message, type = 'alert') =>
    new Promise(resolve =>
      setDialog({ open: true, type, title, message, onConfirm: () => { setDialog({ open: false }); resolve(true); }, onCancel: () => { setDialog({ open: false }); resolve(false); } })
    );

  const showConfirm = (title, message, type = 'danger', confirmText = 'Confirmar') =>
    new Promise(resolve =>
      setDialog({ open: true, type, title, message, confirmText, onConfirm: () => { setDialog({ open: false }); resolve(true); }, onCancel: () => { setDialog({ open: false }); resolve(false); } })
    );

  useEffect(() => { fetchDashboard(); }, [id]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`/api/admin_dashboard.php?id=${id}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setRaffle(data.raffle);
        setStats(data.stats);
        setMoney(data.money);
        setBuyers(data.buyers);
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteBuyer = async (ticketNumber, buyerName) => {
    const confirmed = await showConfirm(
      'Liberar boleto',
      `¿Eliminar a "${buyerName}" del boleto #${String(ticketNumber).padStart(pad, '0')}? El número quedará disponible nuevamente.`,
      'danger',
      'Liberar boleto'
    );
    if (!confirmed) return false;

    try {
      const res = await fetch('/api/admin_delete_buyer.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ raffle_id: id, ticket_number: ticketNumber }),
      });
      const data = await res.json();
      if (data.success) { fetchDashboard(); return true; }
      showAlert('Error', data.error || 'Error al liberar el boleto', 'alert');
      return false;
    } catch (err) {
      showAlert('Error', 'Error de conexión', 'alert');
      return false;
    }
  };

  const pad = raffle ? Math.max(2, String(Math.max(0, raffle.total_tickets - 1)).length) : 3;

  const filteredBuyers = buyers.filter(b => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const digits = q.replace(/\D/g, '');
    return (
      b.buyer_name?.toLowerCase().includes(q) ||
      (digits && b.buyer_phone?.replace(/\D/g, '').includes(digits)) ||
      b.ticket_number.toString().padStart(pad, '0').includes(q)
    );
  });
  const pageCount = Math.max(1, Math.ceil(filteredBuyers.length / PAGE_SIZE));
  const visibleBuyers = filteredBuyers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(0);
  };

  return (
    <div className="min-h-screen font-sans pb-12">
      <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link to="/admin" className="flex items-center gap-2 font-bold text-lg text-zinc-500 hover:text-blue-500">
            <ArrowLeft /> Volver al Inicio
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 mt-10 flex flex-col md:flex-row gap-6">
        <AdminRaffleSidebar id={id} raffle={raffle} activeSection="admin" />

        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-6 flex flex-col sm:flex-row items-center gap-6">
            <CircularProgress percent={raffle && raffle.total_tickets ? ((stats.reserved + stats.reviewing + stats.paid) / raffle.total_tickets) * 100 : 0} />
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-bold text-lg mb-1">Progreso del sorteo</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
                {stats.reserved + stats.reviewing + stats.paid} de {raffle?.total_tickets ?? 0} boletos vendidos
              </p>
              <div className="flex gap-5 justify-center sm:justify-start text-sm font-medium">
                <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-blue-500 to-violet-500" />
                  Vendidos: {stats.reserved + stats.reviewing + stats.paid}
                </span>
                <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                  Disponibles: {stats.available}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
            {[
              { title: 'Recaudado (Pagos)', val: `$${money}`, icon: <DollarSign size={24}/>, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
              { title: 'Disponibles',        val: stats.available, icon: <Ticket size={24}/>,       color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-500/10' },
              { title: 'Apartados',          val: stats.reserved,  icon: <Clock size={24}/>,       color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
              { title: 'Revisando',          val: stats.reviewing, icon: <EyeIcon size={24}/>,     color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
              { title: 'Validados',          val: stats.paid,     icon: <CheckCircle2 size={24}/>, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            ].map((card, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${card.bg} ${card.color}`}>{card.icon}</div>
                </div>
                <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">{card.title}</h3>
                <p className="text-3xl font-bold font-mono tracking-tight">{card.val}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="font-bold text-lg shrink-0">Listado de Compradores (Rifa #{id})</h3>
              <div className="relative w-full sm:w-64">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text" placeholder="Buscar por nombre, teléfono o número"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                  value={search} onChange={e => handleSearchChange(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 text-xs uppercase font-semibold">
                    <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">Boleto</th>
                    <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">Cliente</th>
                    <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">Estado</th>
                    <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {visibleBuyers.length === 0
                    ? <tr><td colSpan="4" className="px-6 py-12 text-center text-zinc-500">{search ? 'Sin resultados para tu búsqueda.' : 'Sin operaciones recientes.'}</td></tr>
                    : visibleBuyers.map(b => (
                      <tr key={b.ticket_number} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-blue-500">#{b.ticket_number.toString().padStart(pad, '0')}</td>
                        <td className="px-6 py-4 font-medium">
                          {b.buyer_name}
                          <span className="block text-xs font-normal text-zinc-500">{b.buyer_phone}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_PILL[b.status]?.cls}`}>
                            {STATUS_PILL[b.status]?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setViewingTicket(b)}
                              title="Ver información"
                              className="p-1.5 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            >
                              <Info size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteBuyer(b.ticket_number, b.buyer_name)}
                              title="Liberar boleto"
                              className="p-1.5 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>

            {filteredBuyers.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Página {page + 1} de {pageCount}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-blue-400"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                    disabled={page >= pageCount - 1}
                    className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-blue-400"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {viewingTicket && raffle && (
        <ParticipantModal
          raffleId={id}
          ticket={viewingTicket}
          pad={pad}
          pricePerTicket={raffle.price_per_ticket}
          onClose={() => setViewingTicket(null)}
          onUpdated={fetchDashboard}
          onDelete={handleDeleteBuyer}
          showAlert={showAlert}
        />
      )}

      <Dialog {...dialog} />
    </div>
  );
}
