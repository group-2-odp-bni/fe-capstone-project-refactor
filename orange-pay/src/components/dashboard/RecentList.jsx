import useRecentTransfer from "../../hooks/api/useRecentTransfer";

export default function RecentList() {
  const { users = [], loading } = useRecentTransfer();

  const formatRupiah = (v) => (v ?? 0).toLocaleString("id-ID");

  const formatDate = (raw) => {
    if (!raw) return "-";
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return raw;
      const day = d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const time = d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return `${day} · ${time}`;
    } catch {
      return raw;
    }
  };

  return (
    <section className="mt-6">
      <h3 className="px-3 font-semibold text-lg text-gray-900 mb-3 text-left">
        Recent
      </h3>

      {/* Card container */}
      <div className="rounded-[24px] border border-gray-200 bg-white shadow-sm">
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
          ) : users.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-500">
              Belum ada transaksi.
            </div>
          ) : (
            // Scroll kebawah jika item banyak
            <div className="max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <ul className="mt-2.5 divide-y divide-gray-200">
                {users.map((user, index) => {
                  const isIncome = user.type?.toLowerCase() === "terima";
                  const sign = isIncome ? "+" : "−";
                  const amountColor = isIncome ? "text-emerald-400" : "text-gray-700";
                  const rightSub = formatDate(user.date);

                  return (
                    <li
                      key={index}
                      className="py-2 first:pt-0 last:pb-0 hover:bg-gray-50/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        {/* Left */}
                        <div className="min-w-0 pr-3 text-left">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.type?.toLowerCase() === "terima"
                              ? "Transfer Masuk"
                              : user.type?.toLowerCase() === "kirim"
                              ? "Transfer"
                              : user.type ?? "-"}
                          </p>
                        </div>

                        {/* Right */}
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${amountColor}`}>
                            {sign} Rp{formatRupiah(user.amount)}
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
