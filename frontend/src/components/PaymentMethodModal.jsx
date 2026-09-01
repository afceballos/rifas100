import React, { useState } from 'react';
import { Trash2, Plus, X, Link2 } from 'lucide-react';
import { parsePaymentMethods } from '../utils/paymentInfo';

const METHOD_OPTIONS = ['Transferencia', 'Pago Móvil', 'Zelle', 'PayPal', 'Binance / Cripto', 'Efectivo', 'Otro'];
const DETAIL_TYPES = ['Cuenta', 'Número', 'Cédula/RIF', 'Teléfono', 'Correo', 'Alias/Usuario', 'Banco', 'Otro'];

const blankMethod = () => ({ method: METHOD_OPTIONS[0], institution: '', details: [{ type: 'Cuenta', value: '' }], description: '' });

export default function PaymentMethodModal({ raffle, onClose, onSaved, showAlert }) {
  const existing = parsePaymentMethods(raffle?.payment_info);

  const [methods, setMethods] = useState(existing.length ? existing : [blankMethod()]);
  const [onlinePaymentLink, setOnlinePaymentLink] = useState(raffle?.online_payment_link || '');
  const [submitting, setSubmitting] = useState(false);

  const updateMethod = (index, field, value) => {
    setMethods(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const addMethod = () => setMethods(prev => [...prev, blankMethod()]);
  const removeMethod = (index) => setMethods(prev => prev.filter((_, i) => i !== index));

  const updateDetail = (mIndex, dIndex, field, value) => {
    setMethods(prev => prev.map((m, i) => i === mIndex
      ? { ...m, details: m.details.map((d, j) => j === dIndex ? { ...d, [field]: value } : d) }
      : m
    ));
  };

  const addDetail = (mIndex) => {
    setMethods(prev => prev.map((m, i) => i === mIndex ? { ...m, details: [...m.details, { type: 'Cuenta', value: '' }] } : m));
  };

  const removeDetail = (mIndex, dIndex) => {
    setMethods(prev => prev.map((m, i) => i === mIndex ? { ...m, details: m.details.filter((_, j) => j !== dIndex) } : m));
  };

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
          payment_methods: methods,
          online_payment_link: onlinePaymentLink.trim(),
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative min-h-full flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-zinc-900 p-8 rounded-3xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 my-8">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold">Métodos de pago</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-2xl border border-lime-200 dark:border-lime-900/50 bg-lime-50/60 dark:bg-lime-500/5 space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              <Link2 size={15} /> Link de pago en línea (opcional)
            </label>
            <input
              type="url" placeholder="https://checkout.wompi.co/l/tu-link"
              className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm"
              value={onlinePaymentLink} onChange={e => setOnlinePaymentLink(e.target.value)}
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Pega tu propio link de pago (Wompi, ePayco, PayU, etc.). El dinero llega directo a tu cuenta — esta plataforma no lo toca. Si lo llenas, el comprador verá un botón "Pagar en línea" antes de los métodos manuales.
            </p>
          </div>

          {methods.map((m, mIndex) => (
            <div key={mIndex} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Método {mIndex + 1}</p>
                <button
                  type="button" onClick={() => removeMethod(mIndex)}
                  disabled={methods.length === 1}
                  title="Quitar método"
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1.5 text-zinc-500">Método</label>
                  <select
                    required
                    className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent"
                    value={m.method} onChange={e => updateMethod(mIndex, 'method', e.target.value)}
                  >
                    {METHOD_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1.5 text-zinc-500">Institución</label>
                  <input
                    type="text" placeholder="Inst. o plataforma"
                    className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent"
                    value={m.institution} onChange={e => updateMethod(mIndex, 'institution', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {m.details.map((d, dIndex) => (
                  <div key={dIndex} className="flex gap-2 items-center">
                    <select
                      className="w-28 shrink-0 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
                      value={d.type} onChange={e => updateDetail(mIndex, dIndex, 'type', e.target.value)}
                    >
                      {DETAIL_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <input
                      type="text" placeholder="0123456"
                      className="flex-1 min-w-0 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm"
                      value={d.value} onChange={e => updateDetail(mIndex, dIndex, 'value', e.target.value)}
                    />
                    <button
                      type="button" onClick={() => removeDetail(mIndex, dIndex)}
                      disabled={m.details.length === 1}
                      title="Quitar dato"
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button" onClick={() => addDetail(mIndex)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <Plus size={13} /> Agregar dato
                </button>
              </div>

              <input
                type="text" placeholder="Detalles (opcional)"
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
                value={m.description} onChange={e => updateMethod(mIndex, 'description', e.target.value)}
              />
            </div>
          ))}

          <button
            type="button" onClick={addMethod}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <Plus size={15} /> Agregar método de pago
          </button>

          <button
            type="submit" disabled={submitting}
            className="w-full py-3 bg-lime-600 text-white font-bold rounded-xl hover:bg-lime-700 shadow-lg shadow-lime-500/30 transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
