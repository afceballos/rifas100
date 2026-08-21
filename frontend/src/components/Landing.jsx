import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { ShieldCheck, ChevronRight, Zap, Target, Lock } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-50 flex flex-col">
      <nav className="w-full p-6 flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-2xl tracking-tight">
          <ShieldCheck className="text-blue-500" size={32} />
          <span>Ticket<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-violet-500">Vault</span></span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link to="/admin" className="px-5 py-2 rounded-full text-sm font-semibold bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">
            Acceso Operativo
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-bold mb-8 border border-blue-200 dark:border-blue-800">
          <Zap size={16} /> Plataforma de Generación Automática
        </div>
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8">
          Gestiona tus Sorteos con <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-500">Precisión Militar.</span>
        </h1>
        <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mb-12 max-w-2xl">
          Crea múltiples grillas de rifas al instante (de 2 a 4 cifras). Gestiona reservas, controla liquidaciones en tiempo real y ofrece a tus participantes una experiencia premium y segura.
        </p>
        <Link to="/admin" className="group flex items-center gap-2 px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-lg font-bold rounded-2xl hover:scale-105 transition-all shadow-xl shadow-zinc-900/20 dark:shadow-white/10">
          Comenzar a Crear
          <ChevronRight className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </main>

      <section className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: <Target size={32}/>, title: "Generación Instantánea", desc: "Configura cifras y precios, y el sistema construye bóvedas de hasta 10,000 boletos en segundos." },
          { icon: <ShieldCheck size={32}/>, title: "Anticolisión", desc: "Bloqueos pesimistas en base de datos para evitar que dos personas reserven el mismo lugar." },
          { icon: <Lock size={32}/>, title: "Enlaces Únicos", desc: "Cada sorteo genera una URL dinámica y privada que puedes compartir en tus redes sociales." }
        ].map((feat, i) => (
          <div key={i} className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="text-blue-500 mb-6">{feat.icon}</div>
            <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
            <p className="text-zinc-600 dark:text-zinc-400">{feat.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
