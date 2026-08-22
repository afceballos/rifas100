import React, { useState } from 'react';
import { X, Search, Hash, Mail, Phone } from 'lucide-react';

const SEARCH_TYPES = [
  { key: 'ticket', label: 'Número', icon: Hash },
  { key: 'email', label: 'Correo', icon: Mail },
  { key: 'phone', label: 'Teléfono', icon: Phone },
];

const formatResultDate = (value) => {
  if (!value) return '';
  const d = new Date(value.replace(/-/g, '/'));
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').toUpperCase();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${day} ${month} ${d.getFullYear()} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
};

export default function VerifyParticipationModal({ raffle, pad, onClose }) {
  const [searchType, setSearchType] = useState('ticket');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState([]);

  const switchType = (type) => {
    setSearchType(type);
    setQuery('');
    setSearched(false);
    setResults([]);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (query.trim() === '') return;
    setLoading(true);
    setSearched(false);
    setResults([]);
    try {
      const res = await fetch(`/api/verify_participation.php?raffle_id=${raffle.id}&type=${searchType}&query=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (data.success) setResults(data.results || []);
    } catch {
      setResults([]);
    }
    setSearched(true);
    setLoading(false);
  };

  const inputProps = searchType === 'email'
    ? { type: 'email', placeholder: 'tu@correo.com' }
    : searchType === 'phone'
      ? { type: 'tel', placeholder: '+00 0000000' }
      : { type: 'number', min: '0', placeholder: pad ? '0'.repeat(pad) : 'Número de boleto' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-zinc-900 p-8 rounded-3xl max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Verifica tu participación</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Busca tus boletos por número, correo o teléfono para comprobar el estado de tu participación.</p>

        <div className="flex gap-1.5 mb-3">
          {SEARCH_TYPES.map(({ key, label, icon: Icon }) => (
            <button
              key={key} type="button" onClick={() => switchType(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                searchType === key
                  ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-md shadow-blue-500/20'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="space-y-3">
          <input
            required
            {...inputProps}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            value={query} onChange={e => setQuery(e.target.value)}
          />
          <button
            type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-violet-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <Search size={16} /> {loading ? 'Consultando...' : 'Consultar'}
          </button>
        </form>

        {searched && (
          <div className="mt-6">
            {results.length > 0 ? (
              <>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                  {results.length} boleto{results.length === 1 ? '' : 's'} encontrado{results.length === 1 ? '' : 's'} para <span className="font-bold text-zinc-900 dark:text-white">{query}</span>
                </p>
                <div className="space-y-3">
                  {results.map(result => (
                    <div key={result.ticket_number} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 space-y-2 text-sm">
                      <div className="flex justify-between gap-3"><span className="text-zinc-500 dark:text-zinc-400 font-medium">Nombre</span><span className="font-semibold text-right">{result.buyer_name}</span></div>
                      <div className="flex justify-between gap-3"><span className="text-zinc-500 dark:text-zinc-400 font-medium">Fecha</span><span className="font-semibold text-right">{formatResultDate(result.updated_at)}</span></div>
                      <div className="flex justify-between gap-3"><span className="text-zinc-500 dark:text-zinc-400 font-medium">Teléfono</span><span className="font-mono font-semibold text-right">{result.buyer_phone}</span></div>
                      <div className="flex justify-between gap-3"><span className="text-zinc-500 dark:text-zinc-400 font-medium">Número</span><span className="font-mono font-semibold text-right">{result.ticket_number.toString().padStart(pad || 2, '0')}</span></div>
                      <div className="flex justify-between gap-3">
                        <span className="text-zinc-500 dark:text-zinc-400 font-medium">Estado</span>
                        <span className={`font-bold text-right ${result.status === 'PAGADO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>{result.status}</span>
                      </div>
                      <div className="flex justify-between gap-3"><span className="text-zinc-500 dark:text-zinc-400 font-medium">Código</span><span className="font-mono font-semibold text-right">{result.code}</span></div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-dashed border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500 dark:text-zinc-400 text-center">
                No se encontraron resultados para <span className="font-bold">{query}</span>.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
