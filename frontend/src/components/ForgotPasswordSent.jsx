import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import TicketMark from './landing/TicketMark';

export default function ForgotPasswordSent() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [resending, setResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const handleResend = async () => {
    if (!email || resending) return;
    setResending(true);
    try {
      await fetch('/api/forgot_password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setResendSent(true);
    } catch { /* mensaje genérico igual, ver abajo */ }
    setResending(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 p-10 rounded-3xl max-w-sm w-full shadow-2xl text-center">
        <div className="flex items-center justify-center gap-2 font-mono font-bold text-xl tracking-tight mb-6">
          <TicketMark className="h-6 w-auto text-raffle-greenDark dark:text-raffle-green" />
          <span>TICKET<span className="text-raffle-greenDark dark:text-raffle-green">100</span></span>
        </div>

        <div className="mx-auto w-14 h-14 rounded-full bg-lime-50 dark:bg-lime-500/10 flex items-center justify-center mb-4">
          <MailCheck size={26} className="text-lime-600 dark:text-lime-400" />
        </div>

        <h2 className="text-2xl font-bold mb-2">Revisa tu correo</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {email
            ? <>Si <span className="font-semibold text-zinc-700 dark:text-zinc-300">{email}</span> está registrado, te enviamos un enlace para crear una nueva contraseña.</>
            : 'Si tu correo está registrado, te enviamos un enlace para crear una nueva contraseña.'}
        </p>

        {email && (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || resendSent}
            className="mt-4 text-xs font-bold text-lime-600 dark:text-lime-400 hover:underline disabled:opacity-50"
          >
            {resendSent ? 'Enlace reenviado' : resending ? 'Enviando...' : '¿No te llegó? Reenviar enlace'}
          </button>
        )}

        <div className="mt-6">
          <Link to="/admin" className="text-sm font-semibold text-lime-600 hover:text-lime-700">
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
