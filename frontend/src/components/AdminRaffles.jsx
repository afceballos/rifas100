import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Edit3, Eye, EyeOff, LayoutDashboard, LogOut, Plus, Trash2 } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { apiGet, apiPost, clearToken, getToken, setToken } from '../api';

const emptyForm = { title: '', description: '', price_per_ticket: '', digits: '2', draw_date: '' };

export default function AdminRaffles() {
  const [loggedIn, setLoggedIn] = useState(Boolean(getToken()));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [raffles, setRaffles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loggedIn) loadRaffles();
  }, [loggedIn]);

  const loadRaffles = async () => {
    const data = await apiGet('/api/admin_get_raffles.php');
    if (data.success) setRaffles(data.raffles);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await apiPost('/api/login.php', { username, password });
      if (!data.success) {
        setLoginError(data.message || 'Usuario o contraseña incorrectos');
      } else {
        setToken(data.token);
        setLoggedIn(true);
      }
    } catch {
      setLoginError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setLoading(true);
    try {
      const data = await apiPost(editingId ? '/api/admin_update_raffle.php' : '/api/admin_create_raffle.php', {
        ...form,
        id: editingId,
        action: editingId ? 'edit' : undefined,
      });
      if (!data.success) {
        setFormError(data.error || 'No se pudo guardar la rifa');
      } else {
        resetForm();
        await loadRaffles();
      }
    } catch {
      setFormError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const editRaffle = (raffle) => {
    setEditingId(raffle.id);
    setForm({
      title: raffle.title,
      description: raffle.description || '',
      price_per_ticket: raffle.price_per_ticket,
      digits: String(raffle.digits),
      draw_date: raffle.draw_date.slice(0, 16),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateStatus = async (raffle) => {
    const action = raffle.status === 'published' ? 'unpublish' : 'publish';
    const data = await apiPost('/api/admin_update_raffle.php', { id: raffle.id, action });
    if (data.success) loadRaffles();
  };

  const deleteRaffle = async (raffle) => {
    if (!window.confirm(`¿Eliminar la rifa "${raffle.title}" y sus boletos?`)) return;
    const data = await apiPost('/api/admin_update_raffle.php', { id: raffle.id, action: 'delete' });
    if (data.success) loadRaffles();
  };

  const logout = () => {
    clearToken();
    setLoggedIn(false);
    setRaffles([]);
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
        <div className="absolute top-4 right-4"><ThemeToggle /></div>
        <form onSubmit={handleLogin} className="w-full max-w-md bg-white dark:bg-zinc-900 p-8 sm:p-10 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <div className="flex items-center gap-3 mb-8"><LayoutDashboard className="text-blue-500" /><div><p className="text-xs uppercase tracking-[0.2em] text-blue-500 font-bold">Panel</p><h1 className="text-2xl font-extrabold">Administrar rifas</h1></div></div>
          {loginError && <p className="mb-5 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{loginError}</p>}
          <label className="block text-sm font-semibold mb-2">Usuario</label>
          <input required value={username} onChange={(event) => setUsername(event.target.value)} className="w-full mb-4 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950" />
          <label className="block text-sm font-semibold mb-2">Contraseña</label>
          <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full mb-6 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950" />
          <button disabled={loading} className="w-full py-3 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold">{loading ? 'Verificando...' : 'Entrar al panel'}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <nav className="sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 font-extrabold"><LayoutDashboard className="text-blue-500" /> Centro de rifas</Link>
          <div className="flex items-center gap-4"><ThemeToggle /><button onClick={logout} className="flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white"><LogOut size={16} /> Salir</button></div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-5 py-10">
        <div className="mb-10"><p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-500">Configuración</p><h1 className="text-4xl font-extrabold tracking-tight mt-2">Tus tablas de rifas</h1><p className="text-zinc-500 mt-3 max-w-2xl">Crea cada sorteo por separado, prepara sus boletos y publícalo cuando esté listo.</p></div>

        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 mb-10">
          <div className="flex items-center justify-between gap-4 mb-6"><div><h2 className="text-xl font-extrabold">{editingId ? 'Editar rifa' : 'Nueva rifa'}</h2><p className="text-sm text-zinc-500 mt-1">Los boletos se generan automáticamente según las cifras.</p></div>{editingId && <button onClick={resetForm} className="text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white">Cancelar edición</button>}</div>
          {formError && <p className="mb-5 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{formError}</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div><label className="block text-sm font-semibold mb-2">Nombre de la rifa</label><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Gran sorteo de diciembre" className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950" /></div>
            <div><label className="block text-sm font-semibold mb-2">Precio por boleto</label><input required type="number" min="0" step="0.01" value={form.price_per_ticket} onChange={(event) => setForm({ ...form, price_per_ticket: event.target.value })} placeholder="10.00" className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950" /></div>
            <div className="md:col-span-2"><label className="block text-sm font-semibold mb-2">Descripción</label><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows="3" placeholder="Cuenta qué se sortea y cómo participar." className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 resize-y" /></div>
            <div><label className="block text-sm font-semibold mb-2">Cantidad de cifras</label><select value={form.digits} onChange={(event) => setForm({ ...form, digits: event.target.value })} className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950"><option value="2">2 cifras · 100 boletos</option><option value="3">3 cifras · 1,000 boletos</option><option value="4">4 cifras · 10,000 boletos</option></select></div>
            <div><label className="block text-sm font-semibold mb-2">Fecha y hora del sorteo</label><div className="relative"><CalendarDays size={18} className="absolute left-3 top-3.5 text-zinc-400" /><input required type="datetime-local" value={form.draw_date} onChange={(event) => setForm({ ...form, draw_date: event.target.value })} className="w-full p-3 pl-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950" /></div></div>
            <button disabled={loading} className="md:col-span-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700"><Plus size={18} /> {loading ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear tabla de rifa'}</button>
          </form>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {raffles.length === 0 ? <div className="md:col-span-2 text-center py-16 text-zinc-500">Todavía no hay tablas creadas.</div> : raffles.map((raffle) => (
            <article key={raffle.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4"><div><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${raffle.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}>{raffle.status === 'published' ? 'PUBLICADA' : 'BORRADOR'}</span><h2 className="text-xl font-extrabold mt-3">{raffle.title}</h2></div><span className="font-mono text-blue-500 text-sm">{raffle.digits} cifras</span></div>
              <p className="text-sm text-zinc-500 mt-3 min-h-10">{raffle.description || 'Sin descripción.'}</p>
              <div className="flex flex-wrap gap-4 text-xs text-zinc-500 mt-5"><span>{raffle.tickets_reserved} pendientes</span><span>{raffle.tickets_paid} pagados</span><span>Sorteo: {new Date(raffle.draw_date.replace(' ', 'T')).toLocaleDateString()}</span></div>
              <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800"><Link to={`/admin/raffle/${raffle.id}`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-bold"><Eye size={15} /> Clientes</Link><button onClick={() => editRaffle(raffle)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-bold"><Edit3 size={15} /> Editar</button><button onClick={() => updateStatus(raffle)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-bold">{raffle.status === 'published' ? <EyeOff size={15} /> : <Eye size={15} />} {raffle.status === 'published' ? 'Despublicar' : 'Publicar'}</button><button onClick={() => deleteRaffle(raffle)} className="p-2 rounded-lg text-red-600 hover:bg-red-50 ml-auto" title="Eliminar rifa"><Trash2 size={16} /></button></div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
