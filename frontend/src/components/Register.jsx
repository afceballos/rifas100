import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Dialog from './Dialog';
import TicketMark from './landing/TicketMark';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ tenant_name: '', username: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({ open: false });

  const showAlert = (title, message, type = 'alert') =>
    new Promise(resolve =>
      setDialog({ open: true, type, title, message, onConfirm: () => { setDialog({ open: false }); resolve(true); }, onCancel: () => { setDialog({ open: false }); resolve(false); } })
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      showAlert('Revisa la contraseña', 'Las contraseñas no coinciden.', 'alert');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tenant_name: form.tenant_name,
          username: form.username,
          email: form.email,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (data.success) {
        navigate('/admin');
      } else {
        showAlert('No se pudo crear la cuenta', data.message, 'alert');
      }
    } catch (err) {
      showAlert('Error', 'Error de conexión con el servidor.', 'alert');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 p-10 rounded-3xl max-w-sm w-full shadow-2xl">
        <div className="flex items-center justify-center gap-2 font-mono font-bold text-xl tracking-tight mb-6">
          <TicketMark className="h-6 w-auto text-raffle-greenDark dark:text-raffle-green" />
          <span>TICKET<span className="text-raffle-greenDark dark:text-raffle-green">100</span></span>
        </div>
        <h2 className="text-2xl font-bold text-center mb-2">Crea tu cuenta</h2>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mb-8">Empieza a crear tus propias rifas gratis.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text" placeholder="Nombre del negocio" required
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3"
            value={form.tenant_name} onChange={e => setForm({ ...form, tenant_name: e.target.value })}
          />
          <input
            type="text" placeholder="Usuario" required
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3"
            value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
          />
          <input
            type="email" placeholder="Correo electrónico" required
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password" placeholder="Contraseña" required minLength={6}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
          />
          <input
            type="password" placeholder="Confirmar contraseña" required minLength={6}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3"
            value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })}
          />
          <button type="submit" disabled={loading} className="w-full py-3 bg-lime-600 text-white font-bold rounded-xl hover:bg-lime-700 shadow-lg shadow-lime-500/30 transition-all disabled:opacity-50 mt-4">
            {loading ? 'Creando...' : 'Crear cuenta'}
          </button>
        </form>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-6">
          ¿Ya tienes cuenta? <Link to="/admin" className="font-semibold text-lime-600 hover:text-lime-700">Inicia sesión</Link>
        </p>
      </div>
      <Dialog {...dialog} />
    </div>
  );
}
