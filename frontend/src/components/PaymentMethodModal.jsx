import React, { useState } from 'react';
import { Trash2, Plus, X } from 'lucide-react';

const METHOD_OPTIONS = ['Transferencia', 'Pago Móvil', 'Zelle', 'PayPal', 'Binance / Cripto', 'Efectivo', 'Otro'];
const DETAIL_TYPES = ['Cuenta', 'Cédula/RIF', 'Teléfono', 'Correo', 'Alias/Usuario', 'Banco', 'Otro'];

const parsePaymentInfo = (raw) => {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

export default function PaymentMethodModal({ raffle, onClose, onSaved, showAlert }) {
  const existing = parsePaymentInfo(raffle?.payment_info);

  const [method, setMethod] = useState(existing?.method || METHOD_OPTIONS[0]);
  const [institution, setInstitution] = useState(existing?.institution || '');
  const [details, setDetails] = useState(
    existing?.details?.length ? existing.details : [{ type: 'Cuenta', value: '' }]
  );
  const [description, setDescription] = useState(existing?.description || '');
  const [submitting, setSubmitting] = useState(false);

  const updateDetail = (index, field, value) => {
    setDetails(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));
  };

  const addDetail = () => setDetails(prev => [...prev, { type: 'Cuenta', value: '' }]);
  const removeDetail = (index) => setDetails(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin_update_payment_info.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          raffle_id: raffle.id,
          payment_info: { method, institution, details, description },
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSaved();
        onClose();
      } else {
        showAlert?.('Error al guardar', data.error, 'alert');
        setSubmitting(false);
      }
    } catch (err) {
      showAlert?.('Error', 'Error de conexión con el servidor.', 'alert');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 my-8">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold">Método de pago</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1.5 text-zinc-500">Método</label>
              <select
                required
                className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent"
                value={method} onChange={e => setMethod(e.target.value)}
              >
                {METHOD_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1.5 text-zinc-500">Institución</label>
              <input
                type="text" placeholder="Inst. o plataforma"
                className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent"
                value={institution} onChange={e => setInstitution(e.target.value)}
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
            <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Información</p>

            {details.map((d, i) => (
              <div key={i}>
                <label className="block text-xs mb-1.5 text-zinc-500">Dato</label>
                <div className="flex gap-2 items-center">
                  <select
                    className="w-32 shrink-0 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent"
                    value={d.type} onChange={e => updateDetail(i, 'type', e.target.value)}
                  >
                    {DETAIL_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <input
                    type="text" placeholder="0123456"
                    className="flex-1 min-w-0 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
                    value={d.value} onChange={e => updateDetail(i, 'value', e.target.value)}
                  />
                  <button
                    type="button" onClick={() => removeDetail(i)}
                    disabled={details.length === 1}
                    title="Quitar dato"
                    className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button" onClick={addDetail}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <Plus size={15} /> Agregar dato
            </button>
          </div>

          <div>
            <label className="block text-sm mb-1.5 text-zinc-500">Detalles (Opcional)</label>
            <input
              type="text" placeholder="Descripción"
              className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent"
              value={description} onChange={e => setDescription(e.target.value)}
            />
          </div>

          <button
            type="submit" disabled={submitting}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </div>
    </div>
  );
}
