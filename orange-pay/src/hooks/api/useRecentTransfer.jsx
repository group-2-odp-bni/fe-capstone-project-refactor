import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";

/**
 * useRecentTransfer
 *
 * Fitur:
 * - Data mock + opsi toggle ke API
 * - Timestamp lengkap (createdAt ISO dengan offset +07:00)
 * - Formatting siap pakai: dateLabel (e.g. "8 Okt 2025"), timeLabel (e.g. "14.30")
 * - Filter: since, until, type, search, walletId
 * - sections: grouping per hari
 *
 * @param {Object} opts
 * @param {string|null} opts.walletId - ID wallet untuk filter transaksi
 * @param {string|Date|null} opts.since - mulai tanggal/jam
 * @param {string|Date|null} opts.until - hingga tanggal/jam
 * @param {"kirim"|"terima"|null} opts.type - filter tipe transaksi
 * @param {string|null} opts.search - cari berdasarkan nama
 * @param {boolean} opts.useApi - pakai API beneran?
 * @returns {Object} { users, sections, loading, error, refetch }
 */
export default function useRecentTransfer({
  walletId = null,
  since = null,
  until = null,
  type = null,
  search = null,
  useApi = false,
} = {}) {
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==== Mock data (dengan walletId untuk demo) ====
  const mockData = [
    { walletId: "main", name: "HAHSDHASD", amount: 100000, type: "kirim", createdAt: "2025-10-07T09:12:00+07:00" },
    { walletId: "main", name: "Fufu", amount: 100000, type: "terima", createdAt: "2025-10-07T11:45:00+07:00" },
    { walletId: "personal", name: "Ahong", amount: 100000, type: "terima", createdAt: "2025-10-07T16:03:00+07:00" },
    { walletId: "personal", name: "Raka", amount: 100000, type: "kirim", createdAt: "2025-10-07T20:15:00+07:00" },
    { walletId: "personal", name: "Ayu", amount: 250000, type: "terima", createdAt: "2025-10-08T08:05:00+07:00" },
    { walletId: "personal", name: "Ayu", amount: 250000, type: "kirim", createdAt: "2025-10-08T09:20:00+07:00" },
    { walletId: "personal", name: "Ayu", amount: 250000, type: "kirim", createdAt: "2025-10-08T10:32:00+07:00" },
    { walletId: "business", name: "Ayu", amount: 250000, type: "terima", createdAt: "2025-10-08T11:11:00+07:00" },
    { walletId: "business", name: "Ayu", amount: 250000, type: "terima", createdAt: "2025-10-08T12:44:00+07:00" },
    { walletId: "business", name: "Ayu", amount: 250000, type: "terima", createdAt: "2025-10-08T13:10:00+07:00" },
    { walletId: "business", name: "Belinda", amount: 250000, type: "terima", createdAt: "2025-10-08T14:55:00+07:00" },
    { walletId: "main", name: "ZipZip", amount: 250000, type: "terima", createdAt: "2025-10-08T16:22:00+07:00" },
    { walletId: "main", name: "Munmun", amount: 250000, type: "terima", createdAt: "2025-10-08T18:01:00+07:00" },
    { walletId: "main", name: "Namara", amount: 250000, type: "kirim", createdAt: "2025-10-08T19:40:00+07:00" },
    { walletId: "personal", name: "Rosadi", amount: 250000, type: "kirim", createdAt: "2025-10-08T20:05:00+07:00" },
    { walletId: "business", name: "Ahong", amount: 250000, type: "terima", createdAt: "2025-10-08T21:17:00+07:00" },
    { walletId: "business", name: "Opang", amount: 250000, type: "terima", createdAt: "2025-09-08T21:17:00+07:00" },
    { walletId: "main", name: "Agoys", amount: 250000, type: "kirim", createdAt: "2025-09-08T21:17:00+07:00" },
  ];

  // ===== Ambil data (mock atau API) =====
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let data;
      if (useApi) {
        const res = await axios.get("https://your-api.com/recent-transfers", {
          headers: { accept: "application/json" },
        });
        data = Array.isArray(res.data) ? res.data : [];
      } else {
        await new Promise((r) => setTimeout(r, 600)); // simulasi delay
        data = mockData;
      }

      setRaw(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [useApi]);

  // 🔁 Re-fetch setiap kali walletId berubah (misalnya pindah kartu)
  useEffect(() => {
    refetch();
  }, [refetch, walletId]);

  // ===== Helpers format waktu =====
  const fmtDate = (d) =>
    new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);

  const fmtTime = (d) =>
    new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .format(d)
      .replace(".", ":");

  const toDate = (v) => (v ? new Date(v) : null);

  // ===== Proses data + filter =====
  const users = useMemo(() => {
    const sinceD = toDate(since);
    const untilD = toDate(until);

    return raw
      .map((item, idx) => {
        const d = new Date(item.createdAt);
        return {
          id: item.id ?? `${item.name}-${idx}-${d.getTime()}`,
          walletId: item.walletId ?? "main", // fallback default
          name: item.name,
          amount: Number(item.amount) || 0,
          type: item.type,
          createdAt: d,
          createdAtISO: item.createdAt,
          dateLabel: fmtDate(d),
          timeLabel: fmtTime(d),
        };
      })
      .filter((x) => (walletId ? x.walletId === walletId : true))
      .filter((x) => (type ? x.type === type : true))
      .filter((x) =>
        search ? String(x.name).toLowerCase().includes(String(search).toLowerCase()) : true
      )
      .filter((x) => (sinceD ? x.createdAt >= sinceD : true))
      .filter((x) => (untilD ? x.createdAt <= untilD : true))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [raw, walletId, since, until, type, search]);

  // ===== Group per tanggal =====
  const sections = useMemo(() => {
    const map = new Map();
    for (const u of users) {
      const key = u.dateLabel;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(u);
    }
    return Array.from(map.entries()).map(([date, items]) => ({
      date,
      items,
    }));
  }, [users]);

  return { users, sections, loading, error, refetch };
}
