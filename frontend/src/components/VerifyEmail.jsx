import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import TicketMark from './landing/TicketMark';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Enlace de verificación inválido.');
      return;
    }
    fetch(`/api/verify_email.php?token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(data => {
        setStatus(data.success ? 'success' : 'error');
        setMessage(data.message);
      })
      .catch(() => {
        setStatus('error');
        setMessage('Error de conexión con el servidor.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 p-10 rounded-3xl max-w-sm w-full shadow-2xl text-center">
        <div className="flex items-center justify-center gap-2 font-mono font-bold text-xl tracking-tight mb-6">
          <TicketMark className="h-6 w-auto text-raffle-greenDark dark:text-raffle-green" />
          <span>TICKET<span className="text-raffle-greenDark dark:text-raffle-green">100</span></span>
        </div>

        <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
          status === 'success' ? 'bg-lime-50 dark:bg-lime-500/10' : status === 'error' ? 'bg-red-50 dark:bg-red-500/10' : 'bg-zinc-100 dark:bg-zinc-800'
        }`}>
          {status === 'loading' && <Loader2 size={26} className="text-zinc-400 animate-spin" />}
          {status === 'success' && <CheckCircle2 size={26} className="text-lime-600 dark:text-lime-400" />}
          {status === 'error' && <XCircle size={26} className="text-red-500" />}
        </div>

        <h2 className="text-2xl font-bold mb-2">
          {status === 'loading' ? 'Verificando...' : status === 'success' ? '¡Correo verificado!' : 'No se pudo verificar'}
        </h2>
        {message && <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>}

        {status !== 'loading' && (
          <Link to="/admin" className="inline-block mt-6 text-sm font-semibold text-lime-600 hover:text-lime-700">
            Ir a iniciar sesión
          </Link>
        )}
      </div>
    </div>
  );
}
