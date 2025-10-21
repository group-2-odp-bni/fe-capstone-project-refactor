// src/hooks/api/useTransferApi.js
import { useState } from "react";

/**
 * Module-level mock DB so state persists across hook instances.
 */
const MOCK_CONTACTS = [
  { phone: "081234567890", name: "Andi Susanto", accountId: "ACC-001", balance: 200000 },
  { phone: "081298765432", name: "Sinta Dewi", accountId: "ACC-002", balance: 500000 },
  { phone: "081300011122", name: "Budi Santoso", accountId: "ACC-003", balance: 1200000 },
];

const delay = (ms = 700) => new Promise((res) => setTimeout(res, ms));

export default function useTransferApi() {
  const [loading, setLoading] = useState(false);

  const fetchContacts = async (query = "") => {
    setLoading(true);
    await delay(400);
    const q = query.trim();
    const results = MOCK_CONTACTS.filter(
      (c) => c.phone.includes(q) || c.name.toLowerCase().includes(q.toLowerCase())
    );
    setLoading(false);
    return results;
  };

  const lookupContactByPhone = async (phone) => {
    setLoading(true);
    await delay(300);
    const contact = MOCK_CONTACTS.find((c) => c.phone === phone) || null;
    setLoading(false);
    return contact;
  };

  // performTransfer expects { phone, amount, note, pin }
  // No step-up token required anymore.
  const performTransfer = async ({ phone, amount, note, pin }) => {
    setLoading(true);
    await delay(900);

    // Mock PIN validation (server-side)
    if (pin !== "123456") {
      setLoading(false);
      return { status: "error", message: "Invalid PIN" };
    }

    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      setLoading(false);
      return { status: "error", message: "Invalid amount" };
    }

    const receiverIdx = MOCK_CONTACTS.findIndex((c) => c.phone === phone);
    if (receiverIdx === -1) {
      setLoading(false);
      return { status: "error", message: "Recipient not found" };
    }

    // Update recipient balance:
    MOCK_CONTACTS[receiverIdx].balance += amt;

    const tx = {
      status: "success",
      transactionId: `TRX${Date.now()}`,
      receiver: MOCK_CONTACTS[receiverIdx].name,
      phone,
      amount: amt,
      note,
      timestamp: new Date().toISOString(),
    };

    setLoading(false);
    return tx;
  };

  const getAllContacts = () => MOCK_CONTACTS.map((c) => ({ ...c }));

  return {
    loading,
    fetchContacts,
    lookupContactByPhone,
    performTransfer,
    getAllContacts,
  };
}
