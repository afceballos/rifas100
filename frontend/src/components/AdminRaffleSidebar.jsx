import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, LayoutDashboard, Settings, Palette } from 'lucide-react';

export default function AdminRaffleSidebar({ id, raffle, activeSection }) {
  const itemClass = (active) =>
    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-colors ${
      active
        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
    }`;

  return (
    <aside className="md:w-56 shrink-0">
      <div className="mb-4 px-1">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Sorteo</p>
        <h2 className="font-bold text-zinc-900 dark:text-white truncate">{raffle?.title || 'Cargando...'}</h2>
        {raffle && !raffle.is_published && (
          <span className="inline-block mt-1 text-[10px] font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-full">Oculto</span>
        )}
      </div>

      <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
        <a
          href={raffle?.slug ? `/sorteo/${raffle.slug}` : '#'}
          target="_blank" rel="noreferrer"
          className={`${itemClass(false)} ${raffle?.slug ? '' : 'opacity-50 pointer-events-none'}`}
        >
          <ExternalLink size={16} /> Ver sorteo
        </a>

        <Link to={`/admin/raffle/${id}`} className={itemClass(activeSection === 'admin')}>
          <LayoutDashboard size={16} /> Administración
        </Link>

        <p className="hidden md:block px-3 mt-3 mb-1 text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Ajustes</p>

        <Link to={`/admin/raffle/${id}/ajustes`} className={itemClass(activeSection === 'settings')}>
          <Settings size={16} />
          <span className="md:hidden">Ajustes · General</span>
          <span className="hidden md:inline">General</span>
        </Link>

        <Link to={`/admin/raffle/${id}/ajustes/diseno`} className={itemClass(activeSection === 'design')}>
          <Palette size={16} />
          <span className="md:hidden">Ajustes · Diseño</span>
          <span className="hidden md:inline">Diseño</span>
        </Link>
      </nav>
    </aside>
  );
}
