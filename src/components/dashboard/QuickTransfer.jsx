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
  const first = (name || "?").charAt(0).toUpperCase();
  return letterColorMap[first] || "bg-gray-200";
};

/**
 * QuickTransfer
 * - Menampilkan daftar penerima unik berdasarkan transaksi paling baru
 * - Mobile: fixed 4 item
 * - Desktop: jumlah sesuai lebar kontainer
 * - Optional: onSelect(name) saat avatar diklik
 */
export default function QuickTransfer({ onSelect }) {
  const { users = [], loading } = useRecentTransfer(); // gunakan mock/API dari hook

  // ====== Konfigurasi tampilan ======
  const GAP_PX = 24;       // gap-6 = 24px
  const ITEM_MIN_PX = 112; // min lebar item

  // ====== Dedupe per nama dan urutkan berdasarkan transaksi terbaru ======
  const uniqueRecent = useMemo(() => {
    // gunakan map: name -> transaksi terbaru
    const latestByName = new Map();
    for (const u of users) {
      const name = (u.name || "").trim();
      const when =
        u.createdAt instanceof Date
          ? u.createdAt.getTime()
          : u.createdAtISO
          ? Date.parse(u.createdAtISO)
          : u.date
          ? Date.parse(u.date)
          : 0; // fallback

      const existing = latestByName.get(name);
      if (!existing || when > existing.when) {
        latestByName.set(name, { name, when });
      }
    }
    // sort desc by when (paling baru duluan)
    return Array.from(latestByName.values())
      .sort((a, b) => b.when - a.when)
      .map((x) => x.name);
  }, [users]);

  // ====== Responsif: hitung berapa item muat di desktop ======
  const gridRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    if (!gridRef.current) return;
    const el = gridRef.current;

    const compute = () => {
      const width = el.clientWidth || 0;
      if (!width) return;
      const raw = (width + GAP_PX) / (ITEM_MIN_PX + GAP_PX);
      const capacity = Math.max(1, Math.floor(raw));
      setVisibleCount(capacity);
    };

    const ro = new ResizeObserver(compute);
    ro.observe(el);
    compute();
    return () => ro.disconnect();
  }, []);

  const ProfileCard = ({ children }) => (
    <div
      className={[
        "rounded-[14px]",
        "bg-white",
        "border border-gray-200",
        "shadow-[0_0_10px_rgba(0,0,0,0.08)]",
        "p-3 flex flex-col items-center justify-center",
        "w-full max-w-[92px] sm:max-w-[110px] md:max-w-none md:w-[120px]",
      ].join(" ")}
    >
      {children}
    </div>
  );

  const AvatarButton = ({ name = "" }) => (
    <button
      type="button"
      onClick={() => onSelect?.(name)}
      className="flex flex-col items-center space-y-3 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-xl"
      aria-label={`Transfer cepat ke ${name}`}
      title={name}
    >
      <div
        className={[
          "rounded-full flex items-center justify-center font-bold text-gray-700",
          "w-12 h-12 text-lg",
          "md:w-16 md:h-16 md:text-2xl",
          "lg:w-20 lg:h-20 lg:text-3xl",
          "transition-transform group-active:scale-95",
          getColorForName(name),
        ].join(" ")}
        style={{ minWidth: 48, minHeight: 48 }}
      >
        {(name || "?").charAt(0).toUpperCase()}
      </div>
      <span className="text-xs sm:text-sm md:text-base text-gray-800 font-medium truncate max-w-[120px]">
        {name || "—"}
      </span>
    </button>
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
        ) : uniqueRecent.length === 0 ? (
          <div className="text-sm text-gray-500 px-3">Belum ada penerima.</div>
        ) : (
          <>
            {/* Mobile: fixed 4 */}
            <div className="block md:hidden">
              <div className="grid grid-cols-4 gap-4 sm:gap-6 overflow-visible justify-items-center">
                {uniqueRecent.slice(0, 4).map((name, i) => (
                  <ProfileCard key={`m-${i}`}>
                    <AvatarButton name={name} />
                  </ProfileCard>
                ))}
              </div>
            </div>

            {/* Desktop: sesuai kapasitas kontainer */}
            <div className="hidden md:block">
              <div
                ref={gridRef}
                className="grid grid-flow-col auto-cols-fr gap-6 justify-items-center overflow-visible"
              >
                {uniqueRecent.slice(0, Math.min(visibleCount, uniqueRecent.length)).map((name, i) => (
                  <ProfileCard key={`d-${i}`}>
                    <AvatarButton name={name} />
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
