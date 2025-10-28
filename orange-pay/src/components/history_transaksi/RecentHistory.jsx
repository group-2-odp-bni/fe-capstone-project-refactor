import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useRecentTransfer from "../../hooks/api/useRecentTransfer";
import MonthChips, { MONTHS } from "../history_transaksi/MonthChips";

// =======================================================
// ⚙️ UTILITAS
// =======================================================
const fmt = (n) => (Number(n) || 0).toLocaleString("id-ID");
const getMonthShort = (d) => MONTHS[d.getMonth()];
const isIncomeType = (type = "") =>
  String(type).toLowerCase().includes("terima") ||
  String(type).toLowerCase().includes("masuk");

const SNAP_THRESHOLD_RATIO = 0.25;

// =======================================================
// ⚛️ KOMPONEN: RECENT HISTORY
// =======================================================
export default function RecentHistory({ walletId, onExpandChange }) {
  const navigate = useNavigate();
  const { users = [], loading } = useRecentTransfer({ walletId });
  const [activeMonth, setActiveMonth] = useState(getMonthShort(new Date()));

  // =======================================================
  // 📏 POSISI SHEET DINAMIS — MELEKAT PADA BUTTON ATAS
  // =======================================================
  const [sheetTop, setSheetTop] = useState(window.innerHeight * 0.45);

  const startY = useRef(0);
  const startTop = useRef(0);

  // Deteksi posisi tombol terdekat di atas (baik arrowButton atau group)
  useEffect(() => {
    const adjustSheetPosition = () => {
      // Coba cari tombol group (+ / user) atau arrowButton
      const buttonGroup =
        document.querySelector(".button-group") ||
        document.querySelector(".arrow-button-container");

      if (buttonGroup) {
        const rect = buttonGroup.getBoundingClientRect();
        const newTop = rect.bottom + 18; // jarak 8px di bawah tombol
        setSheetTop(newTop);
      } else {
        // fallback kalau belum ketemu elemen
        setSheetTop(window.innerHeight * 0.45);
      }
    };

    // Jalankan setelah render
    setTimeout(adjustSheetPosition, 100);

    // Jalankan ulang saat resize supaya tetap responsif
    window.addEventListener("resize", adjustSheetPosition);
    return () => window.removeEventListener("resize", adjustSheetPosition);
  }, []);

  // Lock scroll body saat aktif
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  // =======================================================
  // 🧩 FILTER & NORMALISASI DATA
  // =======================================================
  const filteredUsers = useMemo(() => {
    if (!walletId || !Array.isArray(users)) return users;
    return users.filter((u) => String(u.walletId) === String(walletId));
  }, [users, walletId]);

  const normalized = useMemo(() => {
    if (!filteredUsers || filteredUsers.length === 0) return [];
    return filteredUsers
      .map((u, i) => {
        const d =
          u.createdAt instanceof Date
            ? u.createdAt
            : u.createdAtISO
            ? new Date(u.createdAtISO)
            : u.date
            ? new Date(u.date)
            : new Date();

        return {
          ...u,
          id: u.id ?? `tx-${i}-${d.getTime()}`,
          createdAt: d,
          monthShort: getMonthShort(d),
          dateLabel: new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }).format(d),
          timeLabel: new Intl.DateTimeFormat("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
            .format(d)
            .replace(".", ":"),
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [filteredUsers]);

  const monthItems = useMemo(
    () => normalized.filter((x) => x.monthShort === activeMonth),
    [normalized, activeMonth]
  );

  // =======================================================
  // 🖐️ HANDLER DRAG
  // =======================================================
  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    startTop.current = sheetTop;
  };

  const handleTouchMove = (e) => {
    const delta = e.touches[0].clientY - startY.current;
    const BOTTOM_LIMIT_PX = window.innerHeight * 0.65;
    const newTop = Math.min(
      Math.max(startTop.current + delta, 80), // 80px minimal dari atas
      BOTTOM_LIMIT_PX
    );
    setSheetTop(newTop);
  };

  const handleTouchEnd = () => {
    const isNowExpanded = sheetTop < window.innerHeight * SNAP_THRESHOLD_RATIO;
    const newTop = isNowExpanded ? 80 : sheetTop;
    setSheetTop(newTop);
    onExpandChange?.(isNowExpanded);
  };

  const handleDragLineClick = () => {
    const isCurrentlyExpanded = sheetTop < window.innerHeight * 0.2;
    const newTop = isCurrentlyExpanded ? window.innerHeight * 0.45 : 80;
    setSheetTop(newTop);
    onExpandChange?.(!isCurrentlyExpanded);
  };

  // =======================================================
  // 💸 NAVIGASI KE BUKTI TRANSFER
  // =======================================================
  const handleTransactionClick = (item) => {
    navigate(`/app/wallets/${walletId}/transfer/${item.id}`, {
      state: { transfer: item },
    });
  };

  // =======================================================
  // 💳 ITEM TRANSAKSI
  // =======================================================
  const renderTransactionItem = (item) => {
    const isIncome = isIncomeType(item.type);
    const sign = isIncome ? "+" : "−";
    const amountColor = isIncome ? "text-emerald-500" : "text-red-600";
    const leftSub = isIncome
      ? "Transfer Masuk"
      : String(item.type).toLowerCase() === "kirim"
      ? "Transfer"
      : item.type ?? "-";
    const rightSub = `${item.dateLabel} · ${item.timeLabel}`;

    return (
      <li
        key={item.id}
        onClick={() => handleTransactionClick(item)}
        className="py-2 hover:bg-gray-50/40 transition-colors rounded-lg cursor-pointer active:scale-[0.99]"
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-3 text-left">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {item.name}
            </p>
            <p className="text-xs text-gray-500 truncate">{leftSub}</p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-semibold ${amountColor}`}>
              {sign} Rp{fmt(item.amount)}
            </p>
            <p className="text-[11px] text-gray-500">{rightSub}</p>
          </div>
        </div>
      </li>
    );
  };

  // =======================================================
  // 🧱 RENDER UTAMA
  // =======================================================
  return (
    <section className="relative bg-transparent min-h-screen overflow-hidden">
      <div
        className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl border-t border-gray-200 shadow-xl flex flex-col transition-[top] duration-300 ease-in-out"
        style={{ top: `${sheetTop}px` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Garis drag */}
        <div
          onClick={handleDragLineClick}
          className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 cursor-pointer active:scale-95 transition"
        ></div>

        {/* Isi konten scroll */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="mt-3 mb-2">
            <MonthChips activeMonth={activeMonth} onChange={setActiveMonth} />
          </div>

          <h2 className="text-sm font-medium text-gray-600 mb-2">
            Riwayat Transaksi
          </h2>

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
          ) : monthItems.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-500">
              Belum ada transaksi.
            </div>
          ) : (
            <ul className="mt-2.5 divide-y divide-gray-200">
              {monthItems.map(renderTransactionItem)}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
