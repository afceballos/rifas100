import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, ShieldCheck, Ticket } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Home() {
  const [raffles, setRaffles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/get_raffles.php')
      .then((response) => response.json())
      .then((data) => setRaffles(data.success ? data.raffles : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <nav className="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between"><Link to="/" className="flex items-center gap-2 font-extrabold text-xl"><ShieldCheck className="text-blue-500" /> Rifa<span className="text-blue-500">100</span></Link><ThemeToggle /></nav>
      <main className="max-w-6xl mx-auto px-5 pb-16">
        <section className="py-16 sm:py-24 grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-end">
          <div><p className="text-sm uppercase tracking-[0.25em] text-blue-500 font-bold">Sorteos transparentes</p><h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mt-5 max-w-3xl">Elige tu número. Participa con claridad.</h1><p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mt-6 leading-8">Este sistema organiza tablas de rifas, muestra los boletos disponibles en tiempo real y permite reservarlos con tus datos para que cada participación quede registrada.</p></div>
          <div className="border-l-4 border-blue-500 pl-6 py-3"><Ticket className="text-blue-500 mb-4" size={30} /><p className="text-2xl font-bold">Selecciona una rifa activa y reserva tu boleto en pocos pasos.</p></div>
        </section>
        <section><div className="flex items-end justify-between mb-6"><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500">Disponibles ahora</p><h2 className="text-3xl font-extrabold mt-2">Tablas publicadas</h2></div></div>{loading ? <p className="text-zinc-500">Cargando rifas...</p> : raffles.length === 0 ? <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-3xl p-12 text-center text-zinc-500">No hay rifas publicadas en este momento.</div> : <div className="grid md:grid-cols-2 gap-5">{raffles.map((raffle) => <article key={raffle.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm"><div className="flex justify-between gap-4"><span className="text-xs uppercase tracking-wider font-bold text-emerald-600">Publicado</span><span className="font-mono text-blue-500">{raffle.digits} cifras</span></div><h3 className="text-2xl font-extrabold mt-5">{raffle.title}</h3><p className="text-zinc-500 mt-3 min-h-12">{raffle.description || 'Participa en este sorteo.'}</p><div className="flex items-center gap-4 text-sm text-zinc-500 mt-5"><span className="flex items-center gap-2"><CalendarDays size={16} /> {new Date(raffle.draw_date.replace(' ', 'T')).toLocaleDateString()}</span><span className="font-bold text-emerald-600">${raffle.price_per_ticket}</span></div><Link to={`/sorteo/${raffle.id}`} className="mt-6 flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold">Ver boletos <ArrowRight size={18} /></Link></article>)}</div>}</section>
      </main>
    </div>
  );
}
