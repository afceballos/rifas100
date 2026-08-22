import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Settings, Home, LogOut } from 'lucide-react';

const itemClass = "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors";
const labelClass = "px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500";

// Se muestra solo si `me` viene con sesión activa (el padre ya resolvió /api/me.php).
// Si se pasa raffleSlug, comprueba si esa rifa pertenece al tenant logueado
// para ofrecer un acceso directo a su Administración/Ajustes.
export default function AccountMenuSection({ me, raffleSlug, onClose, onLoggedOut }) {
  const [raffleId, setRaffleId] = useState(null);

  useEffect(() => {
    if (!me || !raffleSlug) { setRaffleId(null); return; }
    let cancelled = false;
    fetch(`/api/my_raffle_access.php?slug=${encodeURIComponent(raffleSlug)}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (!cancelled && data.success) setRaffleId(data.raffle_id); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [me, raffleSlug]);

  if (!me) return null;

  const handleLogout = async () => {
    try {
      await fetch('/api/logout.php', { credentials: 'include' });
    } catch { /* no crítico */ }
    onClose?.();
    onLoggedOut?.();
  };

  return (
    <>
      {raffleId && (
        <>
          <div className="border-t border-zinc-100 dark:border-zinc-800 mt-1" />
          <p className={labelClass}>Administrador</p>
          <Link to={`/admin/raffle/${raffleId}`} onClick={onClose} className={itemClass}>
            <LayoutDashboard size={16} /> Administración
          </Link>
          <Link to={`/admin/raffle/${raffleId}/ajustes`} onClick={onClose} className={itemClass}>
            <Settings size={16} /> Ajustes
          </Link>
        </>
      )}

      <div className="border-t border-zinc-100 dark:border-zinc-800 mt-1" />
      <p className={labelClass}>Mi cuenta</p>
      <Link to="/admin" onClick={onClose} className={itemClass}>
        <Home size={16} /> Mis rifas
      </Link>
      <button onClick={handleLogout} className={itemClass}>
        <LogOut size={16} /> Cerrar sesión
      </button>
    </>
  );
}
