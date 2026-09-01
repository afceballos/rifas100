import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import TicketMark from './landing/TicketMark';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(token ? 'form' : 'error'); // 'form' | 'success' | 'error'
  const [message, setMessage] = useState(token ? '' : 'Enlace de restablecimiento inválido.');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/reset_password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.message);
      }
    } catch {
      setError('Error de conexión con el servidor.');
    }
    setLoading(false);
  };

  if (status !== 'form') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 p-10 rounded-3xl max-w-sm w-full shadow-2xl text-center">
          <div className="flex items-center justify-center gap-2 font-mono font-bold text-xl tracking-tight mb-6">
            <TicketMark className="h-6 w-auto text-raffle-greenDark dark:text-raffle-green" />
            <span>TICKET<span className="text-raffle-greenDark dark:text-raffle-green">100</span></span>
          </div>
          <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${status === 'success' ? 'bg-lime-50 dark:bg-lime-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
            {status === 'success' ? <CheckCircle2 size={26} className="text-lime-600 dark:text-lime-400" /> : <XCircle size={26} className="text-red-500" />}
          </div>
          <h2 className="text-2xl font-bold mb-2">{status === 'success' ? '¡Contraseña actualizada!' : 'No se pudo restablecer'}</h2>
          {message && <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>}
          <div className="mt-6 flex flex-col gap-2">
            <Link to="/admin" className="text-sm font-semibold text-lime-600 hover:text-lime-700">Ir a iniciar sesión</Link>
            {status === 'error' && (
              <Link to="/recuperar-contrasena" className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">Solicitar un enlace nuevo</Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 p-10 rounded-3xl max-w-sm w-full shadow-2xl">
        <div className="flex items-center justify-center gap-2 font-mono font-bold text-xl tracking-tight mb-6">
          <TicketMark className="h-6 w-auto text-raffle-greenDark dark:text-raffle-green" />
          <span>TICKET<span className="text-raffle-greenDark dark:text-raffle-green">100</span></span>
        </div>
        <h2 className="text-2xl font-bold text-center mb-2">Crea una nueva contraseña</h2>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mb-8">Elige una contraseña nueva para tu cuenta.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password" placeholder="Nueva contraseña" required minLength={6}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3"
            value={password} onChange={e => setPassword(e.target.value)}
          />
          <input
            type="password" placeholder="Confirmar contraseña" required minLength={6}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3"
            value={confirm} onChange={e => setConfirm(e.target.value)}
          />
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-lime-600 text-white font-bold rounded-xl hover:bg-lime-700 shadow-lg shadow-lime-500/30 transition-all disabled:opacity-50 mt-4">
            {loading ? 'Guardando...' : 'Restablecer contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
