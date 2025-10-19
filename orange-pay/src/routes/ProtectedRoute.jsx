// src/routes/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../services/authService';

export default function ProtectedRoute() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    let mounted = true;
    try {
      const maybe = isAuthenticated();
      if (maybe && typeof maybe.then === 'function') {
        maybe.then(res => { if (!mounted) return; setAuthed(Boolean(res)); setChecking(false); })
             .catch(() => { if (!mounted) return; setAuthed(false); setChecking(false); });
      } else {
        setAuthed(Boolean(maybe));
        setChecking(false);
      }
    } catch (err) {
      console.error('ProtectedRoute: isAuthenticated threw', err);
      setAuthed(false);
      setChecking(false);
    }
    return () => { mounted = false; };
  }, []);

  if (checking) return <div style={{ padding: 24, textAlign: 'center' }}>Checking authentication...</div>;
  return authed ? <Outlet /> : <Navigate to="/login" replace state={{ from: loc }} />;
}
