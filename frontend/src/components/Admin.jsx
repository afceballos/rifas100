import React, { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
import RaffleForm from './admin/RaffleForm';
import RaffleEditor from './admin/RaffleEditor';
import {
  DollarSign, Ticket, Clock, CheckCircle2, LayoutDashboard, LogOut,
  Plus, Pencil, Trash2, Eye, EyeOff, Archive, Send, RotateCcw, ShieldCheck,
} from 'lucide-react';

const statusMeta = {
  draft:     { label: 'Borrador',  pill: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
  published: { label: 'Publicada', pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
  archived:  { label: 'Archivada', pill: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
};

const pad = (n, d) => String(n).padStart(d, '0');

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({ available: 0, reserved: 0, paid: 0 });
  const [money, setMoney] = useState(0);
  const [buyers, setBuyers] = useState([]);
  const [raffles, setRaffles] = useState([]);
  const [editingRaffle, setEditingRaffle] = useState(null);   // raffle object being edited (full editor view)
  const [showForm, setShowForm] = useState(false);            // new raffle modal
  const [formRaffle, setFormRaffle] = useState(null);         // for editing via modal

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/admin_dashboard.php');
      const data = await res.json();
      if (data.success) {
        setIsLoggedIn(true);
        setStats(data.stats);
        setMoney(data.money);
        setBuyers(data.buyers);
      } else { setIsLoggedIn(false); }
    } catch (err) { console.error(err); }
  };

  const fetchRaffles = async () => {
    try {
      const res = await fetch('/api/admin_list_raffles.php');
      const data = await res.json();
      if (data.success) setRaffles(data.raffles);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        setLoginError('');
        fetchDashboard();
        fetchRaffles();
      } else { setLoginError(data.message); }
    } catch { setLoginError('Error de conexión'); }
    setLoading(false);
  };

  const handleLogout = async () => {
    // Best-effort: clear cookie + UI state (no dedicated logout endpoint)
    setIsLoggedIn(false);
  };

  const raffleAction = async (raffle_id, action, extra = {}) => {
    try {
      const res = await fetch('/api/admin_raffle_action.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raffle_id, action, ...extra }),
      });
      const data = await res.json();
      if (!data.success) alert(data.message || 'Error');
      fetchRaffles();
      fetchDashboard();
    } catch { alert('Error de conexión'); }
  };

  // --- LOGIN VIEW ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 font-sans relative">
        <div className="absolute top-4 right-4"><ThemeToggle /></div>
        <div className="bg-white dark:bg-zinc-900 p-10 rounded-3xl max-w-sm w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-500"><LayoutDashboard size={32} /></div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-center mb-8 text-zinc-900 dark:text-white">Acceso Operativo</h2>

          {loginError && <div className="mb-6 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl text-center text-sm font-medium">{loginError}</div>}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300">Usuario</label>
              <input type="text" required className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300">Contraseña</label>
              <input type="password" required className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 mt-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-lg transition-all active:scale-95">
              {loading ? 'Verificando...' : 'Entrar al Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- EDITOR VIEW (drilldown into one raffle) ---
  if (editingRaffle) {
    return (
      <div className="min-h-screen font-sans pb-12">
        <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-lg text-zinc-900 dark:text-white">
              <LayoutDashboard className="text-blue-500" /> Workspace
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button onClick={() => { setEditingRaffle(null); fetchDashboard(); fetchRaffles(); }} className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
                <LogOut size={16} /> Salir
              </button>
            </div>
          </div>
        </nav>
        <div className="max-w-6xl mx-auto px-6 mt-10">
          <RaffleEditor raffle={editingRaffle} onBack={() => { setEditingRaffle(null); fetchDashboard(); fetchRaffles(); }} />
        </div>
      </div>
    );
  }

  // --- DASHBOARD VIEW ---
  return (
    <div className="min-h-screen font-sans pb-12">
      <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-lg text-zinc-900 dark:text-white">
            <LayoutDashboard className="text-blue-500" /> Workspace
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
              <LogOut size={16} /> Salir
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 mt-10">
        {/* Tarjetas de stats (rifa publicada activa) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { title: 'Recaudado (Pagos)', val: `$${Number(money).toFixed(2)}`, icon: <DollarSign size={24}/>, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { title: 'Disponibles', val: stats.available, icon: <Ticket size={24}/>, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
            { title: 'En Espera (Reservas)', val: stats.reserved, icon: <Clock size={24}/>, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
            { title: 'Liquidados', val: stats.paid, icon: <CheckCircle2 size={24}/>, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10' },
          ].map((card, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className={`p-3 rounded-2xl ${card.bg} ${card.color} w-fit mb-4`}>{card.icon}</div>
              <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">{card.title}</h3>
              <p className="text-3xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">{card.val}</p>
            </div>
          ))}
        </div>

        {/* Lista de rifas */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden mb-10">
          <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Mis rifas</h3>
            <button onClick={() => { setFormRaffle(null); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95">
              <Plus size={16} /> Nueva rifa
            </button>
          </div>

          {raffles.length === 0 ? (
            <div className="px-6 py-12 text-center text-zinc-500">
              Aún no has creado rifas. Haz click en "Nueva rifa" para empezar.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {raffles.map(r => {
                const meta = statusMeta[r.status] || statusMeta.draft;
                const totalSold = (r.reserved_count || 0) + (r.paid_count || 0);
                const progress = r.total_tickets ? Math.round((totalSold / r.total_tickets) * 100) : 0;
                return (
                  <div key={r.id} className="p-6 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-[260px]">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h4 className="font-bold text-lg text-zinc-900 dark:text-white">{r.title}</h4>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${meta.pill}`}>{meta.label}</span>
                          {r.deleted_at && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400">Eliminada</span>}
                        </div>
                        {r.description && (
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3 line-clamp-2">{r.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                          <span>📅 {new Date(r.draw_date).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          <span>🎟️ {r.digits} cifras · {r.total_tickets.toLocaleString()} boletos</span>
                          <span>💰 ${Number(r.price_per_ticket).toFixed(2)} c/u</span>
                          <span>👥 {r.paid_count}/{r.total_tickets} pagados ({progress}%)</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setEditingRaffle(r)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold rounded-lg">
                          <Ticket size={14} /> Boletos
                        </button>
                        <button onClick={() => { setFormRaffle(r); setShowForm(true); }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold rounded-lg">
                          <Pencil size={14} /> Editar
                        </button>
                        {r.status !== 'published' && !r.deleted_at && (
                          <button onClick={() => raffleAction(r.id, 'set_status', { status: 'published' })}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg">
                            <Send size={14} /> Publicar
                          </button>
                        )}
                        {r.status === 'published' && (
                          <button onClick={() => raffleAction(r.id, 'set_status', { status: 'draft' })}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold rounded-lg">
                            <EyeOff size={14} /> Despublicar
                          </button>
                        )}
                        {r.status !== 'archived' && !r.deleted_at && (
                          <button onClick={() => raffleAction(r.id, 'set_status', { status: 'archived' })}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-lg">
                            <Archive size={14} /> Archivar
                          </button>
                        )}
                        {!r.deleted_at ? (
                          <button onClick={() => { if (window.confirm(`¿Eliminar la rifa "${r.title}"?`)) raffleAction(r.id, 'soft_delete'); }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg">
                            <Trash2 size={14} /> Eliminar
                          </button>
                        ) : (
                          <button onClick={() => raffleAction(r.id, 'restore')}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-lg">
                            <RotateCcw size={14} /> Restaurar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Compradores (de la rifa publicada) */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Compradores (rifa publicada)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">Num</th>
                  <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">Cliente</th>
                  <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">Contacto</th>
                  <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">Estado</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {buyers.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-12 text-center text-zinc-500">Sin operaciones recientes.</td></tr>
                ) : buyers.map(b => (
                  <tr key={b.ticket_number} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
                    <td className="px-6 py-4 font-mono font-bold text-blue-500">#{pad(b.ticket_number, 3)}</td>
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{b.buyer_name}</td>
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                      <div>{b.buyer_phone}</div>
                      {b.buyer_email && <div className="text-xs mt-0.5">{b.buyer_email}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${b.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400'}`}>
                        {b.status === 'paid' ? 'LIQUIDADO' : 'PENDIENTE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <RaffleForm
          raffle={formRaffle}
          onClose={() => { setShowForm(false); setFormRaffle(null); }}
          onSaved={() => { fetchRaffles(); }}
        />
      )}
    </div>
  );
}
