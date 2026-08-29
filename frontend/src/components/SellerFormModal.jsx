import React, { useState } from 'react';
import { Shuffle, X } from 'lucide-react';

// Calcula los tramos de números que todavía no tiene asignados ningún otro
// vendedor de esta rifa (excluyendo al vendedor que se está editando, si aplica).
const computeAvailableRanges = (numberStart, totalTickets, sellers, excludeSellerId) => {
  if (!totalTickets) return [];
  const maxNumber = numberStart + totalTickets - 1;
  const occupied = sellers
    .filter(s => s.id !== excludeSellerId && s.range_start != null)
    .map(s => [s.range_start, s.range_end])
    .sort((a, b) => a[0] - b[0]);

  const free = [];
  let cursor = numberStart;
  for (const [start, end] of occupied) {
    if (start > cursor) free.push([cursor, Math.min(start - 1, maxNumber)]);
    cursor = Math.max(cursor, end + 1);
  }
  if (cursor <= maxNumber) free.push([cursor, maxNumber]);
  return free.filter(([s, e]) => s <= e);
};

export default function SellerFormModal({ raffleId, seller, pad, numberStart = 0, totalTickets, sellers = [], onClose, onSaved, showAlert }) {
  const isEdit = !!seller;

  const [form, setForm] = useState({
    name: seller?.name || '',
    phone: seller?.phone || '',
    email: seller?.email || '',
    range_start: seller?.range_start != null ? String(seller.range_start).padStart(pad, '0') : '',
    range_end: seller?.range_end != null ? String(seller.range_end).padStart(pad, '0') : '',
  });
  const [mode, setMode] = useState(seller?.numbers?.length > 0 ? 'random' : 'range');
  const [randomQuantity, setRandomQuantity] = useState(seller?.numbers?.length ? String(seller.numbers.length) : '');
  const [randomNumbers, setRandomNumbers] = useState(seller?.numbers || []);
  const [drawing, setDrawing] = useState(false);
  const [drawError, setDrawError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const availableRanges = computeAvailableRanges(numberStart, totalTickets, sellers, seller?.id);

  const applyRange = (start, end) => {
    setForm(prev => ({ ...prev, range_start: String(start).padStart(pad, '0'), range_end: String(end).padStart(pad, '0') }));
  };

  const handleDrawRandom = async () => {
    const qty = parseInt(randomQuantity, 10);
    if (!qty || qty <= 0) return;
    setDrawing(true);
    setDrawError('');
    try {
      const excludeParam = seller?.id ? `&exclude_seller_id=${seller.id}` : '';
      const res = await fetch(`/api/admin_random_seller_numbers.php?raffle_id=${raffleId}&count=${qty}${excludeParam}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setRandomNumbers(data.numbers);
      } else {
        setDrawError(data.error || 'No se pudieron sortear números.');
      }
    } catch {
      setDrawError('Error de conexión con el servidor.');
    }
    setDrawing(false);
  };

  const removeRandomNumber = (n) => {
    setRandomNumbers(prev => prev.filter(x => x !== n));
  };

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
          range_start: mode === 'range' && form.range_start.trim() !== '' ? parseInt(form.range_start, 10) : null,
          range_end: mode === 'range' && form.range_end.trim() !== '' ? parseInt(form.range_end, 10) : null,
          numbers: mode === 'random' ? randomNumbers : [],
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
            <label className="block text-sm mb-2 text-zinc-500">Números asignados (opcional)</label>

            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 mb-3">
              <button
                type="button"
                onClick={() => setMode('range')}
                className={`py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'range' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`}
              >
                Rango
              </button>
              <button
                type="button"
                onClick={() => setMode('random')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'random' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`}
              >
                <Shuffle size={14} /> Aleatorio
              </button>
            </div>

            {mode === 'range' ? (
              <>
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

                {totalTickets > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Rangos disponibles en esta rifa:</p>
                    {availableRanges.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {availableRanges.map(([s, e]) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => applyRange(s, e)}
                            title="Usar este rango"
                            className="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                          >
                            {String(s).padStart(pad, '0')}–{String(e).padStart(pad, '0')} · {e - s + 1}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">No quedan rangos libres: todos los números ya están asignados a otros vendedores.</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="text" inputMode="numeric" placeholder="Cantidad de números"
                    className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-center font-mono"
                    value={randomQuantity} onChange={e => setRandomQuantity(e.target.value.replace(/\D/g, ''))}
                  />
                  <button
                    type="button"
                    onClick={handleDrawRandom}
                    disabled={drawing || !randomQuantity}
                    className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-lime-600 text-white text-sm font-semibold whitespace-nowrap disabled:opacity-50 hover:bg-lime-700 transition-colors"
                  >
                    <Shuffle size={15} /> {drawing ? 'Sorteando...' : randomNumbers.length > 0 ? 'Volver a sortear' : 'Sortear'}
                  </button>
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">
                  Elige cuántos números quieres asignarle y sortéalos al azar entre los libres de la rifa. No se cruzan con los de otros vendedores.
                </p>
                {drawError && <p className="text-xs text-red-500 mt-1.5">{drawError}</p>}

                {randomNumbers.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
                      {randomNumbers.length} número{randomNumbers.length > 1 ? 's' : ''} asignado{randomNumbers.length > 1 ? 's' : ''}:
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {randomNumbers.map(n => (
                        <span
                          key={n}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-mono font-semibold rounded-lg bg-lime-50 dark:bg-lime-500/10 text-lime-700 dark:text-lime-400 border border-lime-100 dark:border-lime-900/50"
                        >
                          {String(n).padStart(pad, '0')}
                          <button type="button" onClick={() => removeRandomNumber(n)} className="hover:text-red-500 transition-colors">
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold">Cancelar</button>
            <button type="submit" disabled={submitting} className="flex-1 py-3 bg-lime-600 text-white rounded-xl font-bold disabled:opacity-50">
              {submitting ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear vendedor'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
