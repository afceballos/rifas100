import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Register GSAP plugin
gsap.registerPlugin(useGSAP);

export default function TicketGrid({ raffleId }) {
  const containerRef = useRef();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Mock fetching tickets
  useEffect(() => {
    const mockTickets = Array.from({ length: 100 }, (_, i) => ({
      number: i + 1,
      status: Math.random() > 0.8 ? 'paid' : 'available' 
    }));
    setTickets(mockTickets);
  }, []);

  useGSAP(() => {
    // Cascading entrance animation
    if (tickets.length > 0) {
      gsap.from('.ticket-item', {
        y: 30,
        opacity: 0,
        duration: 0.4,
        stagger: 0.01,
        ease: 'power2.out',
      });
    }
  }, { dependencies: [tickets], scope: containerRef });

  const handleSelect = (ticket, element) => {
    if (ticket.status !== 'available') return;
    
    // Lock-in animation
    gsap.to(element, {
      scale: 0.9,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      onComplete: () => setSelectedTicket(ticket)
    });
  };

  return (
    <div className="min-h-screen bg-[#0F172A] p-8 text-white font-inter" ref={containerRef}>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-space font-bold mb-4">Gran Sorteo</h1>
        <div className="text-[#38BDF8] text-2xl font-space border border-[#1E293B] p-4 inline-block rounded-xl">
          Faltan: 12d 04h 30m 15s
        </div>
      </div>

      <div className="grid grid-cols-5 md:grid-cols-10 gap-3 max-w-4xl mx-auto">
        {tickets.map((t) => {
          const isAvailable = t.status === 'available';
          const bgClass = isAvailable 
            ? 'bg-[#1E293B] hover:bg-[#38BDF8] hover:text-slate-900 border-[#334155]' 
            : 'bg-[#334155] opacity-50 cursor-not-allowed';

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-[#1E293B] p-6 rounded-xl max-w-sm w-full">
            <h2 className="text-xl mb-4">Comprar Boleto #{selectedTicket.number}</h2>
            <p>Aquí va el formulario de compra...</p>
            <button 
              className="mt-4 bg-[#EF4444] text-white px-4 py-2 rounded"
              onClick={() => setSelectedTicket(null)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
