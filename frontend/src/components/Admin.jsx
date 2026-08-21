import React, { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
<<<<<<< HEAD
import { LayoutDashboard, LogOut, PlusCircle, ArrowRight } from 'lucide-react';
import { apiGet, apiPost, getToken, setToken, clearToken } from '../api';

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!getToken());
=======
import { DollarSign, Ticket, Clock, CheckCircle2, LayoutDashboard, LogOut } from 'lucide-react';

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
>>>>>>> parent of e50b982 (Arquitectura Multi-tenant SaaS y Landing Page implementada)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [stats, setStats] = useState({ available: 0, reserved: 0, paid: 0 });
  const [money, setMoney] = useState(0);
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchDashboard(); }, []);

<<<<<<< HEAD
  useEffect(() => {
    if (getToken()) fetchRaffles();
  }, []);

  const fetchRaffles = async () => {
    try {
      const data = await apiGet('/api/admin_get_raffles.php');
      if (data.success) {
        setIsLoggedIn(true);
        setRaffles(data.raffles || []);
      } else {
        // Token expiró o es inválido
        clearToken();
        setIsLoggedIn(false);
      }
    } catch (err) {
      clearToken();
      setIsLoggedIn(false);
    }
=======
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
>>>>>>> parent of e50b982 (Arquitectura Multi-tenant SaaS y Landing Page implementada)
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
<<<<<<< HEAD
      const data = await apiPost('/api/login.php', { username, password });
      if (data.success && data.token) {
        setToken(data.token);
        setIsLoggedIn(true);
        fetchRaffles();
      } else {
        alert(data.message || 'Error de login');
      }
    } catch (err) {
      alert('Error de conexión');
    }
=======
      const res = await fetch('/api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setLoginError('');
        fetchDashboard();
      } else { setLoginError(data.message); }
    } catch (err) { setLoginError('Error de conexión'); }
>>>>>>> parent of e50b982 (Arquitectura Multi-tenant SaaS y Landing Page implementada)
    setLoading(false);
  };

  const markAsPaid = async (ticketNumber) => {
    if (!window.confirm(`¿Confirmar pago del boleto #${ticketNumber}?`)) return;
    try {
<<<<<<< HEAD
      const data = await apiPost('/api/admin_create_raffle.php', newRaffle);
      if (data.success) {
        setShowCreate(false);
        fetchRaffles();
      } else alert(data.error);
    } catch (err) { alert('Error al crear'); }
    setCreating(false);
  };

  const handleLogout = async () => {
    try { await apiPost('/api/logout.php', {}); } catch (err) { /* ignorar */ }
    clearToken();
    setIsLoggedIn(false);
  };

=======
      const res = await fetch('/api/admin_mark_paid.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_number: ticketNumber })
      });
      const data = await res.json();
      if (data.success) fetchDashboard();
      else alert(data.error || 'Error al actualizar');
    } catch (err) { alert('Error de conexión'); }
  };

  // --- LOGIN VIEW ---
>>>>>>> parent of e50b982 (Arquitectura Multi-tenant SaaS y Landing Page implementada)
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

  // --- DASHBOARD VIEW ---
  return (
    <div className="min-h-screen font-sans pb-12">
      {/* Sidebar / Topnav */}
      <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-lg text-zinc-900 dark:text-white">
            <LayoutDashboard className="text-blue-500" /> Workspace
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
<<<<<<< HEAD
            <button onClick={handleLogout} className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white"><LogOut size={16} /></button>
=======
            <button onClick={() => setIsLoggedIn(false)} className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
              <LogOut size={16} /> Salir
            </button>
>>>>>>> parent of e50b982 (Arquitectura Multi-tenant SaaS y Landing Page implementada)
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 mt-10">
        {/* Tarjetas SaaS Modernas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { title: 'Recaudado (Pagos)', val: `$${money}`, icon: <DollarSign size={24}/>, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { title: 'Disponibles', val: stats.available, icon: <Ticket size={24}/>, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
            { title: 'En Espera (Reservas)', val: stats.reserved, icon: <Clock size={24}/>, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
            { title: 'Liquidados', val: stats.paid, icon: <CheckCircle2 size={24}/>, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10' },
          ].map((card, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${card.bg} ${card.color}`}>{card.icon}</div>
              </div>
              <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">{card.title}</h3>
              <p className="text-3xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">{card.val}</p>
            </div>
          ))}
        </div>

        {/* Tabla Minimalista */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Gestión de Boletos Operados</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">Num</th>
                  <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">Cliente</th>
                  <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">Contacto</th>
                  <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">Estado</th>
                  <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {buyers.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-zinc-500">Sin operaciones recientes.</td></tr>
                ) : buyers.map(b => (
                  <tr key={b.ticket_number} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
                    <td className="px-6 py-4 font-mono font-bold text-blue-500">#{b.ticket_number.toString().padStart(3, '0')}</td>
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
                    <td className="px-6 py-4">
                      {b.status === 'reserved' && (
                        <button onClick={() => markAsPaid(b.ticket_number)} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 font-medium rounded-lg text-xs transition-all active:scale-95 shadow-sm">
                          Liquidar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
