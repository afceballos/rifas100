import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { LayoutDashboard, LogOut, PlusCircle, ArrowRight } from 'lucide-react';

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [raffles, setRaffles] = useState([]);

  // Modal State for New Raffle
  const [showCreate, setShowCreate] = useState(false);
  const [newRaffle, setNewRaffle] = useState({ title: '', price_per_ticket: '', digits: '2', draw_date: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin_get_raffles.php', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setIsLoggedIn(true);
        setRaffles(data.raffles);
      } else setIsLoggedIn(false);
    } catch (err) { setIsLoggedIn(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) checkAuth();
      else alert(data.message);
    } catch (err) { alert('Error de conexión'); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/admin_create_raffle.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newRaffle),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        checkAuth();
      } else alert(data.error);
    } catch (err) { alert('Error al crear'); }
    setCreating(false);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout.php', { credentials: 'include' });
      setIsLoggedIn(false);
    } catch (err) {
      console.error("Error logging out", err);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 p-10 rounded-3xl max-w-sm w-full shadow-2xl">
          <h2 className="text-2xl font-bold text-center mb-8">Acceso Operativo</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="Usuario" required className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3" value={username} onChange={e => setUsername(e.target.value)} />
            <input type="password" placeholder="Contraseña" required className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="submit" className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl mt-4">{loading ? '...' : 'Entrar'}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans pb-12">
      <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-lg"><LayoutDashboard className="text-blue-500" /> Sorteos Activos</div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button onClick={handleLogout} className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white"><LogOut size={16} /></button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 mt-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Gestor de Bóvedas</h1>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30">
            <PlusCircle size={20} /> Nuevo Sorteo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {raffles.map(r => (
            <div key={r.id} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">{r.title}</h3>
                <p className="text-zinc-500 text-sm mb-4">Creado: {new Date(r.created_at).toLocaleDateString()}</p>
                <div className="flex gap-4 mb-6">
                  <div>
                    <p className="text-xs text-zinc-400">Boletos</p>
                    <p className="font-mono font-bold text-lg text-blue-500">{r.total_tickets}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Valor</p>
                    <p className="font-mono font-bold text-lg text-emerald-500">${r.price_per_ticket}</p>
                  </div>
                </div>
              </div>
              <Link to={`/admin/raffle/${r.id}`} className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 font-bold transition-colors">
                Abrir Panel <ArrowRight size={18} />
              </Link>
            </div>
          ))}
          {raffles.length === 0 && <div className="col-span-full text-center text-zinc-500 py-12">No hay sorteos creados.</div>}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl max-w-md w-full border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-2xl font-bold mb-6">Nuevo Sorteo</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input type="text" placeholder="Nombre del Sorteo" required className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent" value={newRaffle.title} onChange={e => setNewRaffle({...newRaffle, title: e.target.value})} />
              <input type="number" step="0.01" placeholder="Precio por boleto ($)" required className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent" value={newRaffle.price_per_ticket} onChange={e => setNewRaffle({...newRaffle, price_per_ticket: e.target.value})} />
              <input type="datetime-local" required className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent" value={newRaffle.draw_date} onChange={e => setNewRaffle({...newRaffle, draw_date: e.target.value})} />
              <div>
                <label className="block text-sm mb-2 text-zinc-500">Cantidad de Cifras (Boletos)</label>
                <select className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent" value={newRaffle.digits} onChange={e => setNewRaffle({...newRaffle, digits: e.target.value})}>
                  <option value="2">2 Cifras (100 boletos: 00-99)</option>
                  <option value="3">3 Cifras (1,000 boletos: 000-999)</option>
                  <option value="4">4 Cifras (10,000 boletos: 0000-9999)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold">Cancelar</button>
                <button type="submit" disabled={creating} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">{creating ? 'Generando...' : 'Crear Bóveda'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
