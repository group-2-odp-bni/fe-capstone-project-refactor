import React, { useMemo } from "react";
import useRecentTransfer from "../../hooks/api/useHistory"; // <-- use your hook

export default function TransactionList({ walletId = null, onTransactionClick = null }) {
  // useRecentTransfer returns { users, loading, error }
  const { users = [], loading, error } = useRecentTransfer({
    // you can pass filters here if needed
    // page: 0, size: 20, startDate, endDate, sortBy, direction, status
    // walletId isn't part of this hook's params, so we ignore it here
  });

  const formatRupiah = (v) => (v ?? 0).toLocaleString("id-ID");

  // normalize -> match the fields your component expects downstream
  const normalized = useMemo(() => {
    if (!Array.isArray(users) || users.length === 0) return [];

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

    // The hook already returns dateLabel/timeLabel, so we use those directly.
    // createdAt may not exist in hook items; we keep order as-is.
    return users.map((t, idx) => {
      // Try to build a Date if present; else keep a synthetic to avoid NaN sort
      const synthetic = new Date(Date.now() - idx * 1000); // preserve original order
      const d = t.createdAt ? new Date(t.createdAt) : synthetic;

      return {
        // Keep compatibility
        id: t.trxId ?? t.id ?? `trx-${idx}-${d.getTime()}`,
        trxId: t.trxId ?? t.id ?? null,

        // The hook doesn’t provide wallet info, so keep nulls
        walletId: t.walletId ?? null,
        walletName: t.walletName ?? null,
        walletType: t.walletType ?? null,

        // Names/phones from hook
        name: t.receiver ?? t.name ?? "-",
        receiverPhone: t.receiverPhone ?? t.phone ?? null,

        amount: Number(t.amount) || 0,
        type: t.type ?? null,       // "kirim" | "terima" from hook
        status: t.status ?? null,   // not provided by hook; stays null if missing
        notes: t.notes ?? "",       // not provided by hook; stays ""

        createdAt: d,
        // Prefer labels from hook; fallback to formatting d
        dateLabel: t.dateLabel ?? fmtDate(d),
        timeLabel: t.timeLabel ?? fmtTime(d),
      };
    });
    // no sort here: keep API order (already DESC by createdAt)
  }, [users]);

  // group by dateLabel into sections
  const sections = useMemo(() => {
    const map = new Map();
    for (const item of normalized) {
      const key = item.dateLabel;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
  }, [normalized]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between animate-pulse">
              <div className="flex-1 pr-3">
                <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-24 bg-gray-100 rounded" />
              </div>
              <div className="text-right">
                <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600">
        Gagal memuat transaksi.{" "}
        <button onClick={() => window.location.reload()} className="underline">
          Coba lagi
        </button>
      </div>
    );
  }

  if (!normalized || normalized.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        Belum ada transaksi.
      </div>
    );
  }

  return (
    <div className="">
      {sections.map((section) => (
        <div key={section.date} className="px-3 py-3">
          {/* Section date header */}
          <div className="text-sm text-gray-400 font-medium uppercase tracking-wide">
            {section.date}
          </div>

          <ul className="space-y-2">
            {section.items.map((t) => {
              const isIncome = String(t.type ?? "").toLowerCase() === "terima";
              const sign = isIncome ? "+" : "−";
              const amountColor = isIncome ? "text-emerald-500" : "text-black-400";

              return (
                <li key={t.id}>
                  <button
                    onClick={() => onTransactionClick?.(t)}
                    className="w-full flex justify-between py-2 bg-white border-b border-gray-200"
                    aria-label={`Open receipt for ${t.name}`}
                  >
                    {/* Left info */}
                    <div className="min-w-0 pr-3 text-left">
                      <p className="text-l font-semibold text-gray-900 truncate">
                        {t.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{t.receiverPhone}</p>
                    </div>

                    {/* Right info */}
                    <div className="text-right">
                      <p className={`text-l font-semibold ${amountColor}`}>
                        {sign} Rp{formatRupiah(t.amount)}
                      </p>
                      <p className="text-sm text-gray-400">
                        {t.dateLabel} {t.timeLabel}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
