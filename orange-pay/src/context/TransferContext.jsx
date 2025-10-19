import React, { createContext, useContext, useState, useCallback } from 'react';

const TransferContext = createContext(null);

export function TransferProvider({ children }) {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const reset = useCallback(() => {
    setPhone('');
    setAmount('');
    setNotes('');
  }, []);

  return (
    <TransferContext.Provider value={{
      phone, setPhone, amount, setAmount, notes, setNotes, reset,
    }}>
      {children}
    </TransferContext.Provider>
  );
}

export function useTransfer() {
  const ctx = useContext(TransferContext);
  if (!ctx) throw new Error('useTransfer must be used within TransferProvider');
  return ctx;
}
