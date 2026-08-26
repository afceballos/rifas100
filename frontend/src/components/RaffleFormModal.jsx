import React, { useState } from 'react';
import { ImagePlus, X, UserCircle2 } from 'lucide-react';

const mysqlToDatetimeLocal = (value) => {
  if (!value) return '';
  return value.replace(' ', 'T').slice(0, 16);
};

const pad2 = n => String(n).padStart(2, '0');

// Primer día habilitado en el selector: mañana a las 00:00 (hora local),
// para que solo se puedan elegir fechas posteriores a hoy.
const getMinDrawDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

export default function RaffleFormModal({ mode, raffle, onClose, onSaved, showAlert }) {
  const isEdit = mode === 'edit';

  const [form, setForm] = useState({
    title: raffle?.title || '',
    price_per_ticket: raffle?.price_per_ticket || '',
    draw_date: isEdit ? mysqlToDatetimeLocal(raffle?.draw_date) : '',
    digits: '2',
    description: raffle?.description || '',
    organizer_name: raffle?.organizer_name || '',
    organizer_phone: raffle?.organizer_phone || '',
    organizer_email: raffle?.organizer_email || '',
  });
  const [organizerFile, setOrganizerFile] = useState(null);
  const [organizerPreview, setOrganizerPreview] = useState(raffle?.organizer_photo || null);
  const [removeOrganizerPhoto, setRemoveOrganizerPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const digitsLabel = raffle ? Math.max(2, String(Math.max(0, raffle.total_tickets - 1)).length) : null;

  const handleOrganizerPhotoPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOrganizerFile(file);
    setRemoveOrganizerPhoto(false);
    setOrganizerPreview(URL.createObjectURL(file));
  };

  const handleRemoveOrganizerPhoto = () => {
    setOrganizerFile(null);
    setOrganizerPreview(null);
    setRemoveOrganizerPhoto(true);
  };

  const uploadImage = async (raffleId, file, target = 'background') => {
    const fd = new FormData();
    fd.append('raffle_id', raffleId);
    fd.append('image', file);
    fd.append('target', target);
    const res = await fetch('/api/admin_upload_raffle_image.php', {
      method: 'POST',
      credentials: 'include',
      body: fd,
    });
    return res.json();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEdit) {
        const res = await fetch('/api/admin_update_raffle.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            raffle_id: raffle.id,
            title: form.title,
            price_per_ticket: form.price_per_ticket,
            draw_date: form.draw_date,
            description: form.description,
            organizer_name: form.organizer_name,
            organizer_phone: form.organizer_phone,
            organizer_email: form.organizer_email,
            remove_organizer_photo: removeOrganizerPhoto,
          }),
        });
        const data = await res.json();
        if (!data.success) {
          showAlert?.('Error al guardar', data.error, 'alert');
          setSubmitting(false);
          return;
        }
        if (organizerFile) {
          const orgData = await uploadImage(raffle.id, organizerFile, 'organizer');
          if (!orgData.success) {
            showAlert?.('Sorteo actualizado, pero falló la foto del organizador', orgData.error, 'alert');
          }
        }
      } else {
        const res = await fetch('/api/admin_create_raffle.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!data.success) {
          showAlert?.('Error al crear', data.error, 'alert');
          setSubmitting(false);
          return;
        }
        if (organizerFile) {
          const orgData = await uploadImage(data.raffle_id, organizerFile, 'organizer');
          if (!orgData.success) {
            showAlert?.('Sorteo creado, pero falló la foto del organizador', orgData.error, 'alert');
          }
        }
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
        <h2 className="text-2xl font-bold mb-6">{isEdit ? 'Editar Sorteo' : 'Nuevo Sorteo'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text" placeholder="Nombre del Sorteo" required
            className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent"
            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
          />

          <textarea
            placeholder="Descripción (opcional) — cuéntale a la gente de qué trata la rifa"
            rows={3}
            className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent resize-none"
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
          />

          <input
            type="number" step="0.01" placeholder="Precio por boleto ($)" required
            className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent"
            value={form.price_per_ticket} onChange={e => setForm({ ...form, price_per_ticket: e.target.value })}
          />

          <div>
            <label className="block text-sm mb-2 text-zinc-500">Fecha y hora del sorteo</label>
            <input
              type="datetime-local" required
              min={getMinDrawDate()}
              className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent"
              value={form.draw_date} onChange={e => setForm({ ...form, draw_date: e.target.value })}
            />
          </div>

          {isEdit ? (
            <div className="text-sm text-zinc-500 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3">
              Cifras: <span className="font-mono font-bold">{digitsLabel}</span> (fijo, no editable tras la creación)
            </div>
          ) : (
            <div>
              <label className="block text-sm mb-2 text-zinc-500">Cantidad de Cifras (Boletos)</label>
              <select
                className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent"
                value={form.digits} onChange={e => setForm({ ...form, digits: e.target.value })}
              >
                <option value="2">2 Cifras (100 boletos: 00-99)</option>
                <option value="3">3 Cifras (1,000 boletos: 000-999)</option>
                <option value="4">4 Cifras (10,000 boletos: 0000-9999)</option>
              </select>
            </div>
          )}

          {isEdit && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 -mt-1">
              La imagen de fondo, el color y el estilo de los números se configuran en Ajustes → Diseño.
            </p>
          )}

          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
            <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Organizador</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 -mt-2">Se muestra en el popup de contacto del sorteo público.</p>
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                {organizerPreview ? (
                  <img src={organizerPreview} alt="Organizador" className="w-14 h-14 rounded-full object-cover border border-zinc-200 dark:border-zinc-800" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white">
                    <UserCircle2 size={26} />
                  </div>
                )}
                {organizerPreview && (
                  <button
                    type="button" onClick={handleRemoveOrganizerPhoto}
                    className="absolute -top-1 -right-1 p-1 bg-white dark:bg-zinc-900 rounded-full text-red-500 hover:text-red-700 shadow-sm border border-zinc-200 dark:border-zinc-800"
                    title="Quitar foto"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <input
                  type="text" placeholder="Nombre del organizador"
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent"
                  value={form.organizer_name} onChange={e => setForm({ ...form, organizer_name: e.target.value })}
                />
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-500 cursor-pointer hover:text-blue-600">
                  <ImagePlus size={14} /> {organizerPreview ? 'Cambiar foto' : 'Subir foto'}
                  <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleOrganizerPhotoPick} />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="tel" placeholder="Teléfono de contacto (opcional)"
                className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
                value={form.organizer_phone} onChange={e => setForm({ ...form, organizer_phone: e.target.value })}
              />
              <input
                type="email" placeholder="Correo de contacto (opcional)"
                className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
                value={form.organizer_email} onChange={e => setForm({ ...form, organizer_email: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold">Cancelar</button>
            <button type="submit" disabled={submitting} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">
              {submitting ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Bóveda'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
