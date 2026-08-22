import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, requireSuperAdmin = false }) {
  const [status, setStatus] = useState('checking'); // 'checking' | 'authed' | 'unauthed' | 'forbidden'

  useEffect(() => {
    fetch('/api/me.php', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (!data.success) { setStatus('unauthed'); return; }
        if (requireSuperAdmin && data.role !== 'super_admin') { setStatus('forbidden'); return; }
        setStatus('authed');
      })
      .catch(() => setStatus('unauthed'));
  }, [requireSuperAdmin]);

  if (status === 'checking') return null; // Espera silenciosa
  if (status === 'unauthed') return <Navigate to="/admin" replace />;
  if (status === 'forbidden') return <Navigate to="/admin" replace />;
  return children;
}
