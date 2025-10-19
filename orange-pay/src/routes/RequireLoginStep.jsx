// src/routes/RequireLoginStep.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useLoginFlow } from '../context/LoginFlowContext';

const STORAGE_KEY = 'app:login_flow';
function readFlowFromSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { step: 'phone', phone: null };
    return JSON.parse(raw);
  } catch (e) {
    return { step: 'phone', phone: null };
  }
}

export default function RequireLoginStep({ step, children }) {
  const location = useLocation();
  let loginFlow;
  try {
    const ctx = useLoginFlow();
    loginFlow = ctx?.loginFlow ?? readFlowFromSession();
  } catch (err) {
    // missing provider or hook error -> fallback to session storage
    loginFlow = readFlowFromSession();
  }

  const current = loginFlow?.step || 'phone';
  const order = { phone: 0, otp: 1, pin: 2, done: 3 };
  const need = order[step] ?? 0;
  const have = order[current] ?? 0;

  if (have >= need) return children;
  if (have === 0) return <Navigate to="/login" replace state={{ from: location }} />;
  if (have === 1) return <Navigate to="/login/otp" replace state={{ from: location }} />;
  return <Navigate to="/login" replace state={{ from: location }} />;
}
