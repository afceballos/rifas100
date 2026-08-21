import React, { useState, useEffect } from 'react';

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Dashboard State
  const [stats, setStats] = useState({ available: 0, reserved: 0, paid: 0 });
  const [money, setMoney] = useState(0);
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Check initial login via dashboard fetch (if it fails, we need to login)
  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/admin_dashboard.php');
      const data = await res.json();
      if (data.success) {
        setIsLoggedIn(true);
        setStats(data.stats);
        setMoney(data.money);
        setBuyers(data.buyers);
      } else {
        setIsLoggedIn(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setLoginError('');
        fetchDashboard(); // This will set isLoggedIn to true
      } else {
        setLoginError(data.message);
      }
    } catch (err) {
      setLoginError('Error de conexión');
    }
    setLoading(false);
  };

  const markAsPaid = async (ticketNumber) => {
    if (!window.confirm(`¿Marcar boleto #${ticketNumber} como PAGADO?`)) return;
    try {
      const res = await fetch('/api/admin_mark_paid.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_number: ticketNumber })
      });
      const data = await res.json();
      if (data.success) {
        fetchDashboard(); // Refresh data
      } else {
        alert(data.error || 'Error al actualizar');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  // --- VISTA DE LOGIN ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 text-white font-inter">
        <div className="bg-[#1E293B] p-8 rounded-xl max-w-sm w-full border border-[#334155] shadow-2xl">
          <h2 className="text-2xl font-space font-bold text-[#38BDF8] mb-6 text-center">Admin Login</h2>
          
          {loginError && <div className="mb-4 text-red-400 bg-red-900/20 p-2 rounded text-center text-sm">{loginError}</div>}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm mb-1 text-slate-300">Usuario</label>
              <input type="text" required className="w-full bg-[#0F172A] border border-slate-600 rounded p-2 text-white outline-none focus:border-[#38BDF8]"
                value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1 text-slate-300">Contraseña</label>
              <input type="password" required className="w-full bg-[#0F172A] border border-slate-600 rounded p-2 text-white outline-none focus:border-[#38BDF8]"
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2 mt-4 bg-[#38BDF8] text-slate-900 font-bold rounded hover:bg-sky-300 transition-colors">
              {loading ? 'Entrando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- VISTA DE DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#0F172A] p-8 text-white font-inter">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-space font-bold text-[#38BDF8]">Panel de Control</h1>
          <button onClick={() => { setIsLoggedIn(false); /* A real app would hit a logout API */ }} className="px-4 py-2 text-sm bg-[#1E293B] border border-[#334155] rounded hover:text-[#38BDF8]">Salir</button>
        </div>

        {/* Tarjetas de Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1E293B] p-6 rounded-xl border border-[#334155]">
            <h3 className="text-slate-400 text-sm mb-1">Total Recaudado</h3>
            <p className="text-3xl font-space font-bold text-[#10B981]">${money}</p>
          </div>
          <div className="bg-[#1E293B] p-6 rounded-xl border border-[#334155]">
            <h3 className="text-slate-400 text-sm mb-1">Disponibles</h3>
            <p className="text-3xl font-space font-bold text-white">{stats.available}</p>
          </div>
          <div className="bg-[#1E293B] p-6 rounded-xl border border-[#334155]">
            <h3 className="text-slate-400 text-sm mb-1">Reservados (Falta Pago)</h3>
            <p className="text-3xl font-space font-bold text-orange-400">{stats.reserved}</p>
          </div>
          <div className="bg-[#1E293B] p-6 rounded-xl border border-[#334155]">
            <h3 className="text-slate-400 text-sm mb-1">Pagados</h3>
            <p className="text-3xl font-space font-bold text-[#38BDF8]">{stats.paid}</p>
          </div>
        </div>

        {/* Tabla de Compradores */}
        <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0F172A] text-slate-300 text-sm">
                <th className="p-4 border-b border-[#334155]">Boleto</th>
                <th className="p-4 border-b border-[#334155]">Comprador</th>
                <th className="p-4 border-b border-[#334155]">Contacto</th>
                <th className="p-4 border-b border-[#334155]">Estado</th>
                <th className="p-4 border-b border-[#334155]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {buyers.length === 0 ? (
                <tr><td colSpan="5" className="p-4 text-center text-slate-500">Nadie ha reservado boletos aún.</td></tr>
              ) : buyers.map(b => (
                <tr key={b.ticket_number} className="hover:bg-[#334155]/30 transition-colors border-b border-[#334155] last:border-0">
                  <td className="p-4 font-space text-lg text-[#38BDF8]">#{b.ticket_number.toString().padStart(3, '0')}</td>
                  <td className="p-4">{b.buyer_name}</td>
                  <td className="p-4 text-sm text-slate-400">
                    <div>{b.buyer_phone}</div>
                    <div>{b.buyer_email}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-bold ${b.status === 'paid' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-orange-900/50 text-orange-400'}`}>
                      {b.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    {b.status === 'reserved' && (
                      <button onClick={() => markAsPaid(b.ticket_number)} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm transition-colors">
                        Marcar Pagado
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
