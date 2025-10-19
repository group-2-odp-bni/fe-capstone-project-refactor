import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";

/**
 * useRecentTransfer
 *
 * Fitur:
 * - Data mock + opsi toggle ke API
 * - Timestamp lengkap (createdAt ISO dengan offset +07:00)
 * - Formatting siap pakai: dateLabel (e.g. "8 Okt 2025"), timeLabel (e.g. "14.30")
 * - Filter: since (mulai tanggal-jam), until, type ("kirim"|"terima"), search (nama)
 * - sections: grouping per hari (untuk header tanggal di RecentList.jsx)
 *
 * @param {Object} opts
 * @param {string|Date|null} opts.since - hanya ambil data setelah/tanggal-jam ini (zona Asia/Jakarta)
 * @param {string|Date|null} opts.until - batasi hingga tanggal-jam ini
 * @param {"kirim"|"terima"|null} opts.type - filter tipe transaksi
 * @param {string|null} opts.search - cari berdasarkan nama (case-insensitive)
 * @param {boolean} opts.useApi - pakai API beneran?
 * @returns {Object} { users, sections, loading, error, refetch }
 */
export default function useRecentTransfer({
  since = null,
  until = null,
  type = null,
  search = null,
  useApi = false,
} = {}) {
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==== Mock data (dengan timestamp ISO +07:00) ====
  const mockData = [
    { name: "Safu", amount: 100000, type: "kirim",  createdAt: "2025-10-07T09:12:00+07:00" },
    { name: "Fufu", amount: 100000, type: "terima", createdAt: "2025-10-07T11:45:00+07:00" },
    { name: "Ahong", amount: 100000, type: "terima", createdAt: "2025-10-07T16:03:00+07:00" },
    { name: "Raka", amount: 100000, type: "kirim",  createdAt: "2025-10-07T20:15:00+07:00" },
    { name: "Ayu",  amount: 250000, type: "terima", createdAt: "2025-10-08T08:05:00+07:00" },
    { name: "Ayu",  amount: 250000, type: "kirim",  createdAt: "2025-10-08T09:20:00+07:00" },
    { name: "Ayu",  amount: 250000, type: "kirim",  createdAt: "2025-10-08T10:32:00+07:00" },
    { name: "Ayu",  amount: 250000, type: "terima", createdAt: "2025-10-08T11:11:00+07:00" },
    { name: "Ayu",  amount: 250000, type: "terima", createdAt: "2025-10-08T12:44:00+07:00" },
    { name: "Ayu",  amount: 250000, type: "terima", createdAt: "2025-10-08T13:10:00+07:00" },
    { name: "Belinda",  amount: 250000, type: "terima", createdAt: "2025-10-08T14:55:00+07:00" },
    { name: "ZipZip",  amount: 250000, type: "terima", createdAt: "2025-10-08T16:22:00+07:00" },
    { name: "Munmun",  amount: 250000, type: "terima", createdAt: "2025-10-08T18:01:00+07:00" },
    { name: "Namara",  amount: 250000, type: "kirim",  createdAt: "2025-10-08T19:40:00+07:00" },
    { name: "Rosadi",  amount: 250000, type: "kirim",  createdAt: "2025-10-08T20:05:00+07:00" },
    { name: "Ahong",  amount: 250000, type: "terima", createdAt: "2025-10-08T21:17:00+07:00" },
    { name: "Opang",  amount: 250000, type: "terima", createdAt: "2025-09-08T21:17:00+07:00" },
    { name: "Agoys",  amount: 250000, type: "kirim", createdAt: "2025-09-08T21:17:00+07:00" }
  ];

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let data;
      if (useApi) {
        // contoh API
        const res = await axios.get("https://your-api.com/recent-transfers", {
          headers: { accept: "application/json" },
        });
        data = Array.isArray(res.data) ? res.data : [];
      } else {
        // simulasi delay API
        await new Promise((r) => setTimeout(r, 800));
        data = mockData;
      }

      setRaw(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [useApi]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await refetch();
      if (!mounted) return;
    })();
    return () => {
      mounted = false;
    };
  }, [refetch]);

  // ===== Helpers: format Indonesia (Asia/Jakarta) =====
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
      .replace(".", ":"); // kadang locale pakai titik

  const toDate = (v) => (v ? new Date(v) : null);

  // ===== Derive + filter + sort =====
  const users = useMemo(() => {
    const sinceD = toDate(since);
    const untilD = toDate(until);

    return raw
      .map((item, idx) => {
        const d = new Date(item.createdAt); // ISO +07:00 -> aman
        return {
          id: item.id ?? `${item.name}-${idx}-${d.getTime()}`,
          name: item.name,
          amount: Number(item.amount) || 0,
          type: item.type, // "kirim" | "terima"
          createdAt: d,
          createdAtISO: item.createdAt,
          dateLabel: fmtDate(d),
          timeLabel: fmtTime(d),
        };
      })
      .filter((x) => (type ? x.type === type : true))
      .filter((x) =>
        search ? String(x.name).toLowerCase().includes(String(search).toLowerCase()) : true
      )
      .filter((x) => (sinceD ? x.createdAt >= sinceD : true))
      .filter((x) => (untilD ? x.createdAt <= untilD : true))
      .sort((a, b) => b.createdAt - a.createdAt); // terbaru duluan
  }, [raw, since, until, type, search]);

  // ===== Grouping per tanggal (untuk section header di RecentList.jsx) =====
  const sections = useMemo(() => {
    const map = new Map();
    for (const u of users) {
      const key = u.dateLabel; // contoh: "8 Okt 2025"
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
