const fmtMoney = (n) => `Rp${(Number(n) || 0).toLocaleString("id-ID")}`;

export default function MonthSummary({ masuk = 0, keluar = 0 }) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-3">
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
        <div className="text-xs text-emerald-700/80">Total Masuk</div>
        <div className="text-sm md:text-base font-semibold text-emerald-700">
          {fmtMoney(masuk)}
        </div>
      </div>
      <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
        <div className="text-xs text-rose-700/80">Total Keluar</div>
        <div className="text-sm md:text-base font-semibold text-rose-700">
          {fmtMoney(keluar)}
        </div>
      </div>
    </div>
  );
}
