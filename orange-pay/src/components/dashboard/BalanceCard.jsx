import React from "react";

const rupiah = (n) =>
  (n ?? 0).toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export default function BalanceCardHistory({ balance = 385000 }) {
  return (
    <section>
      <div
        className="rounded-2xl p-4 text-white shadow-lg"
        style={{ background: "linear-gradient(160deg,#103B37 0%, #0D5149 100%)" }}
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-1 text-[11px] font-semibold text-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
            RANGE-PAY
          </span>
          <span className="ml-auto opacity-60">◎</span>
        </div>
        <div className="mt-2 text-[13px] opacity-80">Saldo</div>
        <div className="text-2xl font-bold tracking-tight">{rupiah(balance)}</div>
      </div>
    </section>
  );
}
