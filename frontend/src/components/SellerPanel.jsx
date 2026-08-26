import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import Dialog from './Dialog';
import SellerTicketDetailModal from './SellerTicketDetailModal';
import SellerChangePasswordModal from './SellerChangePasswordModal';
import { ShieldCheck, LogOut, KeyRound, Search, Info, Ticket, Wallet, CheckCircle2 } from 'lucide-react';

const STATUS_PILL = {
  reserved: { label: 'APARTADO', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' },
  reviewing: { label: 'REVISANDO', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
  paid: { label: 'APROBADO', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
};

export default function SellerPanel() {
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [pricePerTicket, setPricePerTicket] = useState(0);
  const [moneyCollected, setMoneyCollected] = useState(0);
  const [search, setSearch] = useState('');
  const [viewingTicket, setViewingTicket] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [dialog, setDialog] = useState({ open: false });
  const showAlert = (title, message, type = 'alert') =>
    new Promise(resolve =>
      setDialog({ open: true, type, title, message, onConfirm: () => { setDialog({ open: false }); resolve(true); }, onCancel: () => { setDialog({ open: false }); resolve(false); } })
    );

  useEffect(() => { fetchMe(); fetchTickets(); }, []);

  const fetchMe = async () => {
    try {
      const res = await fetch('/api/seller_me.php', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setSeller(data.seller);
    } catch (err) { /* no crítico */ }
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/seller_get_tickets.php', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets);
        setPricePerTicket(data.price_per_ticket);
        setMoneyCollected(data.money_collected);
      }
    } catch (err) { /* no crítico */ }
  };

  const handleLogout = async () => {
    await fetch('/api/seller_logout.php', { credentials: 'include' });
    navigate('/vendedor/login');
  };

  const pad = seller ? Math.max(2, String(Math.max(0, seller.range_end ?? seller.total_tickets - 1)).length) : 2;

  const filteredTickets = tickets.filter(t => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const digits = q.replace(/\D/g, '');
    return (
      t.buyer_name?.toLowerCase().includes(q) ||
      (digits && t.buyer_phone?.replace(/\D/g, '').includes(digits)) ||
      t.ticket_numbers.some(n => n.toString().padStart(pad, '0').includes(q))
    );
  });

  const totalNumbers = tickets.reduce((sum, t) => sum + t.ticket_numbers.length, 0);
  const paidNumbers = tickets.filter(t => t.status === 'paid').reduce((sum, t) => sum + t.ticket_numbers.length, 0);

  return (
    <div className="min-h-screen font-sans pb-12">
      <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-zinc-500 hover:text-blue-500">
            <ShieldCheck /> TicketVault
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChangePassword(true)}
              title="Cambiar contraseña"
              className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <KeyRound size={18} />
            </button>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 mt-10">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
            {seller?.title || 'Cargando...'}
          </p>
          <h1 className="text-3xl font-bold">Hola, {seller?.name || '...'}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
            {seller?.code}{seller && seller.range_start != null ? ` · Números ${String(seller.range_start).padStart(pad, '0')}–${String(seller.range_end).padStart(pad, '0')}` : ' · Todos los números'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 w-fit mb-3"><Ticket size={20} /></div>
            <h3 className="text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-0.5">Boletos vendidos</h3>
            <p className="text-2xl font-bold font-mono">{totalNumbers}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 w-fit mb-3"><CheckCircle2 size={20} /></div>
            <h3 className="text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-0.5">Aprobados</h3>
            <p className="text-2xl font-bold font-mono">{paidNumbers}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 w-fit mb-3"><Wallet size={20} /></div>
            <h3 className="text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-0.5">Recaudado</h3>
            <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">${moneyCollected}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="font-bold text-lg shrink-0">Tus compradores</h3>
            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text" placeholder="Buscar por nombre, teléfono o número"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                value={search} onChange={e => setSearch(e.target.value)}
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
                {filteredTickets.length === 0
                  ? <tr><td colSpan="4" className="px-6 py-12 text-center text-zinc-500">{search ? 'Sin resultados para tu búsqueda.' : 'Todavía no tienes ventas registradas.'}</td></tr>
                  : filteredTickets.map(t => (
                    <tr key={t.ticket_code} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-blue-500">
                        <div className="flex flex-wrap gap-1 max-w-[10rem]">
                          {t.ticket_numbers.map(n => (
                            <span key={n} className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10">#{n.toString().padStart(pad, '0')}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {t.buyer_name}
                        <span className="block text-xs font-normal text-zinc-500">{t.buyer_phone}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_PILL[t.status]?.cls}`}>
                          {STATUS_PILL[t.status]?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setViewingTicket(t)}
                          title="Ver información"
                          className="p-1.5 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Info size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {viewingTicket && (
        <SellerTicketDetailModal
          ticket={viewingTicket}
          pad={pad}
          pricePerTicket={pricePerTicket}
          onClose={() => setViewingTicket(null)}
          onUpdated={fetchTickets}
          showAlert={showAlert}
        />
      )}

      {showChangePassword && (
        <SellerChangePasswordModal
          onClose={() => setShowChangePassword(false)}
          showAlert={showAlert}
        />
      )}

      <Dialog {...dialog} />
    </div>
  );
}
