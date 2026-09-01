import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import TicketMark from './landing/TicketMark';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await fetch('/api/forgot_password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // La respuesta del servidor es siempre genérica (no revela si el correo
      // existe), así que siempre avanzamos a la pantalla de "revisa tu correo".
      navigate(`/recuperar-contrasena/enviado?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError('Error de conexión con el servidor.');
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
        <h2 className="text-2xl font-bold text-center mb-2">Recupera tu contraseña</h2>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mb-8">Te enviamos un enlace a tu correo para crear una nueva.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email" placeholder="Correo electrónico" required
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3"
            value={email} onChange={e => setEmail(e.target.value)}
          />
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-lime-600 text-white font-bold rounded-xl hover:bg-lime-700 shadow-lg shadow-lime-500/30 transition-all disabled:opacity-50 mt-4">
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-6">
          <Link to="/admin" className="font-semibold text-lime-600 hover:text-lime-700">Volver a iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
