import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { ShieldCheck, Store } from 'lucide-react';

export default function SellerLogin() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/seller_login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code, password }),
      });
      const data = await res.json();
      if (data.success) navigate('/vendedor/panel');
      else setError(data.message || 'No se pudo iniciar sesión');
    } catch (err) {
      setError('Error de conexión con el servidor.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <nav className="w-full p-4 flex justify-between items-center max-w-6xl mx-auto">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <ShieldCheck className="text-blue-500" />
          <span>Ticket<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-violet-500">Vault</span></span>
        </Link>
        <ThemeToggle />
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 p-10 rounded-3xl max-w-sm w-full shadow-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 mb-3">
              <Store size={22} />
            </div>
            <h2 className="text-2xl font-bold">Portal de Vendedores</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Ingresa con tu código y contraseña.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text" placeholder="Código de vendedor (ej. 12E648)" required
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-center font-mono uppercase tracking-widest"
              value={code} onChange={e => setCode(e.target.value.toUpperCase())}
            />
            <input
              type="password" placeholder="Contraseña" required
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3"
              value={password} onChange={e => setPassword(e.target.value)}
            />

            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-xl p-3 text-center">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-6">
            Tu código y contraseña te los da el organizador de la rifa.
          </p>
        </div>
      </div>
    </div>
  );
}
