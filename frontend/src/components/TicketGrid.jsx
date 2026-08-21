import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function TicketGrid() {
  const containerRef = useRef();
  const [tickets, setTickets] = useState([]);
  const [raffle, setRaffle] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [purchaseStatus, setPurchaseStatus] = useState('');

  // Fetch real data from DB
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
      .catch(err => {
        console.error("Error fetching tickets:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadTickets();
  }, []);

  useGSAP(() => {
    if (tickets.length > 0 && !loading) {
      gsap.from('.ticket-item', {
        y: 30, opacity: 0, duration: 0.4, stagger: 0.01, ease: 'power2.out',
      });
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
    setPurchaseStatus('Procesando...');

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
        setPurchaseStatus('¡Boleto reservado con éxito!');
        setTimeout(() => {
          setSelectedTicket(null);
          setFormData({ name: '', phone: '', email: '' });
          loadTickets(); // Refresh grid
        }, 2000);
      } else {
        setPurchaseStatus(data.message || 'Error al reservar.');
      }
    } catch(err) {
      setPurchaseStatus('Error de conexión.');
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center">Cargando bóveda...</div>;

  return (
    <div className="min-h-screen bg-[#0F172A] p-8 text-white font-inter" ref={containerRef}>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-space font-bold mb-4">{raffle ? raffle.title : 'Gran Sorteo'}</h1>
        <div className="text-[#38BDF8] text-xl font-space border border-[#1E293B] p-4 inline-block rounded-xl mb-4">
          Precio por boleto: ${raffle ? raffle.price_per_ticket : '0.00'}
        </div>
      </div>

      <div className="grid grid-cols-5 md:grid-cols-10 gap-3 max-w-4xl mx-auto">
        {tickets.map((t) => {
          const isAvailable = t.status === 'available';
          const bgClass = isAvailable 
            ? 'bg-[#1E293B] hover:bg-[#38BDF8] hover:text-slate-900 border-[#334155]' 
            : t.status === 'paid' ? 'bg-[#10B981] opacity-50 cursor-not-allowed' : 'bg-[#334155] opacity-50 cursor-not-allowed';

          return (
            <button
              key={t.number}
              onClick={(e) => handleSelect(t, e.currentTarget)}
              disabled={!isAvailable}
              className={`ticket-item h-12 flex items-center justify-center rounded border font-space text-lg transition-colors ${bgClass}`}
            >
              {t.number.toString().padStart(3, '0')}
            </button>
          );
        })}
      </div>

      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E293B] p-8 rounded-xl max-w-md w-full shadow-2xl border border-[#334155]">
            <h2 className="text-2xl font-space font-bold text-[#38BDF8] mb-6">Reservar Boleto #{selectedTicket.number.toString().padStart(3, '0')}</h2>
            
            {purchaseStatus && (
              <div className="mb-4 p-3 bg-slate-800 text-center rounded border border-slate-600">
                {purchaseStatus}
              </div>
            )}

            <form onSubmit={handlePurchase} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-slate-300">Nombre Completo *</label>
                <input required type="text" className="w-full bg-[#0F172A] border border-slate-600 rounded p-2 text-white outline-none focus:border-[#38BDF8]" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-300">Teléfono Celular *</label>
                <input required type="tel" className="w-full bg-[#0F172A] border border-slate-600 rounded p-2 text-white outline-none focus:border-[#38BDF8]" 
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-300">Correo Electrónico (Opcional)</label>
                <input type="email" className="w-full bg-[#0F172A] border border-slate-600 rounded p-2 text-white outline-none focus:border-[#38BDF8]" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" className="px-4 py-2 rounded text-slate-400 hover:text-white transition-colors"
                  onClick={() => setSelectedTicket(null)}>Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-[#38BDF8] text-slate-900 font-bold rounded hover:bg-sky-300 transition-colors">
                  Confirmar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
