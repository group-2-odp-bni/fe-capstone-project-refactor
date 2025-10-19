// src/context/LoginFlowContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const KEY = 'app:login_flow';
const defaultState = { step: 'phone', phone: null };

const LoginFlowContext = createContext(null);

export function LoginFlowProvider({ children }) {
  const [state, setState] = useState(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : defaultState;
    } catch (err) {
      console.warn('LoginFlow init error', err);
      return defaultState;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('LoginFlow persist error', err);
    }
  }, [state]);

  const startLogin = useCallback((phone) => {
    const next = { step: 'otp', phone: phone || null };
    setState(next);
    try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    return next;
  }, []);

  const markOtpVerified = useCallback(() => {
    setState(prev => {
      const next = { ...prev, step: 'pin' };
      try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const clearLoginFlow = useCallback(() => {
    setState(defaultState);
    try { sessionStorage.removeItem(KEY); } catch {}
  }, []);

  return (
    <LoginFlowContext.Provider value={{ loginFlow: state, startLogin, markOtpVerified, clearLoginFlow }}>
      {children}
    </LoginFlowContext.Provider>
  );
}

export function useLoginFlow() {
  const ctx = useContext(LoginFlowContext);
  if (!ctx) throw new Error('useLoginFlow must be used inside LoginFlowProvider');
  return ctx;
}
