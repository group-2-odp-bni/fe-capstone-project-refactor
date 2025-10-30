import { useState } from "react";

/**
 * MAIN_CONTACTS = mock master DB (all system accounts)
 * SAVED_CONTACTS_INITIAL = initial saved contacts (user’s address book)
 * Data is persisted in sessionStorage to simulate a backend
 */

const MAIN_CONTACTS = [
  { phone: "081234567890", name: "Belanda Belinda", accountId: "ACC-001", balance: 200000 },
  { phone: "081298765432", name: "Belilindada haha", accountId: "ACC-002", balance: 500000 },
  { phone: "081300011122", name: "Safafufu Zabulaza", accountId: "ACC-003", balance: 1200000 },
  { phone: "087888123522", name: "Xaviera Azzahra", accountId: "ACC-004", balance: 1200000 },
  { phone: "087888123523", name: "Bimbim Mama", accountId: "ACC-005", balance: 1200000 },
  { phone: "087888122341", name: "Has Zabel", accountId: "ACC-006", balance: 1200000 },
  { phone: "087888122342", name: "Belsaf Buba", accountId: "ACC-007", balance: 1200000 },
  { phone: "087888122352", name: "Belindax Kocak", accountId: "ACC-008", balance: 1200000 },
  { phone: "087888122344", name: "Safzhar", accountId: "ACC-009", balance: 1200000 },
  { phone: "087888122151", name: "Zaza Siahaan", accountId: "ACC-010", balance: 1200000 },
  { phone: "087888112512", name: "Taf Saha", accountId: "ACC-011", balance: 1200000 },
  { phone: "087888122521", name: "Baik Baik Saja", accountId: "ACC-012", balance: 1200000 },
  { phone: "087888125231", name: "Siapa yang jadi", accountId: "ACC-013", balance: 1200000 },
];

const RECEIPTS_KEY = "mockReceipts";
const SAVED_CONTACTS_KEY = "mockSavedContacts";
const delay = (ms = 300) => new Promise((res) => setTimeout(res, ms));

const SAVED_CONTACTS_INITIAL = [
  { phone: "081234567890", name: "Belanda Belinda", accountId: "ACC-001", balance: 200000 },
  { phone: "081298765432", name: "Belilindada haha", accountId: "ACC-002", balance: 500000 },
  { phone: "081300011122", name: "Safafufu Zabulaza", accountId: "ACC-003", balance: 1200000 },
  { phone: "087888123522", name: "Xaviera Azzahra", accountId: "ACC-004", balance: 1200000 },
  { phone: "08788812352 3", name: "Bimbim Mama", accountId: "ACC-005", balance: 1200000 },
  { phone: "087888122341", name: "Has Zabel", accountId: "ACC-006", balance: 1200000 },
];

/* receipts helpers */
function loadReceipts() {
  try {
    const raw = sessionStorage.getItem(RECEIPTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveReceipts(obj) {
  try {
    sessionStorage.setItem(RECEIPTS_KEY, JSON.stringify(obj));
  } catch {}
}
function generateTxId() {
  return `TRX${Date.now()}`;
}

/* saved contacts helpers */
function loadSavedContacts() {
  try {
    const raw = sessionStorage.getItem(SAVED_CONTACTS_KEY);
    if (!raw) {
      const seed = clone(SAVED_CONTACTS_INITIAL || []);
      sessionStorage.setItem(SAVED_CONTACTS_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch {
    return clone(SAVED_CONTACTS_INITIAL || []);
  }
}
function saveSavedContacts(list) {
  try {
    sessionStorage.setItem(SAVED_CONTACTS_KEY, JSON.stringify(list));
  } catch {}
}

/* phone helpers */
function normalizePhone(phone = "") {
  return (phone || "").replace(/\D/g, "");
}
function phoneMatches(a = "", b = "") {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  if (!na || !nb) return false;
  return na === nb || na.endsWith(nb) || nb.endsWith(na);
}

/* deep clone helper */
const clone = (v) => (v ? JSON.parse(JSON.stringify(v)) : v);

/* ========================================================== */
export default function useTransferApi() {
  const [loading, setLoading] = useState(false);

  /* === Saved contacts API === */
  const fetchSavedContacts = async () => {
    setLoading(true);
    await delay(120);
    try {
      return clone(loadSavedContacts());
    } finally {
      setLoading(false);
    }
  };

  const searchSavedContacts = async (query = "") => {
    setLoading(true);
    await delay(120);
    try {
      const saved = loadSavedContacts();
      const q = (query || "").trim();
      if (!q) return clone(saved);
      const qLower = q.toLowerCase();
      const qDigits = normalizePhone(q);
      const filtered = saved.filter((c) => {
        const name = (c.name || "").toLowerCase();
        const phone = normalizePhone(c.phone || "");
        return name.includes(qLower) || (qDigits && phone.includes(qDigits));
      });
      return clone(filtered);
    } finally {
      setLoading(false);
    }
  };

  /* === Master DB lookup === */
  const lookupMainByPhone = async (phone) => {
    setLoading(true);
    await delay(250);
    try {
      if (!phone) return null;
      const found = MAIN_CONTACTS.find((c) => phoneMatches(c.phone, phone)) || null;
      return found ? clone(found) : null;
    } finally {
      setLoading(false);
    }
  };

  /* === Verify phone (for StepVerifyContact) === */
  const verifyPhone = async (phone) => {
    setLoading(true);
    await delay(300);
    try {
      if (!phone) return { status: "invalid" };

      const digits = (phone || "").replace(/\D/g, "");
      const local = digits.startsWith("62")
        ? "0" + digits.slice(2)
        : digits.startsWith("0")
        ? digits
        : digits.startsWith("8")
        ? "0" + digits
        : digits;

      const savedList = loadSavedContacts();
      const savedFound = savedList.find((c) => phoneMatches(c.phone, local));
      if (savedFound) return { status: "saved", contact: clone(savedFound) };

      const mainFound = MAIN_CONTACTS.find((c) => phoneMatches(c.phone, local));
      if (mainFound) return { status: "main", contact: clone(mainFound) };

      return { status: "notfound" };
    } catch (e) {
      console.error("verifyPhone error:", e);
      return { status: "error", error: e?.message || "Unknown error" };
    } finally {
      setLoading(false);
    }
  };

  /* === Add new contact === */
  const addSavedContact = async (phoneOrContact) => {
    setLoading(true);
    await delay(120);
    try {
      let candidate = null;
      if (typeof phoneOrContact === "string") {
        candidate = MAIN_CONTACTS.find((c) => phoneMatches(c.phone, phoneOrContact)) || null;
      } else if (phoneOrContact && phoneOrContact.phone) {
        candidate = MAIN_CONTACTS.find((c) => phoneMatches(c.phone, phoneOrContact.phone)) || null;
      }
      if (!candidate) return null;

      const saved = loadSavedContacts();
      const exists = saved.find((c) => phoneMatches(c.phone, candidate.phone));
      if (exists) return clone(exists);

      const entry = { ...candidate };
      saved.unshift(entry);
      saveSavedContacts(saved);
      return clone(entry);
    } finally {
      setLoading(false);
    }
  };

  /* === Transfer logic === */
  /* === performTransfer (updates MAIN, saved, and receipts) === */
  const performTransfer = async ({ phone, amount, note, pin }) => {
    setLoading(true);
    await delay(600);
    try {
      if (pin !== "123456") {
        return { status: "error", message: "Invalid PIN" };
      }
  
      const amt = Number(amount);
      if (isNaN(amt) || amt <= 0) {
        return { status: "error", message: "Invalid amount" };
      }
  
      // find recipient in MAIN
      const mainIdx = MAIN_CONTACTS.findIndex((c) => phoneMatches(c.phone, phone));
      if (mainIdx === -1) return { status: "error", message: "Recipient not found" };
  
      MAIN_CONTACTS[mainIdx].balance += amt;
  
      // --- update or add to saved contacts ---
      const saved = loadSavedContacts();
      const savedIdx = saved.findIndex((c) => phoneMatches(c.phone, phone));
  
      if (savedIdx !== -1) {
        // update balance if already saved
        saved[savedIdx].balance = MAIN_CONTACTS[mainIdx].balance;
      } else {
        // not saved yet → add to saved contacts
        const newContact = clone(MAIN_CONTACTS[mainIdx]);
        saved.unshift(newContact);
      }
      saveSavedContacts(saved);
  
      // --- record receipt ---
      const txId = generateTxId();
      const now = new Date();
      const receipt = {
        status: "success",
        transactionId: txId,
        receiver: MAIN_CONTACTS[mainIdx].name,
        phone,
        amount: amt,
        note: note || "",
        timestamp: now.toISOString(),
        date: now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        refId: `${now.getTime()}`,
        type: "Transfer",
        meta: { accountId: MAIN_CONTACTS[mainIdx].accountId },
      };
  
      try {
        const all = loadReceipts();
        all[txId] = receipt;
        saveReceipts(all);
      } catch (e) {}
  
      // --- return receipt object ---
      return receipt;
    } finally {
      setLoading(false);
    }
  };
  

  const getReceipt = async (transactionId) => {
    setLoading(true);
    await delay(120);
    try {
      const all = loadReceipts();
      return all[transactionId] || null;
    } finally {
      setLoading(false);
    }
  };

  const getAllAccounts = () => clone(MAIN_CONTACTS);
  const getSavedContacts = () => clone(loadSavedContacts());

  return {
    loading,
    fetchSavedContacts,
    searchSavedContacts,
    lookupMainByPhone,
    verifyPhone, // ✅ used by StepVerifyContact
    addSavedContact,
    performTransfer,
    getReceipt,
    getAllAccounts,
    getSavedContacts,
  };
}
