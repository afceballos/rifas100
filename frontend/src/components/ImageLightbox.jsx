import React from 'react';
import { X, Download } from 'lucide-react';

// Overlay grande para ver una imagen (comprobante, portada de la rifa, etc.)
// con más detalle, con opción de descargarla.
export default function ImageLightbox({ src, alt = 'Imagen', onClose }) {
  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        title="Cerrar"
        className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X size={20} />
      </button>

      <img
        src={src}
        alt={alt}
        onClick={e => e.stopPropagation()}
        className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain"
      />

      <a
        href={src}
        download
        onClick={e => e.stopPropagation()}
        className="absolute bottom-6 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-zinc-900 text-sm font-bold shadow-lg hover:bg-zinc-100 transition-colors"
      >
        <Download size={16} /> Descargar
      </a>
    </div>
  );
}
