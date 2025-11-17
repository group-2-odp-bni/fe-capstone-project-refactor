import { useNavigate } from "react-router-dom";
import useRecentTransfer from "../../hooks/api/useHistory";
import Header from "../Header";
export default function RecentList() {
  const { users = [], loading } = useRecentTransfer();
  const navigate = useNavigate();

  const formatRupiah = (v) => (v ?? 0).toLocaleString("id-ID");

  return (
    <section className="mt-6">
      <div
        onClick={() => navigate("/app/allhistory")}
        className="flex items-center justify-between cursor-pointer group"
      >
        <h3 className="font-semibold text-lg text-gray-900 mb-3 text-left group-hover:text-primary transition-colors">
          Transaksi terakhir
        </h3>
        <span className="text-sm text-gray-500 group-hover:text-primary transition-colors">
          Lihat semua →
        </span>
      </div>

      <div
        onClick={() => navigate("/app/allhistory")}
        className="rounded-[24px] border border-gray-200 bg-white cursor-pointer transition-shadow"
      >
        <div className="p-4">
          {loading ? (
            // Skeleton loading
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
          ) : users.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-500">
              Belum ada transaksi.
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <ul className="mt-2.5 divide-y divide-gray-200">
                {users.map((user) => {
                  const isIncome =
                    user.rawType === "TRANSFER_IN" || user.rawType === "TOP_UP" || user.rawType === "INTERNAL_TRANSFER_IN";

                  const sign = isIncome ? "+" : "−";
                  const amountColor = isIncome
                    ? "text-emerald-500"
                    : "text-black-600";

                  // Format label based on backend type
                  const labelMap = {
                    TRANSFER_IN: "Transfer In",
                    TRANSFER_OUT: "Transfer Out",
                    TOP_UP: "Top Up",
                  };

                  // formatted label
                  const label =
                    labelMap[user.rawType] ||
                    user.rawType
                      ?.replace(/_/g, " ")
                      .toLowerCase()
                      .replace(/(^|\s)\S/g, (c) => c.toUpperCase()) ||
                    "-";

                  return (
                    <li
                      key={user.id}
                      className="py-2 first:pt-0 last:pb-0 hover:bg-gray-50/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 pr-3 text-left">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {user.name}
                          </p>

                          {/* UPDATED LABEL HERE */}
                          <p className="text-xs text-gray-500 truncate">
                            {label}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className={`text-sm ${amountColor}`}>
                            {sign} Rp{formatRupiah(user.amount)}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {user.dateLabel} · {user.timeLabel}
                          </p>
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
