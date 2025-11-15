import React, { useMemo } from "react";
import useRecentTransfer from "../../hooks/api/useHistory";

export default function TransactionList({ walletId = null, onTransactionClick = null }) {
  const { users = [], loading, error } = useRecentTransfer();

  const formatRupiah = (v) => (v ?? 0).toLocaleString("id-ID");

  const normalized = useMemo(() => {
    if (!Array.isArray(users) || users.length === 0) return [];

    return users.map((t, idx) => {
      const d = t.createdAt ? new Date(t.createdAt) : new Date(Date.now() - idx * 1000);

      return {
        id: t.trxId ?? t.id ?? `trx-${idx}`,
        trxId: t.trxId ?? t.id ?? null,

        name: t.name ?? "-",
        receiverPhone: t.receiverPhone ?? t.phone ?? null,

        amount: Number(t.amount) || 0,
        rawType: t.rawType ?? null, // <-- the key type from backend

        // use the hook labels
        dateLabel: t.dateLabel,
        timeLabel: t.timeLabel,

        createdAt: d,
      };
    });
  }, [users]);

  const sections = useMemo(() => {
    const map = new Map();
    for (const item of normalized) {
      const key = item.dateLabel;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
  }, [normalized]);

  const typeLabel = (raw) => {
    const map = {
      TRANSFER_IN: "Transfer In",
      TRANSFER_OUT: "Transfer Out",
      TOP_UP: "Top Up",
    };
    if (map[raw]) return map[raw];
    return raw?.replace(/_/g, " ").toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
  };

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

  if (!normalized.length) {
    return <div className="p-6 text-center text-sm text-gray-500">Belum ada transaksi.</div>;
  }

  return (
    <div>
      {sections.map((section) => (
        <div key={section.date} className="px-3 py-3">
          <div className="text-sm text-gray-400 font-medium uppercase tracking-wide">
            {section.date}
          </div>

          <ul className="space-y-2">
            {section.items.map((t) => {
              const isIncome = t.rawType === "TRANSFER_IN" || t.rawType === "TOP_UP";
              const sign = isIncome ? "+" : "−";
              const amountColor = isIncome ? "text-emerald-500" : "text-black-600";

              return (
                <li key={t.id}>
                  <button
                    onClick={() => onTransactionClick?.(t)}
                    className="w-full flex justify-between py-3 bg-white border-b border-gray-200 hover:bg-gray-50 transition"
                  >
                    <div className="min-w-0 pr-3 text-left">
                      <p className="text-base font-semibold text-gray-900 truncate">
                        {t.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{typeLabel(t.rawType)}</p>
                    </div>

                    <div className="text-right">
                      <p className={`text-base font-semibold ${amountColor}`}>
                        {sign} Rp{formatRupiah(t.amount)}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {t.timeLabel}
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
