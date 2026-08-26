import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import Dialog from './Dialog';
import AdminRaffleSidebar from './AdminRaffleSidebar';
import { ArrowLeft, ImagePlus, X, Check } from 'lucide-react';
import { RAFFLE_THEMES, DEFAULT_THEME_KEY, NUMBER_STYLES, DEFAULT_NUMBER_STYLE_KEY } from '../utils/raffleTheme';

export default function AdminRaffleDesign() {
  const { id } = useParams();
  const [raffle, setRaffle] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [themeColor, setThemeColor] = useState(DEFAULT_THEME_KEY);
  const [numberStyle, setNumberStyle] = useState(DEFAULT_NUMBER_STYLE_KEY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [dialog, setDialog] = useState({ open: false });
  const showAlert = (title, message, type = 'alert') =>
    new Promise(resolve =>
      setDialog({ open: true, type, title, message, onConfirm: () => { setDialog({ open: false }); resolve(true); }, onCancel: () => { setDialog({ open: false }); resolve(false); } })
    );

  useEffect(() => { fetchRaffle(); }, [id]);

  const fetchRaffle = async () => {
    try {
      const res = await fetch(`/api/admin_dashboard.php?id=${id}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setRaffle(data.raffle);
        setImagePreview(data.raffle.background_image || null);
        setRemoveImage(false);
        setImageFile(null);
        setThemeColor(data.raffle.theme_color || DEFAULT_THEME_KEY);
        setNumberStyle(data.raffle.number_style || DEFAULT_NUMBER_STYLE_KEY);
      }
    } catch (err) { console.error(err); }
  };

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setRemoveImage(false);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/admin_update_raffle_design.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ raffle_id: id, theme_color: themeColor, number_style: numberStyle, remove_image: removeImage }),
      });
      const data = await res.json();
      if (!data.success) {
        showAlert('Error al guardar', data.error || 'No se pudo guardar el diseño', 'alert');
        setSaving(false);
        return;
      }

      if (imageFile) {
        const fd = new FormData();
        fd.append('raffle_id', id);
        fd.append('image', imageFile);
        fd.append('target', 'background');
        const imgRes = await fetch('/api/admin_upload_raffle_image.php', { method: 'POST', credentials: 'include', body: fd });
        const imgData = await imgRes.json();
        if (!imgData.success) {
          showAlert('Diseño guardado, pero falló la imagen', imgData.error, 'alert');
        }
      }

      await fetchRaffle();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      showAlert('Error', 'Error de conexión.', 'alert');
    }
    setSaving(false);
  };

  const theme = RAFFLE_THEMES[themeColor] || RAFFLE_THEMES[DEFAULT_THEME_KEY];
  const previewShapeClass = (NUMBER_STYLES[numberStyle] || NUMBER_STYLES[DEFAULT_NUMBER_STYLE_KEY]).className;

  return (
    <div className="min-h-screen font-sans pb-12">
      <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link to="/admin" className="flex items-center gap-2 font-bold text-lg text-zinc-500 hover:text-blue-500">
            <ArrowLeft /> Volver al Inicio
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 mt-10 flex flex-col md:flex-row gap-6">
        <AdminRaffleSidebar id={id} raffle={raffle} activeSection="design" />

        {raffle && (
          <div className="flex-1 min-w-0 space-y-6 max-w-2xl">
            <div>
              <h3 className="font-bold text-xl mb-1">Diseño</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                Personaliza cómo se ve tu rifa para el público: imagen de fondo, color del tema y estilo de los números.
              </p>
            </div>

            {/* Imagen de fondo */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <h4 className="font-bold mb-1">Imagen de fondo</h4>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
                Se muestra en grande en la página pública de tu rifa. Se optimiza automáticamente a WebP.
              </p>

              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden h-48 border border-zinc-200 dark:border-zinc-800">
                  <img src={imagePreview} alt="Fondo de la rifa" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <button
                    type="button" onClick={handleRemoveImage}
                    className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-zinc-900/90 rounded-full text-red-500 hover:text-red-700 shadow-sm"
                    title="Quitar imagen"
                  >
                    <X size={16} />
                  </button>
                  <label className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/90 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-white dark:hover:bg-zinc-900 shadow-sm">
                    <ImagePlus size={13} /> Cambiar
                    <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleImagePick} />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 h-48 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 cursor-pointer hover:border-blue-400 hover:text-blue-500 transition-colors">
                  <ImagePlus size={26} />
                  <span className="text-sm font-medium">Subir imagen (JPG, PNG, WebP)</span>
                  <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleImagePick} />
                </label>
              )}
            </div>

            {/* Color del tema */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <h4 className="font-bold mb-1">Color del tema</h4>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
                Se usa en los botones, números seleccionados y acentos de la página pública.
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {Object.entries(RAFFLE_THEMES).map(([key, t]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setThemeColor(key)}
                    className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                      themeColor === key
                        ? 'border-zinc-900 dark:border-white ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 ring-zinc-900 dark:ring-white'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div
                      className="w-full h-10 rounded-xl shadow-sm flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${t.c1}, ${t.c2})` }}
                    >
                      {themeColor === key && <Check size={16} className="text-white drop-shadow" />}
                    </div>
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Estilo de los números */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <h4 className="font-bold mb-1">Estilo de los números</h4>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
                La forma de las casillas de números en la grilla pública.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(NUMBER_STYLES).map(([key, s]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setNumberStyle(key)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                      numberStyle === key
                        ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 flex items-center justify-center font-mono text-xs font-bold text-white shadow-sm ${s.className}`}
                      style={{ background: `linear-gradient(135deg, ${theme.c1}, ${theme.c2})` }}
                    >
                      07
                    </div>
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Vista previa */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <h4 className="font-bold mb-4">Vista previa</h4>
              <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 h-40">
                {imagePreview ? (
                  <img src={imagePreview} alt="Vista previa" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-950" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  <div className="flex gap-2 mb-3">
                    {[7, 14, 23].map(n => (
                      <div
                        key={n}
                        className={`w-10 h-10 flex items-center justify-center font-mono text-xs font-bold text-white shadow-lg ${previewShapeClass}`}
                        style={{ background: `linear-gradient(135deg, ${theme.c1}, ${theme.c2})` }}
                      >
                        {n.toString().padStart(2, '0')}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="self-start px-4 py-2 rounded-xl font-bold text-sm text-white shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${theme.c1}, ${theme.c2})` }}
                  >
                    Elegir al azar
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              {saved && <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Guardado ✓</span>}
            </div>
          </div>
        )}
      </div>

      <Dialog {...dialog} />
    </div>
  );
}
