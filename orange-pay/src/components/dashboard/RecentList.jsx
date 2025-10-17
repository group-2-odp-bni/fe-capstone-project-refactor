import useRecentTransfer from "../../hooks/api/useRecentTransfer";

export default function RecentList() {
  const { users = [], loading } = useRecentTransfer();

  const formatRupiah = (v) => v.toLocaleString("id-ID");

  return (
    <section className="mt-6">
      <h3 className="px-3 font-semibold text-lg text-gray-900 mb-3 text-left ">Recent</h3>

      <div className="mt-4 space-y-5 px-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex justify-between items-center animate-pulse">
              <div>
                <div className="bg-gray-300 h-4 w-24 rounded mb-1"></div>
                <div className="bg-gray-200 h-3 w-16 rounded"></div>
              </div>
              <div className="text-right">
                <div className="bg-gray-300 h-4 w-20 rounded mb-1"></div>
                <div className="bg-gray-200 h-3 w-16 rounded"></div>
              </div>
            </div>
          ))
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada transaksi.</p>
        ) : (
          users.map((user, index) => {
            const isIncome = user.type === "Pemasukan";
            const sign = isIncome ? "+" : "-";
            const amountColor = isIncome ? "text-emerald-600" : "text-gray-800";

            return (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-gray-800 text-left">{user.name}</p>
                  <p className="text-xs text-gray-500 text-left">{user.type}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${amountColor}`}>
                    {sign} Rp{formatRupiah(user.amount)}
                  </p>
                  <p className="text-xs text-gray-500">{user.date}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
