import React, { useState } from 'react';

export default function SellerFormModal({ raffleId, seller, pad, onClose, onSaved, showAlert }) {
  const isEdit = !!seller;

  const [form, setForm] = useState({
    name: seller?.name || '',
    phone: seller?.phone || '',
    email: seller?.email || '',
    range_start: seller?.range_start != null ? String(seller.range_start).padStart(pad, '0') : '',
    range_end: seller?.range_end != null ? String(seller.range_end).padStart(pad, '0') : '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/${isEdit ? 'admin_update_seller.php' : 'admin_create_seller.php'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          raffle_id: raffleId,
          seller_id: seller?.id,
          name: form.name,
          phone: form.phone,
          email: form.email,
          range_start: form.range_start.trim() === '' ? null : parseInt(form.range_start, 10),
          range_end: form.range_end.trim() === '' ? null : parseInt(form.range_end, 10),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        showAlert?.('Error al guardar', data.error, 'alert');
        setSubmitting(false);
        return;
      }
      onSaved();
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
      <div className="relative bg-white dark:bg-zinc-900 p-8 rounded-3xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 my-8">
        <h2 className="text-2xl font-bold mb-1">{isEdit ? 'Editar vendedor' : 'Nuevo vendedor'}</h2>
        {isEdit && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 font-mono">Código: <span className="font-bold text-zinc-700 dark:text-zinc-300">{seller.code}</span></p>
        )}
        {!isEdit && <div className="mb-6" />}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text" placeholder="Nombre del vendedor" required
            className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent"
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="tel" placeholder="Teléfono (opcional)"
              className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
            />
            <input
              type="email" placeholder="Correo (opcional)"
              className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-zinc-500">Rango de números asignado (opcional)</label>
            <div className="flex items-center gap-2">
              <input
                type="text" inputMode="numeric" placeholder={'0'.padStart(pad, '0')}
                className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-center font-mono"
                value={form.range_start} onChange={e => setForm({ ...form, range_start: e.target.value.replace(/\D/g, '') })}
              />
              <span className="text-zinc-400 shrink-0">a</span>
              <input
                type="text" inputMode="numeric" placeholder={'9'.padStart(pad, '9')}
                className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-center font-mono"
                value={form.range_end} onChange={e => setForm({ ...form, range_end: e.target.value.replace(/\D/g, '') })}
              />
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">
              Déjalo vacío para que este vendedor pueda vender cualquier número de la rifa. Si lo llenas, no se puede cruzar con el rango de otro vendedor.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold">Cancelar</button>
            <button type="submit" disabled={submitting} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50">
              {submitting ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear vendedor'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
