import React, { useMemo } from "react";
import useRecentTransfer from "../../hooks/api/useHistory";
import { useNavigate } from "react-router-dom";

export default function TransactionList({
  walletId = null,
  onTransactionClick = null,
}) {
  const { users = [], loading, error } = useRecentTransfer();
  const navigate = useNavigate();
  const formatRupiah = (v) => (v ?? 0).toLocaleString("id-ID");

  const normalized = useMemo(() => {
    if (!Array.isArray(users) || users.length === 0) return [];

    return users.map((t, idx) => {
      const d = t.createdAt
        ? new Date(t.createdAt)
        : new Date(Date.now() - idx * 1000);

      return {
        id: t.trxId ?? t.id ?? `trx-${idx}`,
        trxId: t.trxId ?? t.id ?? null,

        name: t.name ?? "-",
        receiverPhone: t.receiverPhone ?? t.phone ?? null,

        amount: Number(t.amount) || 0,
        rawType: t.rawType ?? null,
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
    return raw
      ?.replace(/_/g, " ")
      .toLowerCase()
      .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between animate-pulse"
            >
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
    return (
      <div className="py-16 px-6 flex flex-col items-center justify-center text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="w-12 h-12 text-gray-400"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>

        <h3 className="mt-4 text-lg font-semibold text-gray-800">
          Belum Ada Transaksi
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Riwayat transaksi Anda akan muncul di sini setelah Anda melakukan
          transaksi pertama.
        </p>

        <div className="mt-6 flex items-center space-x-4">
          <button
            onClick={() => navigate("/app/transfer")}
            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-orange-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
          >
            Buat Transfer
          </button>

          <button
            onClick={() => navigate("/app/topup")}
            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-orange-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
          >
            Tambah Saldo
          </button>
        </div>
      </div>
    );
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
              const raw = (t.rawType || "").toUpperCase();
              const isIncome =
                raw === "TRANSFER_IN" || raw === "TOP_UP" || raw === "INTERNAL_TRANSFER_IN";
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
                      <p className="text-xs text-gray-500 truncate">
                        {typeLabel(t.rawType)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className={`text-base font-semibold ${amountColor}`}>
                        {sign} Rp{formatRupiah(t.amount)}
                      </p>
                      <p className="text-[11px] text-gray-400">{t.timeLabel}</p>
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
