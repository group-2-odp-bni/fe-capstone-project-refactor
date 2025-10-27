// src/hooks/api/useQuickTransfer.jsx
import { useEffect, useState, useCallback } from "react";

/**
 * Simple mock hook to return the user's saved/favorite contacts.
 * It reads from sessionStorage key 'mockSavedContacts' (same key used by your useTransferApi mock).
 * If nothing exists in sessionStorage, it seeds a small sample list.
 *
 * Returns: { contacts: Array, loading: boolean, error: null|string, refetch: fn }
 */

const SAVED_CONTACTS_KEY = "mockSavedContacts";
const delay = (ms = 300) => new Promise((res) => setTimeout(res, ms));

const SAMPLE = [
  { phone: "081234567890", name: "Belanda Belinda", accountId: "ACC-001", balance: 200000 },
  { phone: "081298765432", name: "Belilindada haha", accountId: "ACC-002", balance: 500000 },
  { phone: "081300011122", name: "Safafufu Zabulaza", accountId: "ACC-003", balance: 1200000 },
  { phone: "087888123522", name: "Xaviera Azzahra", accountId: "ACC-004", balance: 1200000 },
  { phone: "087888123523", name: "Bimbim Mama", accountId: "ACC-005", balance: 1200000 },
  { phone: "087888122341", name: "Has Zabel", accountId: "ACC-006", balance: 1200000 },
];

function loadSavedContactsSeed() {
  try {
    const raw = sessionStorage.getItem(SAVED_CONTACTS_KEY);
    if (!raw) {
      // seed sample list
      const seed = SAMPLE;
      try {
        sessionStorage.setItem(SAVED_CONTACTS_KEY, JSON.stringify(seed));
      } catch (e) {}
      return seed;
    }
    return JSON.parse(raw);
  } catch (e) {
    return SAMPLE;
  }
}

export default function useQuickTransfer({ limit = 20 } = {}) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    await delay(220);
    try {
      const saved = loadSavedContactsSeed();
      // attach a mock lastTransferAt for sorting (recent first)
      // If contact already has `lastTransferAt`, keep it; else randomize recent date
      const enhanced = saved.map((c, i) => {
        const last = c.lastTransferAt
          ? new Date(c.lastTransferAt)
          : new Date(Date.now() - i * 1000 * 60 * 60 * (Math.floor(Math.random() * 48) + 1));
        return { ...c, lastTransferAt: last.toISOString() };
      });
      // sort desc by lastTransferAt and limit
      enhanced.sort((a, b) => new Date(b.lastTransferAt) - new Date(a.lastTransferAt));
      setContacts(enhanced.slice(0, limit));
    } catch (e) {
      setError("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { contacts, loading, error, refetch: fetch };
}
