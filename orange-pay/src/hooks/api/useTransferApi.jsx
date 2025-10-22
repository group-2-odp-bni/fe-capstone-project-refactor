// src/hooks/api/useTransferApi.js
import { useState } from "react";

/**
 * Module-level mock DB so state persists across hook instances.
 */
const MOCK_CONTACTS = [
  { phone: "081234567890", name: "Belanda Belinda", accountId: "ACC-001", balance: 200000 },
  { phone: "081298765432", name: "Belilindada haha", accountId: "ACC-002", balance: 500000 },
  { phone: "081300011122", name: "Safafufu Zabulaza", accountId: "ACC-003", balance: 1200000 },
  { phone: "087888123522", name: "Xaviera Azzahra", accountId: "ACC-004", balance: 1200000 },
  { phone: "087888123523", name: "Bimbim Mama", accountId: "ACC-005", balance: 1200000 },
  { phone: "087888122341", name: "Has Zabel", accountId: "ACC-006", balance: 1200000 },
  { phone: "087888122342", name: "Belsaf Buba", accountId: "ACC-007", balance: 1200000 },
  { phone: "087888122352", name: "Belindax Kocak", accountId: "ACC-008", balance: 1200000 },
  { phone: "087888122341", name: "Safzhar", accountId: "ACC-009", balance: 1200000 },
  { phone: "087888122151", name: "Zaza Siahaan", accountId: "ACC-010", balance: 1200000 },
  { phone: "087888112512", name: "Taf Saha", accountId: "ACC-011", balance: 1200000 },
  { phone: "087888122521", name: "Baik Baik Saja", accountId: "ACC-012", balance: 1200000 },
  { phone: "087888125231", name: "Siapa yang jadi", accountId: "ACC-013", balance: 1200000 },
];

const delay = (ms = 700) => new Promise((res) => setTimeout(res, ms));

/** receipts storage key */
const RECEIPTS_KEY = "mockReceipts";

/** small helpers to persist receipts in sessionStorage */
function loadReceipts() {
  try {
    const raw = sessionStorage.getItem(RECEIPTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn("useTransferApi: loadReceipts error", e);
    return {};
  }
}
function saveReceipts(obj) {
  try {
    sessionStorage.setItem(RECEIPTS_KEY, JSON.stringify(obj));
  } catch (e) {
    console.warn("useTransferApi: saveReceipts error", e);
  }
}
function generateTxId() {
  return `TRX${Date.now()}`;
}

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
  // will validate, update balances, create & persist a receipt, and return the receipt.
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

    // Build receipt object and persist to sessionStorage
    const txId = generateTxId();
    const now = new Date();
    const receipt = {
      status: "success",
      transactionId: txId,
      receiver: MOCK_CONTACTS[receiverIdx].name,
      phone,
      amount: amt,
      note: note || "",
      timestamp: now.toISOString(),
      date: now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      refId: `${now.getTime()}`, // simple ref id
      type: "Transfer",
      meta: {
        accountId: MOCK_CONTACTS[receiverIdx].accountId,
      },
    };

    // persist receipt into "mockReceipts"
    try {
      const all = loadReceipts();
      all[txId] = receipt;
      saveReceipts(all);
    } catch (e) {
      console.warn("useTransferApi: failed to persist receipt", e);
    }

    setLoading(false);
    // return full receipt object (not only tx id)
    return receipt;
  };

  // fetch a saved receipt by transactionId (returns null if not found)
  const getReceipt = async (transactionId) => {
    setLoading(true);
    await delay(300);
    try {
      const all = loadReceipts();
      const found = all[transactionId] || null;
      setLoading(false);
      return found;
    } catch (e) {
      setLoading(false);
      console.warn("useTransferApi: getReceipt error", e);
      return null;
    }
  };

  const getAllContacts = () => MOCK_CONTACTS.map((c) => ({ ...c }));

  return {
    loading,
    fetchContacts,
    lookupContactByPhone,
    performTransfer,
    getReceipt,
    getAllContacts,
  };
}
