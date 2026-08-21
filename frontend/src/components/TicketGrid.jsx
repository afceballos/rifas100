import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import ThemeToggle from './ThemeToggle';
import { ShieldCheck, Ticket } from 'lucide-react';

gsap.registerPlugin(useGSAP);

export default function TicketGrid() {
  const containerRef = useRef();
  const [tickets, setTickets] = useState([]);
  const [raffle, setRaffle] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [purchaseStatus, setPurchaseStatus] = useState('');

  const loadTickets = () => {
    fetch('/api/get_tickets.php')
      .then(res => res.json())
      .then(data => {
        if(data.success) {
          setTickets(data.tickets);
          setRaffle(data.raffle);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadTickets(); }, []);

  useGSAP(() => {
    if (tickets.length > 0 && !loading) {
      gsap.fromTo('.ticket-item', 
        { y: 40, opacity: 0, scale: 0.9 }, 
        { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.015, ease: 'back.out(1.2)' }
      );
    }
  }, { dependencies: [tickets, loading], scope: containerRef });

  const handleSelect = (ticket, element) => {
    if (ticket.status !== 'available') return;
    
    gsap.to(element, {
      scale: 0.9, duration: 0.1, yoyo: true, repeat: 1,
      onComplete: () => {
        setSelectedTicket(ticket);
        setPurchaseStatus('');
      }
    });
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    setPurchaseStatus('Procesando reserva...');
    try {
      const res = await fetch('/api/reserve_ticket.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raffle_id: raffle.id,
          ticket_number: selectedTicket.number,
          buyer_name: formData.name,
          buyer_phone: formData.phone,
          buyer_email: formData.email
        })
      });
      const data = await res.json();
      if(data.success) {
        setPurchaseStatus('¡Boleto bloqueado a tu nombre!');
        setTimeout(() => {
          setSelectedTicket(null);
          setFormData({ name: '', phone: '', email: '' });
          loadTickets();
        }, 2000);
      } else {
        setPurchaseStatus(data.message || 'Error al reservar.');
      }
    } catch(err) { setPurchaseStatus('Error de conexión.'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-sans"><div className="animate-pulse flex items-center gap-2"><Ticket className="animate-spin text-blue-500" /> Cargando bóveda...</div></div>;

  return (
    <div className="min-h-screen relative font-sans" ref={containerRef}>
      {/* Navbar Minimalista */}
      <nav className="w-full p-4 flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <ShieldCheck className="text-blue-500" />
          <span>Ticket<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-violet-500">Vault</span></span>
        </div>
        <ThemeToggle />
      </nav>

      {/* Header Central */}
      <div className="text-center mt-8 mb-16 px-4">
        <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500">
          {raffle ? raffle.title : 'Gran Sorteo'}
        </h1>
        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm">
          <span className="text-zinc-500 dark:text-zinc-400 font-medium">Inversión por acceso:</span>
          <span className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400">${raffle ? raffle.price_per_ticket : '0.00'}</span>
        </div>
      </div>

      {/* Grilla Interactiva */}
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3 max-w-5xl mx-auto px-4 pb-20">
        {tickets.map((t) => {
          const isAv = t.status === 'available';
          const bgClass = isAv 
            ? 'bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-500 dark:hover:border-blue-400 text-zinc-900 dark:text-zinc-100' 
            : t.status === 'paid' 
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-500 opacity-60 cursor-not-allowed' 
              : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 opacity-50 cursor-not-allowed';

          return (
            <button
              key={t.number}
              onClick={(e) => handleSelect(t, e.currentTarget)}
              disabled={!isAv}
              className={`ticket-item h-14 flex items-center justify-center rounded-xl font-mono text-lg font-bold transition-all duration-300 ${bgClass}`}
            >
              {t.number.toString().padStart(3, '0')}
            </button>
          );
        })}
      </div>

      {/* Modal Desplegable Premium */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}></div>
          <div className="relative bg-white dark:bg-zinc-900 p-8 rounded-3xl max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 transform transition-all">
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Reservar Acceso</h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Boleto seleccionado: <span className="font-mono text-blue-500 font-bold">#{selectedTicket.number.toString().padStart(3, '0')}</span></p>
              </div>
            </div>
            
            {purchaseStatus && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 rounded-2xl border border-blue-100 dark:border-blue-900/50 text-center text-sm font-medium">
                {purchaseStatus}
              </div>
            )}

            <form onSubmit={handlePurchase} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300">Nombre Completo <span className="text-blue-500">*</span></label>
                <input required type="text" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Juan Pérez" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300">Teléfono Celular <span className="text-blue-500">*</span></label>
                <input required type="tel" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" 
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+00 0000000" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-zinc-700 dark:text-zinc-300">Correo Electrónico (Opcional)</label>
                <input type="email" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="tu@correo.com" />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" className="flex-1 px-4 py-3 rounded-xl text-zinc-600 dark:text-zinc-400 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  onClick={() => setSelectedTicket(null)}>Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95">
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
