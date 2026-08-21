import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import Dialog from './Dialog';
import RaffleFormModal from './RaffleFormModal';
import { LayoutDashboard, LogOut, PlusCircle, ArrowRight, Trash2, EyeOff, Eye, Pencil } from 'lucide-react';

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [raffles, setRaffles] = useState([]);

  // Modal State for New/Edit Raffle
  const [showCreate, setShowCreate] = useState(false);
  const [editingRaffle, setEditingRaffle] = useState(null);

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
      else showAlert('Acceso denegado', data.message, 'alert');
    } catch (err) { showAlert('Error', 'Error de conexión con el servidor.', 'alert'); }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout.php', { credentials: 'include' });
      setIsLoggedIn(false);
    } catch (err) {
      console.error('Error logging out', err);
    }
  };

  const handleTogglePublish = async (raffle) => {
    const action = raffle.is_published ? 'despublicar' : 'publicar';
    const confirmed = await showConfirm(
      `¿${raffle.is_published ? 'Despublicar' : 'Publicar'} sorteo?`,
      `El sorteo "${raffle.title}" quedará ${raffle.is_published ? 'invisible para el público' : 'visible para el público'}.`,
      'confirm',
      raffle.is_published ? 'Despublicar' : 'Publicar'
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/admin_toggle_raffle.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ raffle_id: raffle.id }),
      });
      const data = await res.json();
      if (data.success) checkAuth();
      else showAlert('Error', `No se pudo ${action} el sorteo.`, 'alert');
    } catch (err) { showAlert('Error', 'Error de conexión.', 'alert'); }
  };

  const handleDeleteRaffle = async (raffle) => {
    const confirmed = await showConfirm(
      'Eliminar sorteo permanentemente',
      `¿Estás seguro? Se eliminarán el sorteo "${raffle.title}" y todos sus boletos. Esta acción no se puede deshacer.`,
      'danger',
      'Eliminar definitivamente'
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/admin_delete_raffle.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ raffle_id: raffle.id }),
      });
      const data = await res.json();
      if (data.success) checkAuth();
      else showAlert('Error', data.error, 'alert');
    } catch (err) { showAlert('Error', 'Error de conexión.', 'alert'); }
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
        <Dialog {...dialog} />
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
            <div key={r.id} className={`bg-white dark:bg-zinc-900 rounded-3xl border shadow-sm flex flex-col justify-between overflow-hidden transition-opacity ${r.is_published ? 'border-zinc-200 dark:border-zinc-800' : 'border-zinc-300 dark:border-zinc-700 opacity-60'}`}>
              {r.background_image && (
                <div className="relative h-24 shrink-0">
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${r.background_image})` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent" />
                </div>
              )}
              <div className="p-6 pb-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-xl font-bold">{r.title}</h3>
                  {!r.is_published && (
                    <span className="shrink-0 text-xs font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-full">Oculto</span>
                  )}
                </div>
                <p className="text-zinc-500 text-sm mb-1">Creado: {new Date(r.created_at).toLocaleDateString()}</p>
                {r.description && (
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4 line-clamp-2">{r.description}</p>
                )}
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

              <div className="flex flex-col gap-2 p-6 pt-0">
                <Link to={`/admin/raffle/${r.id}`} className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 font-bold transition-colors">
                  Abrir Panel <ArrowRight size={18} />
                </Link>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTogglePublish(r)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {r.is_published ? <><EyeOff size={15} /> Despublicar</> : <><Eye size={15} /> Publicar</>}
                  </button>
                  <button
                    onClick={() => setEditingRaffle(r)}
                    title="Editar sorteo"
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteRaffle(r)}
                    title="Eliminar sorteo"
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {raffles.length === 0 && <div className="col-span-full text-center text-zinc-500 py-12">No hay sorteos creados.</div>}
        </div>
      </div>

      {showCreate && (
        <RaffleFormModal
          mode="create"
          onClose={() => setShowCreate(false)}
          onSaved={checkAuth}
          showAlert={showAlert}
        />
      )}

      {editingRaffle && (
        <RaffleFormModal
          mode="edit"
          raffle={editingRaffle}
          onClose={() => setEditingRaffle(null)}
          onSaved={checkAuth}
          showAlert={showAlert}
        />
      )}

      <Dialog {...dialog} />
    </div>
  );
}
