import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function SellerPasswordModal({ raffleId, seller, onClose, onSaved, showAlert }) {
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin_set_seller_password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ raffle_id: raffleId, seller_id: seller.id, password }),
      });
      const data = await res.json();
      if (!data.success) {
        showAlert?.('Error', data.error || 'No se pudo guardar la contraseña', 'alert');
        setSubmitting(false);
        return;
      }
      onSaved?.();
      onClose();
    } catch (err) {
      showAlert?.('Error', 'Error de conexión con el servidor.', 'alert');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative min-h-full flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-zinc-900 p-8 rounded-3xl max-w-sm w-full border border-zinc-200 dark:border-zinc-800 my-8">
        <div className="flex justify-between items-start mb-1">
          <h2 className="text-2xl font-bold">Acceso al portal</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          Define la contraseña de <span className="font-semibold text-zinc-700 dark:text-zinc-300">{seller.name}</span> ({seller.code}) para entrar a{' '}
          <span className="font-mono">{window.location.origin}/vendedor/login</span>.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text" placeholder="Nueva contraseña (mín. 6 caracteres)" required minLength={6}
            className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent"
            value={password} onChange={e => setPassword(e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold">Cancelar</button>
            <button type="submit" disabled={submitting} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50">
              {submitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
