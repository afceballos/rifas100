import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

export default function SellerProtectedRoute({ children }) {
  const [status, setStatus] = useState('checking'); // 'checking' | 'authed' | 'unauthed'

  useEffect(() => {
    fetch('/api/seller_me.php', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setStatus(data.success ? 'authed' : 'unauthed'))
      .catch(() => setStatus('unauthed'));
  }, []);

  if (status === 'checking') return null; // Espera silenciosa
  if (status === 'unauthed') return <Navigate to="/vendedor/login" replace />;
  return children;
}
