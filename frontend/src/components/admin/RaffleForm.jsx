import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const digitOptions = [
  { value: 2, label: '2 cifras', total: 100, range: '00–99' },
  { value: 3, label: '3 cifras', total: 1000, range: '000–999' },
  { value: 4, label: '4 cifras', total: 10000, range: '0000–9999' },
];

/**
 * Modal form used both for creating a new raffle and editing an existing one.
 * Props:
 *   - raffle: optional existing raffle object (when editing)
 *   - onClose(): close modal
 *   - onSaved(): callback after successful save (parent reloads)
 */
export default function RaffleForm({ raffle, onClose, onSaved }) {
  const isEdit = !!raffle;

  const [title, setTitle] = useState(raffle?.title || '');
  const [description, setDescription] = useState(raffle?.description || '');
  const [price, setPrice] = useState(raffle?.price_per_ticket ?? '');
  const [drawDate, setDrawDate] = useState(() => {
    if (!raffle?.draw_date) return '';
    const d = new Date(raffle.draw_date);
    if (isNaN(d.getTime())) return '';
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [digits, setDigits] = useState(raffle?.digits || 3);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const total = Math.pow(10, digits);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('El título es obligatorio.'); return; }
    if (!price || Number(price) <= 0) { setError('El precio debe ser mayor a 0.'); return; }
    if (!drawDate) { setError('La fecha del sorteo es obligatoria.'); return; }

    setSaving(true);
    try {
      const payload = {
        action: isEdit ? 'update' : 'create',
        title: title.trim(),
        description: description.trim(),
        price_per_ticket: Number(price),
        draw_date: drawDate,
      };
      if (isEdit) {
        payload.raffle_id = raffle.id;
      } else {
        payload.digits = digits;
      }
      const res = await fetch('/api/admin_raffle_action.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Error al guardar.');
      } else {
        onSaved();
        onClose();
      }
    } catch {
      setError('Error de conexión.');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 z-10">
          <X size={18} />
        </button>
        <div className="p-8">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1">
            {isEdit ? 'Editar rifa' : 'Nueva rifa'}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            {isEdit ? 'Modifica los datos de la rifa.' : 'Crea una rifa en estado de borrador. Podrás publicarla cuando quieras.'}
          </p>

          {error && (
            <div className="mb-6 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300">Título <span className="text-blue-500">*</span></label>
              <input required type="text"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/50"
                value={title} onChange={e => setTitle(e.target.value)} placeholder="Gran Sorteo de Verano" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300">Descripción</label>
              <textarea rows={3}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                value={description} onChange={e => setDescription(e.target.value)} placeholder="¿Qué se sortea? ¿Cuáles son las reglas?" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300">Precio por boleto <span className="text-blue-500">*</span></label>
                <input required type="number" min="0" step="0.01"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/50"
                  value={price} onChange={e => setPrice(e.target.value)} placeholder="10.00" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300">Fecha del sorteo <span className="text-blue-500">*</span></label>
                <input required type="datetime-local"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/50"
                  value={drawDate} onChange={e => setDrawDate(e.target.value)} />
              </div>
            </div>

            {!isEdit && (
              <div>
                <label className="block text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-300">Cifras del boleto</label>
                <div className="grid grid-cols-3 gap-3">
                  {digitOptions.map(opt => (
                    <button type="button" key={opt.value}
                      onClick={() => setDigits(opt.value)}
                      className={`p-4 rounded-2xl border-2 transition-all text-left ${
                        digits === opt.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}>
                      <div className="font-bold text-zinc-900 dark:text-white">{opt.label}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        {opt.total.toLocaleString()} boletos ({opt.range})
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                  Se generarán <strong className="text-zinc-900 dark:text-white">{total.toLocaleString()}</strong> boletos automáticamente al crear la rifa.
                </div>
              </div>
            )}

            <div className="pt-4 flex gap-3 justify-end">
              <button type="button" onClick={onClose}
                className="px-5 py-3 rounded-xl text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-60">
                <Save size={18} /> {saving ? 'Guardando...' : (isEdit ? 'Guardar cambios' : 'Crear rifa')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
