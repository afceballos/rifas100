import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function SellerChangePasswordModal({ onClose, showAlert }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showAlert?.('Error', 'Las contraseñas nuevas no coinciden', 'alert');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/seller_change_password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert?.('Listo', 'Tu contraseña se actualizó correctamente', 'success');
        onClose();
      } else {
        showAlert?.('Error', data.error || 'No se pudo cambiar la contraseña', 'alert');
        setSubmitting(false);
      }
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
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold">Cambiar contraseña</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password" placeholder="Contraseña actual" required
            className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent"
            value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
          />
          <input
            type="password" placeholder="Contraseña nueva (mín. 6 caracteres)" required minLength={6}
            className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent"
            value={newPassword} onChange={e => setNewPassword(e.target.value)}
          />
          <input
            type="password" placeholder="Confirmar contraseña nueva" required minLength={6}
            className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent"
            value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold">Cancelar</button>
            <button type="submit" disabled={submitting} className="flex-1 py-3 bg-lime-600 text-white rounded-xl font-bold disabled:opacity-50">
              {submitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
