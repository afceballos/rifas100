import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import Dialog from './Dialog';
import AdminRaffleSidebar from './AdminRaffleSidebar';
import RaffleFormModal from './RaffleFormModal';
import PaymentMethodModal from './PaymentMethodModal';
import SellerFormModal from './SellerFormModal';
import SellerShareModal from './SellerShareModal';
import SellerSalesModal from './SellerSalesModal';
import SellerPasswordModal from './SellerPasswordModal';
import TicketQRCode from './TicketQRCode';
import QRCode from 'qrcode';
import { ArrowLeft, Pencil, EyeOff, Eye, Trash2, Wallet, UserCircle2, Download, Copy, Check, Users, UserPlus, QrCode, Phone, Mail, ListChecks, KeyRound } from 'lucide-react';
import { parsePaymentMethods } from '../utils/paymentInfo';

const formatDrawDate = (value) => {
  if (!value) return '';
  const d = new Date(value.replace(/-/g, '/'));
  return d.toLocaleString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function AdminRaffleSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [raffle, setRaffle] = useState(null);
  const [editingRaffle, setEditingRaffle] = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const [sellers, setSellers] = useState([]);
  const [editingSeller, setEditingSeller] = useState(null); // null | 'new' | seller object
  const [sharingSeller, setSharingSeller] = useState(null);
  const [viewingSellerSales, setViewingSellerSales] = useState(null);
  const [settingPasswordFor, setSettingPasswordFor] = useState(null);
  const [savingSellerSetting, setSavingSellerSetting] = useState(false);
  const [savingSellerPortal, setSavingSellerPortal] = useState(false);
  const [savingReceiptUpload, setSavingReceiptUpload] = useState(false);

  const [dialog, setDialog] = useState({ open: false });

  const showAlert = (title, message, type = 'alert') =>
    new Promise(resolve =>
      setDialog({ open: true, type, title, message, onConfirm: () => { setDialog({ open: false }); resolve(true); }, onCancel: () => { setDialog({ open: false }); resolve(false); } })
    );

  const showConfirm = (title, message, type = 'danger', confirmText = 'Confirmar') =>
    new Promise(resolve =>
      setDialog({ open: true, type, title, message, confirmText, onConfirm: () => { setDialog({ open: false }); resolve(true); }, onCancel: () => { setDialog({ open: false }); resolve(false); } })
    );

  useEffect(() => { fetchRaffle(); }, [id]);

  const fetchRaffle = async () => {
    try {
      const res = await fetch(`/api/admin_dashboard.php?id=${id}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setRaffle(data.raffle);
    } catch (err) { console.error(err); }
  };

  const fetchSellers = async () => {
    try {
      const res = await fetch(`/api/admin_get_sellers.php?raffle_id=${id}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setSellers(data.sellers);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchSellers(); }, [id]);

  const handleDeleteSeller = async (seller) => {
    const confirmed = await showConfirm(
      'Eliminar vendedor',
      `¿Eliminar a "${seller.name}" (${seller.code})? Los boletos que ya vendió quedan igual, solo se quita la atribución al vendedor.`,
      'danger',
      'Eliminar vendedor'
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/admin_delete_seller.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ raffle_id: id, seller_id: seller.id }),
      });
      const data = await res.json();
      if (data.success) fetchSellers();
      else showAlert('Error', data.error, 'alert');
    } catch (err) { showAlert('Error', 'Error de conexión.', 'alert'); }
  };

  const handleToggleSellerSelection = async () => {
    const nextValue = !raffle.allow_seller_selection;
    setSavingSellerSetting(true);
    try {
      const res = await fetch('/api/admin_update_seller_settings.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ raffle_id: id, allow_seller_selection: nextValue }),
      });
      const data = await res.json();
      if (data.success) fetchRaffle();
      else showAlert('Error', data.error || 'No se pudo guardar el ajuste', 'alert');
    } catch (err) { showAlert('Error', 'Error de conexión.', 'alert'); }
    setSavingSellerSetting(false);
  };

  const handleToggleSellerPortal = async () => {
    const nextValue = !raffle.seller_portal_enabled;
    setSavingSellerPortal(true);
    try {
      const res = await fetch('/api/admin_update_seller_portal.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ raffle_id: id, seller_portal_enabled: nextValue }),
      });
      const data = await res.json();
      if (data.success) fetchRaffle();
      else showAlert('Error', data.error || 'No se pudo guardar el ajuste', 'alert');
    } catch (err) { showAlert('Error', 'Error de conexión.', 'alert'); }
    setSavingSellerPortal(false);
  };

  const handleToggleReceiptUpload = async () => {
    const nextValue = !raffle.receipt_upload_enabled;
    setSavingReceiptUpload(true);
    try {
      const res = await fetch('/api/admin_update_receipt_upload.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ raffle_id: id, receipt_upload_enabled: nextValue }),
      });
      const data = await res.json();
      if (data.success) fetchRaffle();
      else showAlert('Error', data.error || 'No se pudo guardar el ajuste', 'alert');
    } catch (err) { showAlert('Error', 'Error de conexión.', 'alert'); }
    setSavingReceiptUpload(false);
  };

  const handleTogglePublish = async () => {
    const action = raffle.is_published ? 'despublicar' : 'publicar';
    const confirmed = await showConfirm(
      `¿${raffle.is_published ? 'Despublicar' : 'Publicar'} sorteo?`,
      `El sorteo "${raffle.title}" quedará ${raffle.is_published ? 'invisible para el público' : 'visible para el público'}.`,
      'confirm',
      raffle.is_published ? 'Despublicar' : 'Publicar'
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/admin_toggle_raffle.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ raffle_id: raffle.id }),
      });
      const data = await res.json();
      if (data.success) fetchRaffle();
      else showAlert('Error', `No se pudo ${action} el sorteo.`, 'alert');
    } catch (err) { showAlert('Error', 'Error de conexión.', 'alert'); }
  };

  const handleDeleteRaffle = async () => {
    const confirmed = await showConfirm(
      'Eliminar sorteo permanentemente',
      `¿Estás seguro? Se eliminarán el sorteo "${raffle.title}" y todos sus boletos. Esta acción no se puede deshacer.`,
      'danger',
      'Eliminar definitivamente'
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/admin_delete_raffle.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ raffle_id: raffle.id }),
      });
      const data = await res.json();
      if (data.success) navigate('/admin');
      else showAlert('Error', data.error, 'alert');
    } catch (err) { showAlert('Error', 'Error de conexión.', 'alert'); }
  };

  const digits = raffle ? Math.max(2, String(Math.max(0, (raffle.number_start || 0) + raffle.total_tickets - 1)).length) : null;
  const paymentMethods = raffle ? parsePaymentMethods(raffle.payment_info) : [];
  const raffleUrl = raffle?.slug ? `${window.location.origin}/sorteo/${raffle.slug}` : null;

  const handleCopyLink = async () => {
    if (!raffleUrl) return;
    try {
      await navigator.clipboard.writeText(raffleUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch { /* clipboard no disponible */ }
  };

  const handleDownloadQr = async () => {
    if (!raffleUrl) return;
    try {
      const dataUrl = await QRCode.toDataURL(raffleUrl, { width: 800, margin: 2, color: { dark: '#18181b', light: '#ffffff' } });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `qr-${raffle.slug}.png`;
      a.click();
    } catch { showAlert('Error', 'No se pudo generar el código QR.', 'alert'); }
  };

  return (
    <div className="min-h-screen font-sans pb-12">
      <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link to="/admin" className="flex items-center gap-2 font-bold text-lg text-zinc-500 hover:text-lime-500">
            <ArrowLeft /> Volver al Inicio
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 mt-10 flex flex-col md:flex-row gap-6">
        <AdminRaffleSidebar id={id} raffle={raffle} activeSection="settings" />

        {raffle && (
          <div className="flex-1 min-w-0 space-y-6 max-w-2xl">
            {/* Datos de la rifa */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              {raffle.background_image && (
                <div className="relative h-28">
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${raffle.background_image})` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent" />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">Datos de la rifa</h3>
                      {!raffle.is_published && (
                        <span className="text-[10px] font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-full">Oculto</span>
                      )}
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Título, precio, fecha, descripción e imagen de fondo.</p>
                  </div>
                  <button
                    onClick={() => setEditingRaffle(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                  >
                    <Pencil size={15} /> Editar
                  </button>
                </div>

                <dl className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <dt className="text-xs text-zinc-400 uppercase tracking-widest font-bold mb-0.5">Título</dt>
                    <dd className="font-semibold truncate">{raffle.title}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-400 uppercase tracking-widest font-bold mb-0.5">Precio por boleto</dt>
                    <dd className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">${raffle.price_per_ticket}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-400 uppercase tracking-widest font-bold mb-0.5">Fecha del sorteo</dt>
                    <dd className="font-semibold">{formatDrawDate(raffle.draw_date)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-400 uppercase tracking-widest font-bold mb-0.5">
                      {(raffle.number_start || 0) !== 0 || ![100, 1000, 10000].includes(raffle.total_tickets) ? 'Rango' : 'Cifras'}
                    </dt>
                    <dd className="font-mono font-semibold">
                      {(raffle.number_start || 0) !== 0 || ![100, 1000, 10000].includes(raffle.total_tickets)
                        ? `${String(raffle.number_start || 0).padStart(digits, '0')}–${String((raffle.number_start || 0) + raffle.total_tickets - 1).padStart(digits, '0')}`
                        : digits} ({raffle.total_tickets} boletos)
                    </dd>
                  </div>
                </dl>

                {raffle.description && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{raffle.description}</p>
                )}

                <div className="flex items-center gap-2.5 mb-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                  {raffle.organizer_photo ? (
                    <img src={raffle.organizer_photo} alt="Organizador" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-lime-500 to-lime-600 flex items-center justify-center text-white shrink-0">
                      <UserCircle2 size={18} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold">Organizador</p>
                    <p className="text-sm font-semibold truncate">{raffle.organizer_name || 'Sin especificar'}</p>
                    {(raffle.organizer_phone || raffle.organizer_email) && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {[raffle.organizer_phone, raffle.organizer_email].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    onClick={handleTogglePublish}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {raffle.is_published ? <><EyeOff size={15} /> Despublicar</> : <><Eye size={15} /> Publicar</>}
                  </button>
                  <button
                    onClick={handleDeleteRaffle}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 size={15} /> Eliminar
                  </button>
                </div>
              </div>
            </div>

            {/* Métodos de pago */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-lg mb-1">Métodos de pago</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">Instrucciones de pago que verán los compradores.</p>
                </div>
                <button
                  onClick={() => setEditingPayment(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                >
                  <Pencil size={15} /> {paymentMethods.length ? 'Editar' : 'Configurar'}
                </button>
              </div>

              {paymentMethods.length > 0 ? (
                <div className="space-y-2">
                  {paymentMethods.map((pm, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                      <div className="p-2.5 rounded-xl bg-lime-50 dark:bg-lime-500/10 text-lime-500 shrink-0">
                        <Wallet size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {pm.method}{pm.institution ? ` · ${pm.institution}` : ''}
                        </p>
                        {pm.details?.length > 0 && (
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {pm.details.map(d => `${d.type}: ${d.value}`).join(' · ')}
                          </p>
                        )}
                        {pm.description && (
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{pm.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-dashed border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500 dark:text-zinc-400 text-center">
                  Aún no configuraste ningún método de pago.
                </div>
              )}
            </div>

            {/* Vendedores */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-lg mb-1">Vendedores</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">Compárteles su propio enlace para vender. Puedes asignarles un rango de números o dejarlos vender de toda la rifa.</p>
                </div>
                <button
                  onClick={() => setEditingSeller('new')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                >
                  <UserPlus size={15} /> Agregar
                </button>
              </div>

              {sellers.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {sellers.map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                      <div className="p-2.5 rounded-xl bg-lime-50 dark:bg-lime-500/10 text-lime-500 shrink-0">
                        <Users size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{s.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                          {s.code} · {s.range_start != null
                            ? `${String(s.range_start).padStart(digits, '0')}–${String(s.range_end).padStart(digits, '0')} · ${s.sold_count}/${s.total_count} vendidos`
                            : `Todos los números · ${s.sold_count} vendidos`}
                        </p>
                        {(s.phone || s.email) && (
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-2 mt-0.5">
                            {s.phone && <span className="flex items-center gap-1"><Phone size={10} /> {s.phone}</span>}
                            {s.email && <span className="flex items-center gap-1"><Mail size={10} /> {s.email}</span>}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setSettingPasswordFor(s)}
                          title="Definir acceso al portal"
                          className="p-1.5 text-zinc-500 hover:text-lime-600 dark:hover:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-900/20 rounded-lg transition-colors"
                        >
                          <KeyRound size={16} />
                        </button>
                        <button
                          onClick={() => setViewingSellerSales(s)}
                          title="Ver números vendidos"
                          className="p-1.5 text-zinc-500 hover:text-lime-600 dark:hover:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-900/20 rounded-lg transition-colors"
                        >
                          <ListChecks size={16} />
                        </button>
                        <button
                          onClick={() => setSharingSeller(s)}
                          title="Compartir (QR / enlace)"
                          className="p-1.5 text-zinc-500 hover:text-lime-600 dark:hover:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-900/20 rounded-lg transition-colors"
                        >
                          <QrCode size={16} />
                        </button>
                        <button
                          onClick={() => setEditingSeller(s)}
                          title="Editar"
                          className="p-1.5 text-zinc-500 hover:text-lime-600 dark:hover:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-900/20 rounded-lg transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteSeller(s)}
                          title="Eliminar"
                          className="p-1.5 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-dashed border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500 dark:text-zinc-400 text-center mb-4">
                  Aún no tienes vendedores registrados.
                </div>
              )}

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Elegir vendedor al reservar</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Los compradores podrán indicar qué vendedor les atendió, aunque no entren por su enlace.</p>
                </div>
                <button
                  onClick={handleToggleSellerSelection}
                  disabled={savingSellerSetting}
                  role="switch"
                  aria-checked={!!raffle.allow_seller_selection}
                  className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
                    raffle.allow_seller_selection ? 'bg-lime-600' : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    raffle.allow_seller_selection ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Portal de vendedores</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Permite que tus vendedores entren con su código y contraseña en{' '}
                    <span className="font-mono">{window.location.origin}/vendedor/login</span> a validar sus propias ventas.
                  </p>
                </div>
                <button
                  onClick={handleToggleSellerPortal}
                  disabled={savingSellerPortal}
                  role="switch"
                  aria-checked={!!raffle.seller_portal_enabled}
                  className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
                    raffle.seller_portal_enabled ? 'bg-lime-600' : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    raffle.seller_portal_enabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Comprobantes desde el boleto</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Deja que el comprador suba su comprobante de pago directamente desde la página de su boleto digital.
                  </p>
                </div>
                <button
                  onClick={handleToggleReceiptUpload}
                  disabled={savingReceiptUpload}
                  role="switch"
                  aria-checked={!!raffle.receipt_upload_enabled}
                  className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
                    raffle.receipt_upload_enabled ? 'bg-lime-600' : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    raffle.receipt_upload_enabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* Código QR */}
            {raffleUrl && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <h3 className="font-bold text-lg mb-1">Código QR de tu rifa</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">Compártelo en flyers, redes o pantallas para que la gente entre directo.</p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="p-2 bg-white rounded-xl border border-zinc-100 dark:border-zinc-800 shrink-0">
                    <TicketQRCode value={raffleUrl} size={112} />
                  </div>
                  <div className="flex-1 min-w-0 w-full space-y-2">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-lg px-3 py-2 font-mono">
                      {raffleUrl}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDownloadQr}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Download size={15} /> Descargar QR
                      </button>
                      <button
                        onClick={handleCopyLink}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        {linkCopied ? <><Check size={15} className="text-emerald-500" /> Copiado</> : <><Copy size={15} /> Copiar enlace</>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {editingRaffle && raffle && (
        <RaffleFormModal
          mode="edit"
          raffle={raffle}
          onClose={() => setEditingRaffle(false)}
          onSaved={fetchRaffle}
          showAlert={showAlert}
        />
      )}

      {editingPayment && raffle && (
        <PaymentMethodModal
          raffle={raffle}
          onClose={() => setEditingPayment(false)}
          onSaved={fetchRaffle}
          showAlert={showAlert}
        />
      )}

      {editingSeller && raffle && (
        <SellerFormModal
          raffleId={raffle.id}
          seller={editingSeller === 'new' ? null : editingSeller}
          pad={digits}
          numberStart={raffle.number_start || 0}
          totalTickets={raffle.total_tickets}
          sellers={sellers}
          onClose={() => setEditingSeller(null)}
          onSaved={fetchSellers}
          showAlert={showAlert}
        />
      )}

      {sharingSeller && raffleUrl && (
        <SellerShareModal
          seller={sharingSeller}
          raffleUrl={raffleUrl}
          pad={digits}
          onClose={() => setSharingSeller(null)}
        />
      )}

      {viewingSellerSales && raffle && (
        <SellerSalesModal
          raffleId={raffle.id}
          seller={viewingSellerSales}
          pad={digits}
          onClose={() => setViewingSellerSales(null)}
        />
      )}

      {settingPasswordFor && raffle && (
        <SellerPasswordModal
          raffleId={raffle.id}
          seller={settingPasswordFor}
          onClose={() => setSettingPasswordFor(null)}
          showAlert={showAlert}
        />
      )}

      <Dialog {...dialog} />
    </div>
  );
}
