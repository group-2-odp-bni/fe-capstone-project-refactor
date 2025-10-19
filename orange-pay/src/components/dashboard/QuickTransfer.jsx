import { useEffect, useMemo, useRef, useState } from "react";
import useRecentTransfer from "../../hooks/api/useRecentTransfer";

const letterColorMap = {
  A: "bg-red-200",  B: "bg-orange-200", C: "bg-amber-200", D: "bg-yellow-200",
  E: "bg-lime-200", F: "bg-green-200",  G: "bg-emerald-200", H: "bg-teal-200",
  I: "bg-cyan-200", J: "bg-sky-200",    K: "bg-blue-200",    L: "bg-indigo-200",
  M: "bg-violet-200",N: "bg-purple-200",O: "bg-fuchsia-200", P: "bg-pink-200",
  Q: "bg-rose-200",  R: "bg-red-300",    S: "bg-orange-300",  T: "bg-amber-300",
  U: "bg-yellow-300",V: "bg-lime-300",   W: "bg-green-300",   X: "bg-emerald-300",
  Y: "bg-teal-300",  Z: "bg-cyan-300",
};

const getColorForName = (name = "") => {
  const first = name.charAt(0).toUpperCase();
  return letterColorMap[first] || "bg-gray-200";
};

export default function QuickTransfer() {
  const { users = [], loading } = useRecentTransfer();

  // ====== Konfigurasi ukuran minimum item & gap (sesuaikan kalau perlu) ======
  // gap-6 = 24px (1.5rem default tailwind)
  const GAP_PX = 24;
  // lebar minimum 1 item (avatar + label): kira2 96–112 px aman. Sesuaikan kalau avatar dibesarkan.
  const ITEM_MIN_PX = 112;

  // Ref ke kontainer grid desktop
  const gridRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(6); // default aman

const ProfileCard = ({ children }) => (
  <div
    className={[
      "rounded-[14px]",                  // border-radius: 21px
      "bg-white/25",                    // transparan putih 25%
      "border border-gray-200",         // border abu muda
      "shadow-[0_0_10px_rgba(0,0,0,0.08)]", // shadow di semua sisi
      "p-3 flex flex-col items-center justify-center",
      "w-full max-w-[92px] sm:max-w-[110px] md:max-w-none md:w-[120px]", // responsif
    ].join(" ")}
  >
    {children}
  </div>
);



  // Hitung kapasitas maksimal berdasarkan lebar kontainer
  useEffect(() => {
    if (!gridRef.current) return;

    const el = gridRef.current;

    const compute = () => {
      const width = el.clientWidth || 0;
      if (!width) return;

      // Rumus kapasitas: banyak kolom yang muat dengan min width dan gap
      // Total width ≈ n*ITEM_MIN_PX + (n-1)*GAP_PX  <= width
      // => n <= (width + GAP_PX) / (ITEM_MIN_PX + GAP_PX)
      const raw = (width + GAP_PX) / (ITEM_MIN_PX + GAP_PX);
      const capacity = Math.max(1, Math.floor(raw));
      setVisibleCount(capacity);
    };

    // ResizeObserver supaya responsif saat resize
    const ro = new ResizeObserver(() => compute());
    ro.observe(el);
    // hitung awal
    compute();

    return () => ro.disconnect();
  }, [GAP_PX, ITEM_MIN_PX]);

  // Data yang ditampilkan:
  // - Mobile (sm-): tetap 4 (atau ubah sesuai keinginan)
  // - Desktop (md+): sebanyak kapasitas yang muat
  const mobileSlice = 4;
  const desktopSlice = useMemo(() => {
    // batasi sesuai kapasitas tapi jangan melebihi jumlah data nyata
    return Math.min(visibleCount, users.length || 0);
  }, [visibleCount, users.length]);

const Avatar = ({ name = "" }) => (
  <div className="flex flex-col items-center space-y-3">
    <div
      className={[
        "rounded-full flex items-center justify-center font-bold text-gray-700",
        // 🔽 base lebih kecil, naik di md & lg
        "w-12 h-12 text-lg",
        "md:w-16 md:h-16 md:text-2xl",
        "lg:w-20 lg:h-20 lg:text-3xl",
        getColorForName(name),
      ].join(" ")}
      style={{ minWidth: 48, minHeight: 48 }}
    >
      {(name || "?").charAt(0).toUpperCase()}
    </div>
    <span className="text-xs sm:text-sm md:text-base text-gray-800 font-medium truncate max-w-[120px]">
      {name || "—"}
    </span>
  </div>
);

  return (
    <div className="mt-6">
      <h3 className="px-3 font-semibold text-lg text-gray-900 mb-3 text-left">
        Quick Transfer
      </h3>

      <div className="mb-8">
        {loading ? (
          <div className="grid grid-cols-4 md:grid-cols-6 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center space-y-2">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-200 animate-pulse rounded-full" />
                <div className="w-12 h-3 md:w-14 bg-gray-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
<div className="block md:hidden">
  <div className="grid grid-cols-4 gap-4 sm:gap-6 overflow-visible justify-items-center">
    {users.slice(0, 4).map((u, i) => (
      <ProfileCard key={`m-${i}`}>
        <Avatar name={u.name} />
      </ProfileCard>
    ))}
  </div>
</div>

<div className="hidden md:block">
  <div
    ref={gridRef}
    className="grid grid-flow-col auto-cols-fr gap-6 justify-items-center overflow-visible"
  >
    {users.slice(0, visibleCount).map((u, i) => (
      <ProfileCard key={`d-${i}`}>
        <Avatar name={u.name} />
      </ProfileCard>
    ))}
  </div>
</div>

          </>
        )}
      </div>
    </div>
  );
}
