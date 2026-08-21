import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import Dialog from './Dialog';
import { DollarSign, Ticket, Clock, CheckCircle2, ArrowLeft, Trash2 } from 'lucide-react';

export default function AdminRaffle() {
  const { id } = useParams();
  const [stats, setStats] = useState({ available: 0, reserved: 0, paid: 0 });
  const [money, setMoney] = useState(0);
  const [buyers, setBuyers] = useState([]);

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
        setStats(data.stats);
        setMoney(data.money);
        setBuyers(data.buyers);
      }
    } catch (err) { console.error(err); }
  };

  const toggleStatus = async (ticketNumber, currentStatus) => {
    const newStatus = currentStatus === 'reserved' ? 'paid' : 'reserved';
    const label = newStatus === 'paid' ? 'LIQUIDADO' : 'PENDIENTE';
    const confirmed = await showConfirm(
      `Cambiar estado del boleto`,
      `El boleto #${String(ticketNumber).padStart(3, '0')} pasará a estado ${label}.`,
      'confirm',
      `Marcar ${label}`
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/admin_mark_paid.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ raffle_id: id, ticket_number: ticketNumber, new_status: newStatus }),
      });
      const data = await res.json();
      if (data.success) fetchDashboard();
      else showAlert('Error', data.error || 'Error al actualizar', 'alert');
    } catch (err) { showAlert('Error', 'Error de conexión', 'alert'); }
  };

  const handleDeleteBuyer = async (ticketNumber, buyerName) => {
    const confirmed = await showConfirm(
      'Liberar boleto',
      `¿Eliminar a "${buyerName}" del boleto #${String(ticketNumber).padStart(3, '0')}? El número quedará disponible nuevamente.`,
      'danger',
      'Liberar boleto'
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/admin_delete_buyer.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ raffle_id: id, ticket_number: ticketNumber }),
      });
      const data = await res.json();
      if (data.success) fetchDashboard();
      else showAlert('Error', data.error || 'Error al liberar el boleto', 'alert');
    } catch (err) { showAlert('Error', 'Error de conexión', 'alert'); }
  };

  return (
    <div className="min-h-screen font-sans pb-12">
      <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link to="/admin" className="flex items-center gap-2 font-bold text-lg text-zinc-500 hover:text-blue-500">
            <ArrowLeft /> Volver al Inicio
          </Link>
          <div className="flex items-center gap-4">
            <Link to={`/sorteo/${id}`} target="_blank" className="text-sm font-bold text-blue-500 underline">Ver URL Pública</Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { title: 'Recaudado (Pagos)', val: `$${money}`, icon: <DollarSign size={24}/>, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { title: 'Disponibles',        val: stats.available, icon: <Ticket size={24}/>,       color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-500/10' },
            { title: 'Pendientes (Reserva)', val: stats.reserved, icon: <Clock size={24}/>,       color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
            { title: 'Liquidados',          val: stats.paid,     icon: <CheckCircle2 size={24}/>, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10' },
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
          <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="font-bold text-lg">Listado de Compradores (Rifa #{id})</h3>
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
                {buyers.length === 0
                  ? <tr><td colSpan="4" className="px-6 py-12 text-center text-zinc-500">Sin operaciones recientes.</td></tr>
                  : buyers.map(b => (
                    <tr key={b.ticket_number} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-blue-500">#{b.ticket_number.toString().padStart(3, '0')}</td>
                      <td className="px-6 py-4 font-medium">
                        {b.buyer_name}
                        <span className="block text-xs font-normal text-zinc-500">{b.buyer_phone}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          b.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400'
                        }`}>
                          {b.status === 'paid' ? 'LIQUIDADO' : 'PENDIENTE'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleStatus(b.ticket_number, b.status)}
                            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-700 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 font-medium rounded-lg text-xs transition-all shadow-sm"
                          >
                            {b.status === 'reserved' ? 'Marcar Pagado' : 'Marcar Pendiente'}
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
        </div>
      </div>

      <Dialog {...dialog} />
    </div>
  );
}
