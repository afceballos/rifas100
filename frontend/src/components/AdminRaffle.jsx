import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import Dialog from './Dialog';
import AdminRaffleSidebar from './AdminRaffleSidebar';
import ParticipantModal from './ParticipantModal';
import { DollarSign, Ticket, Clock, Eye as EyeIcon, CheckCircle2, ArrowLeft, Trash2, Search, ChevronLeft, ChevronRight, Info, X } from 'lucide-react';

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

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const BULK_STATUS_OPTIONS = [
  { value: 'reserved', label: 'Apartado', cls: 'bg-blue-600 hover:bg-blue-700' },
  { value: 'reviewing', label: 'Revisando', cls: 'bg-amber-500 hover:bg-amber-600' },
  { value: 'paid', label: 'Validado', cls: 'bg-emerald-600 hover:bg-emerald-700' },
];

export default function AdminRaffle() {
  const { id } = useParams();
  const [raffle, setRaffle] = useState(null);
  const [stats, setStats] = useState({ available: 0, reserved: 0, reviewing: 0, paid: 0 });
  const [money, setMoney] = useState(0);
  const [buyers, setBuyers] = useState([]);
  const [viewingTicket, setViewingTicket] = useState(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [statusFilter, setStatusFilter] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);

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
    if (statusFilter && b.status !== statusFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const digits = q.replace(/\D/g, '');
    return (
      b.buyer_name?.toLowerCase().includes(q) ||
      (digits && b.buyer_phone?.replace(/\D/g, '').includes(digits)) ||
      b.ticket_number.toString().padStart(pad, '0').includes(q)
    );
  });
  const pageCount = Math.max(1, Math.ceil(filteredBuyers.length / pageSize));
  const visibleBuyers = filteredBuyers.slice(page * pageSize, (page + 1) * pageSize);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(0);
    setSelectedIds(new Set());
  };

  const toggleStatusFilter = (status) => {
    setStatusFilter(prev => prev === status ? null : status);
    setPage(0);
    setSelectedIds(new Set());
  };

  const goToPage = (p) => {
    setPage(p);
    setSelectedIds(new Set());
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPage(0);
    setSelectedIds(new Set());
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds(prev => {
      const allSelected = visibleBuyers.length > 0 && visibleBuyers.every(b => prev.has(b.ticket_number));
      if (allSelected) return new Set();
      return new Set(visibleBuyers.map(b => b.ticket_number));
    });
  };

  const toggleSelectOne = (ticketNumber) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(ticketNumber)) next.delete(ticketNumber);
      else next.add(ticketNumber);
      return next;
    });
  };

  const handleBulkStatusChange = async (newStatus) => {
    setBulkWorking(true);
    try {
      const res = await fetch('/api/admin_bulk_update_status.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ raffle_id: id, ticket_numbers: [...selectedIds], new_status: newStatus }),
      });
      const data = await res.json();
      if (data.success) { setSelectedIds(new Set()); fetchDashboard(); }
      else showAlert('Error', data.error || 'No se pudo actualizar el estado', 'alert');
    } catch (err) { showAlert('Error', 'Error de conexión', 'alert'); }
    setBulkWorking(false);
  };

  const handleBulkDelete = async () => {
    const confirmed = await showConfirm(
      'Liberar boletos seleccionados',
      `¿Liberar ${selectedIds.size} boleto${selectedIds.size === 1 ? '' : 's'}? Quedarán disponibles nuevamente y se perderán sus datos, notas y comprobante.`,
      'danger',
      'Liberar boletos'
    );
    if (!confirmed) return;

    setBulkWorking(true);
    try {
      const res = await fetch('/api/admin_bulk_delete_buyers.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ raffle_id: id, ticket_numbers: [...selectedIds] }),
      });
      const data = await res.json();
      if (data.success) { setSelectedIds(new Set()); fetchDashboard(); }
      else showAlert('Error', data.error || 'No se pudieron liberar los boletos', 'alert');
    } catch (err) { showAlert('Error', 'Error de conexión', 'alert'); }
    setBulkWorking(false);
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-center gap-6">
              <CircularProgress percent={raffle && raffle.total_tickets ? ((stats.reserved + stats.reviewing + stats.paid) / raffle.total_tickets) * 100 : 0} />
              <div className="flex-1 text-center sm:text-left min-w-0">
                <h3 className="font-bold text-lg mb-1">Progreso del sorteo</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
                  {stats.reserved + stats.reviewing + stats.paid} de {raffle?.total_tickets ?? 0} boletos vendidos
                </p>
                <div className="flex flex-wrap gap-5 justify-center sm:justify-start text-sm font-medium">
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

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-5">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 shrink-0">
                <DollarSign size={28} />
              </div>
              <div className="min-w-0">
                <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">Recaudado (Pagos)</h3>
                <p className="text-3xl font-bold font-mono tracking-tight truncate">${money}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
            {[
              { title: 'Disponibles',        val: stats.available, icon: <Ticket size={24}/>,       color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-500/10', filterValue: null },
              { title: 'Apartados',          val: stats.reserved,  icon: <Clock size={24}/>,       color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', filterValue: 'reserved' },
              { title: 'Revisando',          val: stats.reviewing, icon: <EyeIcon size={24}/>,     color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', filterValue: 'reviewing' },
              { title: 'Validados',          val: stats.paid,     icon: <CheckCircle2 size={24}/>, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', filterValue: 'paid' },
            ].map((card, i) => {
              const isActive = card.filterValue && statusFilter === card.filterValue;
              const Wrapper = card.filterValue ? 'button' : 'div';
              return (
                <Wrapper
                  key={i}
                  onClick={card.filterValue ? () => toggleStatusFilter(card.filterValue) : undefined}
                  className={`text-left bg-white dark:bg-zinc-900 p-6 rounded-3xl border shadow-sm transition-all ${
                    isActive
                      ? 'border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/30'
                      : 'border-zinc-200 dark:border-zinc-800'
                  } ${card.filterValue ? 'hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer' : ''}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${card.bg} ${card.color}`}>{card.icon}</div>
                    {isActive && <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Filtrando</span>}
                  </div>
                  <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">{card.title}</h3>
                  <p className="text-3xl font-bold font-mono tracking-tight">{card.val}</p>
                </Wrapper>
              );
            })}
          </div>

          {statusFilter && (
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Mostrando solo: <span className="font-bold">{STATUS_PILL[statusFilter]?.label}</span>
              </span>
              <button
                onClick={() => toggleStatusFilter(statusFilter)}
                className="flex items-center gap-1 text-xs font-semibold text-blue-500 hover:text-blue-600"
              >
                <X size={12} /> Quitar filtro
              </button>
            </div>
          )}

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

            {selectedIds.size > 0 && (
              <div className="px-6 py-3 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/50 flex flex-wrap items-center gap-3">
                <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                  {selectedIds.size} seleccionado{selectedIds.size === 1 ? '' : 's'}
                </span>
                <div className="flex flex-wrap items-center gap-2 ml-auto">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 mr-1">Cambiar a:</span>
                  {BULK_STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleBulkStatusChange(opt.value)}
                      disabled={bulkWorking}
                      className={`px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-colors disabled:opacity-50 ${opt.cls}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkWorking}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={13} /> Liberar
                  </button>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    title="Cancelar selección"
                    className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 text-xs uppercase font-semibold">
                    <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 w-10">
                      <input
                        type="checkbox"
                        checked={visibleBuyers.length > 0 && visibleBuyers.every(b => selectedIds.has(b.ticket_number))}
                        onChange={toggleSelectAllVisible}
                        className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">Boleto</th>
                    <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">Cliente</th>
                    <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">Estado</th>
                    <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {visibleBuyers.length === 0
                    ? <tr><td colSpan="5" className="px-6 py-12 text-center text-zinc-500">{search || statusFilter ? 'Sin resultados para tu búsqueda.' : 'Sin operaciones recientes.'}</td></tr>
                    : visibleBuyers.map(b => (
                      <tr key={b.ticket_number} className={`border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors ${selectedIds.has(b.ticket_number) ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(b.ticket_number)}
                            onChange={() => toggleSelectOne(b.ticket_number)}
                            className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                          />
                        </td>
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

            {filteredBuyers.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 text-sm">
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                  <span>Mostrar</span>
                  <select
                    value={pageSize}
                    onChange={e => handlePageSizeChange(Number(e.target.value))}
                    className="px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 font-medium"
                  >
                    {PAGE_SIZE_OPTIONS.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  <span>por página · {filteredBuyers.length} en total</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 dark:text-zinc-400">Página</span>
                  <select
                    value={page}
                    onChange={e => goToPage(Number(e.target.value))}
                    className="px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 font-medium"
                  >
                    {Array.from({ length: pageCount }, (_, i) => (
                      <option key={i} value={i}>{i + 1}</option>
                    ))}
                  </select>
                  <span className="text-zinc-500 dark:text-zinc-400">de {pageCount}</span>

                  <button
                    onClick={() => goToPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-blue-400"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    onClick={() => goToPage(Math.min(pageCount - 1, page + 1))}
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
