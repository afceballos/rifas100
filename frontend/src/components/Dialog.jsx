import React, { useEffect } from 'react';
import { AlertTriangle, Info, CheckCircle, X } from 'lucide-react';

/**
 * Dialog — reemplaza alert() y confirm() del navegador.
 *
 * Modos:
 *   alert   → solo botón "Aceptar"
 *   confirm → botones "Cancelar" + acción destructiva/confirmar
 *
 * Props:
 *   open        {boolean}
 *   type        'alert' | 'confirm' | 'danger'   (danger = confirm con botón rojo)
 *   title       {string}
 *   message     {string}
 *   confirmText {string}  default 'Confirmar'
 *   cancelText  {string}  default 'Cancelar'
 *   onConfirm   {fn}
 *   onCancel    {fn}
 */
export default function Dialog({
  open,
  type = 'alert',
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
}) {
  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape' && onCancel) onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  const icons = {
    alert:   <Info      size={22} className="text-blue-500"   />,
    confirm: <AlertTriangle size={22} className="text-orange-500" />,
    danger:  <AlertTriangle size={22} className="text-red-500"    />,
    success: <CheckCircle   size={22} className="text-emerald-500" />,
  };

  const confirmBtnClass = {
    alert:   'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200',
    confirm: 'bg-orange-500 text-white hover:bg-orange-600',
    danger:  'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={type !== 'alert' ? onCancel : undefined}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {icons[type]}
            <h3 className="font-bold text-base text-zinc-900 dark:text-white">{title}</h3>
          </div>
          {onCancel && (
            <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors -mt-0.5">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Mensaje */}
        {message && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">{message}</p>
        )}

        {/* Botones */}
        <div className="flex gap-3 justify-end">
          {type !== 'alert' && onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${confirmBtnClass[type]}`}
          >
            {type === 'alert' ? 'Aceptar' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
