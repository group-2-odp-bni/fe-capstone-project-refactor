import { useEffect, useMemo, useRef } from "react";

/** ==== Bulan (Jan -> bulan sekarang) pakai timezone Asia/Jakarta ==== */
const ALL_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Ambil "sekarang" versi Jakarta
const nowJakarta = () => new Date(
  new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
);
// Index bulan 0..11 versi Jakarta
const CURRENT_IDX_JKT = nowJakarta().getMonth();

// Export agar bisa dipakai komponen lain (Jan..bulan-ini)
export const MONTHS = ALL_MONTHS.slice(0, CURRENT_IDX_JKT + 1);

export default function MonthChips({ activeMonth, onChange }) {
  const refs = useRef([]);

  // auto-scroll ke bulan aktif (mobile)
  useEffect(() => {
    const idx = MONTHS.indexOf(activeMonth);
    const el = refs.current[idx];
    if (el) el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeMonth]);

  // Track class (kapsul putih)
  const trackCls =
    "mx-auto flex items-center justify-start md:justify-center " +
    "overflow-x-auto md:overflow-visible scrollbar-hide " +
    "rounded-full bg-white border border-gray-200 " +
    "px-[6px] py-1 md:px-3 md:py-1.5 lg:px-4 lg:py-2 " +
    "gap-2 md:gap-3 lg:gap-3.5" ;

  return (
    <div className="relative w-full">
      {/* gradient fade kiri/kanan (mobile only) */}
      {/* <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent rounded-l-2xl md:hidden" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent rounded-r-2xl md:hidden" /> */}

      <div className={trackCls}>
        {MONTHS.map((m, idx) => {
          const isActive = activeMonth === m;
          const isFirst = idx === 0;
          const isLast = idx === MONTHS.length - 1;

          // Saat chip aktif, kalau dia di ujung kiri/kanan, sedikit ditarik agar terasa "mepet" border
          const edgeNudge =
            isActive && isFirst ? "ml-[-2px]" :
            isActive && isLast  ? "mr-[-2px]" : "";

        return (
          <button
            key={m}
            ref={(el) => (refs.current[idx] = el)}
            onClick={() => onChange?.(m)}
            className={[
              "whitespace-nowrap rounded-full font-semibold transition-all duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70",
              // ukuran responsif
              "h-9 px-4 text-[15px] md:h-10 md:px-5 md:text-base lg:h-11 lg:px-6 lg:text-[17px]",
              // warna default/hover/active-press
              isActive
                ? "bg-[#FFA627] text-white shadow-[0_2px_0_rgba(0,0,0,0.06),0_4px_10px_rgba(255,166,39,0.35)] ring-1 ring-white/70 active:bg-[#FEA731]"
                : "bg-transparent text-gray-900 hover:bg-gray-50 active:bg-gray-100",
              // efek tekan ringan
              "active:translate-y-[1px]",
              edgeNudge,
            ].join(" ")}
            aria-current={isActive ? "true" : "false"}
          >
            {m}
          </button>
        );
        })}
        {/* spacer tipis agar scroll kanan habis pas */}
        <div className="shrink-0 w-[2px]" />
      </div>
    </div>
  );
}
