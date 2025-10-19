import { useMemo, useState } from "react";
import useRecentTransfer from "../../hooks/api/useRecentTransfer";
import MonthChips, { MONTHS } from "../history_transaksi/MonthChips";
import MonthSummary from "../history_transaksi/MonthSummary";

const fmt = (n) => (Number(n) || 0).toLocaleString("id-ID");
const getMonthShort = (d) => MONTHS[d.getMonth()];
const isIncomeType = (type = "") => {
  const t = String(type).toLowerCase();
  return t.includes("terima") || t.includes("masuk");
};

export default function RecentHistory() {
  const { users = [], loading } = useRecentTransfer();
  const [activeMonth, setActiveMonth] = useState(getMonthShort(new Date()));

  // normalisasi + label tanggal/jam (fallback kalau belum disediakan hook)
  const normalized = useMemo(() => {
    return users
      .map((u, i) => {
        const d =
          u.createdAt instanceof Date
            ? u.createdAt
            : u.createdAtISO
            ? new Date(u.createdAtISO)
            : u.date
            ? new Date(u.date)
            : new Date();

        const dateLabel =
          u.dateLabel ??
          new Intl.DateTimeFormat("id-ID", {
            timeZone: "Asia/Jakarta",
            day: "numeric",
            month: "short",
            year: "numeric",
          }).format(d);

        const timeLabel =
          u.timeLabel ??
          new Intl.DateTimeFormat("id-ID", {
            timeZone: "Asia/Jakarta",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
            .format(d)
            .replace(".", ":");

        return {
          ...u,
          id: u.id ?? `${u.name}-${i}-${d.getTime()}`,
          createdAt: d,
          monthShort: getMonthShort(d),
          dateLabel,
          timeLabel,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [users]);

  // hanya item di bulan aktif
  const monthItems = useMemo(
    () => normalized.filter((x) => x.monthShort === activeMonth),
    [normalized, activeMonth]
  );

  // summary bulan
  const { masuk, keluar } = useMemo(() => {
    let masuk = 0,
      keluar = 0;
    for (const it of monthItems) {
      if (isIncomeType(it.type)) masuk += Number(it.amount) || 0;
      else keluar += Number(it.amount) || 0;
    }
    return { masuk, keluar };
  }, [monthItems]);

  return (
    <section className="mt-8">
      {/* picker + summary */}
      <MonthChips activeMonth={activeMonth} onChange={setActiveMonth} />
      <MonthSummary masuk={masuk} keluar={keluar} />

      {/* Kartu list — gaya persis RecentList */}
      <div className="mt-8 rounded-[24px] border border-gray-200 bg-white shadow-sm">
        <div className="p-4">
          {loading ? (
            <ul className="divide-y divide-gray-100">
              {Array.from({ length: 4 }).map((_, idx) => (
                <li key={idx} className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 pr-3">
                      <div className="bg-gray-200 h-4 w-28 rounded mb-1 animate-pulse" />
                      <div className="bg-gray-100 h-3 w-24 rounded animate-pulse" />
                    </div>
                    <div className="text-right">
                      <div className="bg-gray-200 h-4 w-24 rounded mb-1 animate-pulse" />
                      <div className="bg-gray-100 h-3 w-20 rounded animate-pulse" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : monthItems.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-500">
              Belum ada transaksi.
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <ul className="mt-2.5 divide-y divide-gray-200">
                {monthItems.map((item) => {
                  const isIncome = isIncomeType(item.type);
                  const sign = isIncome ? "+" : "−";
                  const amountColor = isIncome ? "text-emerald-500" : "text-red-600";
                  const leftSub = isIncome
                    ? "Transfer Masuk"
                    : String(item.type).toLowerCase() === "kirim"
                    ? "Transfer"
                    : item.type ?? "-";
                  const rightSub = `${item.dateLabel} · ${item.timeLabel}`;

                  return (
                    <li
                      key={item.id}
                      className="py-2 first:pt-0 last:pb-0 hover:bg-gray-50/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        {/* Left */}
                        <div className="min-w-0 pr-3 text-left">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{leftSub}</p>
                        </div>

                        {/* Right */}
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${amountColor}`}>
                            {sign} Rp{fmt(item.amount)}
                          </p>
                          <p className="text-[11px] text-gray-500">{rightSub}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}