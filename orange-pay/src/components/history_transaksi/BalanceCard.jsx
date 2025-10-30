import {
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
  useEffect,
} from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import useCardBalances from "../../hooks/api/useCardBalances"; // gunakan hook yang sama dengan dashboard

/* ====== Komponen kecil (identik) ====== */
const PillBadge = ({ label, active, style }) => (
  <button
    type="button"
    className={`px-2.5 py-1 rounded-full text-[10px] font-bold text-white backdrop-blur-md shadow-sm transition-all duration-300 ${
      active ? "scale-[1.02]" : "opacity-90"
    }`}
    style={{
      background: "rgba(255, 255, 255, 0.29)",
      ...(style || {}),
    }}
  >
    {label}
  </button>
);

const IconToggle = ({ on, onToggle }) => (
  <button onClick={onToggle} className="active:scale-95" style={{ transform: "translateZ(35px)" }}>
    {on ? (
      <EyeSlashIcon className="w-5 h-4 md:w-6 md:h-4 text-white/85" />
    ) : (
      <EyeIcon className="w-5 h-4 md:w-6 md:h-4 text-white/95" />
    )}
  </button>
);

const AmountText = ({ amount, isHidden, onMeasured }) => {
  const formatted = `Rp${amount.toLocaleString("id-ID")}`;
  const stars = "•".repeat(formatted.replace("Rp", "").length);
  const shownRef = useRef(null);
  const hiddenRef = useRef(null);

  useLayoutEffect(() => {
    const measure = () => {
      const shownW = shownRef.current?.offsetWidth ?? 0;
      const hiddenW = hiddenRef.current?.offsetWidth ?? 0;
      const maxWidth = Math.max(shownW, hiddenW);
      const currentWidth = isHidden ? hiddenW : shownW;
      onMeasured?.({ maxWidth, currentWidth });
    };
    const ro = new ResizeObserver(measure);
    if (shownRef.current) ro.observe(shownRef.current);
    if (hiddenRef.current) ro.observe(hiddenRef.current);
    measure();
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [formatted, stars, isHidden, onMeasured]);

  return (
    <div className="relative h-8 md:h-9">
      <span
        ref={shownRef}
        className="absolute left-0 top-0 text-2xl md:text-3xl font-bold font-[Poppins] drop-shadow transition-opacity duration-200"
        style={{ opacity: isHidden ? 0 : 1 }}
      >
        {formatted}
      </span>
      <span
        ref={hiddenRef}
        className="absolute left-0 top-0 text-2xl md:text-3xl font-bold font-[Poppins] drop-shadow transition-opacity duration-200"
        style={{ opacity: isHidden ? 1 : 0 }}
      >
        Rp{stars}
      </span>
      <span className="invisible text-2xl md:text-3xl font-bold font-[Poppins]">{formatted}</span>
    </div>
  );
};

const GradientCardShell = ({ bg, outerGlow, children }) => (
  <div className="p-0" style={{ perspective: 1000 }}>
    <div
      className="rounded-[22px] p-[1px] relative transition-[box-shadow,transform] duration-300 will-change-transform hover:translate-y-[1px]"
      style={{ boxShadow: outerGlow, background: bg }}
    >
      <div
        className="relative text-white rounded-[22px] p-5 md:p-6 overflow-hidden will-change-transform transition-transform duration-200"
        style={{ background: bg, transformStyle: "preserve-3d" }}
      >
        {children}
      </div>
    </div>
  </div>
);

const CardTopBar = ({ title }) => (
  <div className="relative z-10 flex justify-between items-start mb-5 md:mb-10">
    <div className="flex items-center space-x-3 mt-1 mb-2">
      <img src="/orangepay_card.svg" alt="RangePay Logo" className="h-5 md:h-6 w-auto drop-shadow" />
      <PillBadge label={title} active />
    </div>
  </div>
);

const BalanceRow = ({ amount, isHidden, onToggleHidden, loading }) => {
  const [sizes, setSizes] = useState({ maxWidth: 0, currentWidth: 0 });
  if (loading)
    return <div className="h-8 md:h-9 w-28 md:w-32 bg-white/20 rounded animate-pulse" />;
  return (
    <div
      className="relative z-10 mb-2 md:mb-3"
      style={{ width: sizes.maxWidth ? sizes.maxWidth + 28 : undefined }}
    >
      <AmountText amount={amount} isHidden={isHidden} onMeasured={setSizes} />
      <div
        className="absolute top-1/2 -translate-y-1/2 will-change-transform"
        style={{ left: sizes.currentWidth + 6, transform: "translateZ(35px)" }}
      >
        <IconToggle on={isHidden} onToggle={onToggleHidden} />
      </div>
    </div>
  );
};

const glowShadows = (accent) =>
  [`0 10px 28px rgba(0,0,0,0.22)`, `0 0 24px ${accent}55`, `0 0 64px ${accent}33`].join(", ");

/* ====== Komponen utama (terhubung dashboard) ====== */
export default function BalanceCard({ walletId }) {
  const { items = [], loading, error, refetch } = useCardBalances();
  const [isHidden, setIsHidden] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  // cari kartu sesuai walletId dari route
  useEffect(() => {
    if (items.length > 0) {
      const found = items.find((c) => c.id === walletId);
      setSelectedCard(found || items[0]);
    }
  }, [items, walletId]);

  if (!selectedCard)
    return (
      <div className="text-center text-gray-500 py-8">
        Memuat kartu...
      </div>
    );

  const balance = Number(selectedCard.displayBalance ?? selectedCard.balance ?? selectedCard.initialBalance ?? 0);

  return (
    <div className="w-full mx-auto md:px-4 mt-4">
      <GradientCardShell bg={selectedCard.bg} outerGlow={glowShadows(selectedCard.accent)}>
        <div className="relative" style={{ transformStyle: "preserve-3d" }}>
          <CardTopBar title={selectedCard.title} />
          <BalanceRow
            amount={balance}
            isHidden={isHidden}
            onToggleHidden={() => setIsHidden((v) => !v)}
            loading={loading}
          />
        </div>
      </GradientCardShell>

      {error && (
        <p className="text-center text-red-600 text-xs mt-3">
          Gagal memuat saldo.{" "}
          <button className="underline" onClick={refetch}>
            Coba lagi
          </button>
        </p>
      )}
    </div>
  );
}
