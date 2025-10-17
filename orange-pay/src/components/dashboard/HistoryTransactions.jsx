import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../lib/api";

export default function HistoryTransactions() {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const now = new Date();
  const currentMonthShort = now.toLocaleString("en-US", { month: "short" });
  const initialMonth = months.includes(currentMonthShort) ? currentMonthShort : months[0];

  const [activeMonth, setActiveMonth] = useState(initialMonth);
  const monthRefs = useRef([]);

  useEffect(() => {
    const idx = months.indexOf(initialMonth);
    if (monthRefs.current[idx]) {
      monthRefs.current[idx].scrollIntoView({ behavior: "smooth", inline: "center" });
    }
  }, []);

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const year = now.getFullYear();
  const monthToNumber = (m) => months.indexOf(m) + 1;
  const yyyymm = useMemo(() => {
    const mm = String(monthToNumber(activeMonth)).padStart(2, "0");
    return `${year}-${mm}`;
  }, [activeMonth, year]);

  // mock fallback
  const mock = [
    { name: "Safu", type: "Transfer Masuk",  amount: "+ Rp100.000",  date: "11 Oct 2025" },
    { name: "Fufu", type: "Transfer Masuk",  amount: "+ Rp1.177.000",date: "7 Oct 2025" },
    { name: "Giyb", type: "Transfer Masuk",  amount: "+ Rp100.000",  date: "7 Oct 2025" },
    { name: "Raka", type: "Transfer Masuk",  amount: "+ Rp20.000",   date: "7 Oct 2025" },
    { name: "Safu", type: "Transfer Masuk",  amount: "+ Rp43.000",   date: "7 Oct 2025" },
    { name: "Fufu", type: "Transfer Masuk",  amount: "+ Rp100.000",  date: "7 Oct 2025" },
    { name: "Giyb", type: "Transfer Masuk",  amount: "+ Rp525.000",  date: "7 Oct 2025" },
    { name: "Giran",type: "Transfer Masuk",  amount: "+ Rp525.000",  date: "7 Oct 2025" },
    { name: "Bran", type: "Transfer Masuk",  amount: "+ Rp525.000",  date: "7 Oct 2025" },
    { name: "Rara", type: "Transfer Keluar", amount: "- Rp80.000",   date: "5 Sep 2025" },
    { name: "Budi", type: "Transfer Keluar", amount: "- Rp50.000",   date: "2 Aug 2025" },
  ];

  const filterByMonthShort = (list, monthShort) =>
    list.filter((t) => (t.date.split(" ")[1] || "").slice(0, 3) === monthShort);

  // helpers
  const parseRupiahToNumber = (val) => {
    if (typeof val === "number") return val;
    if (typeof val !== "string") return 0;
    const sign = val.trim().startsWith("-") ? -1 : 1;
    const digits = val.replace(/[^0-9]/g, "");
    if (!digits) return 0;
    return sign * Number(digits);
  };

  const amountClass = (v) => {
    const n = typeof v === "number" ? v : parseRupiahToNumber(v);
    return n >= 0 ? "text-emerald-600" : "text-rose-600";
  };

  const formatAmountForDisplay = (v) => {
    if (typeof v === "number") {
      const sign = v >= 0 ? "+" : "-";
      const abs = Math.abs(v);
      return `${sign} Rp${abs.toLocaleString("id-ID")}`;
    }
    if (typeof v === "string") return v;
    return "+ Rp0";
  };

  const tryParseDmy = (s) => {
    try {
      const [d, mon, y] = s.split(" ");
      const map = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
      return new Date(Number(y), map[mon], Number(d));
    } catch {
      return new Date(s);
    }
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return "";
    const parsed = /\d{4}-\d{2}-\d{2}/.test(dateStr) ? new Date(dateStr) : tryParseDmy(dateStr);
    if (isNaN(parsed.getTime())) return dateStr;
    const d = parsed.getDate();
    const m = parsed.toLocaleString("en-US", { month: "short" });
    const y = parsed.getFullYear();
    return `${d} ${m} ${y}`;
  };

  // fetcher
  const fetchPage = async ({ reset = false } = {}) => {
    setLoading(true);
    setError("");
    const nextPage = reset ? 1 : page;

    try {
      const res = await api.get("/transactions", {
        params: { month: yyyymm, page: nextPage, limit: 20 },
      });

      const payload = res.data || {};
      const list = Array.isArray(payload.data) ? payload.data : [];
      const more = Boolean(payload.hasMore);

      setItems((prev) => (reset ? list : [...prev, ...list]));
      setHasMore(more);
      setPage((p) => (reset ? 2 : p + 1));
    } catch (err) {
      const mocked = filterByMonthShort(mock, activeMonth);
      setItems((prev) => (reset ? mocked : [...prev, ...mocked]));
      setHasMore(false);
      setError("");
      if (reset) setPage(2);
    } finally {
      setLoading(false);
    }
  };

  // reload on month change
  useEffect(() => {
    setItems([]);
    setHasMore(false);
    setPage(1);
    fetchPage({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMonth, yyyymm]);

  return (
    <section className="w-full mt-2">
      {/* month chips */}
      <div className="flex overflow-x-auto space-x-2 scrollbar-hide">
        {months.map((m, idx) => (
          <button
            key={m}
            ref={(el) => (monthRefs.current[idx] = el)}
            onClick={() => setActiveMonth(m)}
            className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 border
              ${activeMonth === m
                ? "bg-amber-400 text-white border-amber-400"
                : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"}`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* card */}
      <div className="mt-3 bg-white rounded-2xl shadow-md border border-gray-200 p-1">
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Riwayat Transaksi</h3>
          <span className="text-xs text-gray-400">{yyyymm}</span>
        </div>

        <div className={`-mx-1 ${items.length >= 7 ? "max-h-[320px] overflow-y-auto" : ""}`}>
          {loading && items.length === 0 ? (
            <SkeletonRows />
          ) : items.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {items.map((it, idx) => (
                <li key={idx} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex flex-col text-sm text-gray-800 pl-1">
                    <span className="font-semibold">{it.name}</span>
                    <span className="text-gray-500 text-xs">{it.type}</span>
                  </div>
                  <div className="text-right text-sm">
                    <span className={`${amountClass(it.amount)} font-semibold`}>
                      {formatAmountForDisplay(it.amount)}
                    </span>
                    <div className="text-gray-400 text-xs">{formatDateShort(it.date)}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-gray-400">Tidak ada transaksi</div>
          )}

          {error && <div className="px-4 py-2 text-xs text-amber-600">{error}</div>}
        </div>

        {hasMore && (
          <div className="px-4 py-3">
            <button
              onClick={() => fetchPage()}
              disabled={loading}
              className="w-full text-sm rounded-lg border border-gray-200 py-2 hover:bg-gray-50 disabled:opacity-60"
            >
              {loading ? "Memuat..." : "Muat lebih banyak"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function SkeletonRows() {
  return (
    <div className="-mx-1 divide-y divide-gray-100">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="px-4 py-3 flex items-center justify-between animate-pulse">
          <div className="flex flex-col gap-2">
            <span className="h-4 w-24 bg-gray-200 rounded" />
            <span className="h-3 w-20 bg-gray-100 rounded" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="h-4 w-20 bg-gray-200 rounded" />
            <span className="h-3 w-16 bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
