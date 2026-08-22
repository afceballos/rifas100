import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { ArrowLeft, Building2, Ticket, Users } from 'lucide-react';

export default function SuperAdmin() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/superadmin_overview.php', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setTenants(data.tenants);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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

      <div className="max-w-6xl mx-auto px-6 mt-10">
        <h1 className="text-3xl font-bold mb-1">Super Admin</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">Todas las personas registradas y sus rifas.</p>

        {loading ? (
          <div className="text-center text-zinc-500 py-12">Cargando...</div>
        ) : tenants.length === 0 ? (
          <div className="text-center text-zinc-500 py-12">Aún no hay registros.</div>
        ) : (
          <div className="space-y-6">
            {tenants.map(t => (
              <div key={t.id} className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-500">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{t.name}</h3>
                      <p className="text-xs text-zinc-400">Registrado: {new Date(t.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5"><Users size={14} /> {t.users.length}</span>
                    <span className="flex items-center gap-1.5"><Ticket size={14} /> {t.raffles.length}</span>
                  </div>
                </div>

                {t.users.length > 0 && (
                  <div className="px-6 py-3 flex flex-wrap gap-2 border-b border-zinc-100 dark:border-zinc-800/50">
                    {t.users.map(u => (
                      <span key={u.username} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {u.username} {u.role === 'super_admin' && '· super admin'}
                        {u.email && <span className="font-normal text-zinc-400"> · {u.email}</span>}
                      </span>
                    ))}
                  </div>
                )}

                {t.raffles.length === 0 ? (
                  <p className="px-6 py-6 text-sm text-zinc-500 text-center">Sin rifas creadas.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 text-xs uppercase font-semibold">
                          <th className="px-6 py-3">Rifa</th>
                          <th className="px-6 py-3">Boletos</th>
                          <th className="px-6 py-3">Vendidos</th>
                          <th className="px-6 py-3">Estado</th>
                          <th className="px-6 py-3">Creada</th>
                        </tr>
                      </thead>
                      <tbody>
                        {t.raffles.map(r => (
                          <tr key={r.id} className="border-t border-zinc-100 dark:border-zinc-800/50">
                            <td className="px-6 py-3 font-medium">
                              {r.slug ? (
                                <a href={`/sorteo/${r.slug}`} target="_blank" rel="noreferrer" className="hover:text-blue-500">{r.title}</a>
                              ) : r.title}
                            </td>
                            <td className="px-6 py-3 font-mono">{r.total_tickets}</td>
                            <td className="px-6 py-3 font-mono">{r.reserved_count + r.reviewing_count + r.paid_count}</td>
                            <td className="px-6 py-3">
                              {r.is_published
                                ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">Publicada</span>
                                : <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">Oculta</span>
                              }
                            </td>
                            <td className="px-6 py-3 text-zinc-500">{new Date(r.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
