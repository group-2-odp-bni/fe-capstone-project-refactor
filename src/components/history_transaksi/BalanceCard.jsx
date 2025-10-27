import { useEffect, useMemo, useRef, useState, useLayoutEffect, forwardRef, useImperativeHandle } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import useCardBalances from "../../hooks/api/useInitialBalances";

/* ====== komponen kecil (tidak berubah) ====== */
const PillBadge = ({ label, active, style, onClick }) => (
  <button
    type="button"
    onClick={onClick}
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

const Dot = ({ active, accent, onClick }) => (
  <button
    onClick={onClick}
    aria-label="Go to slide"
    className="transition-all duration-300 outline-none focus:ring-0"
    style={{
      width: active ? 56 : 10,
      height: 10,
      borderRadius: 9999,
      background: active ? accent : "#D1D5DB",
      boxShadow: active ? `0 4px 12px ${accent}55` : "0 0 0 2px rgba(255,255,255,0.6)",
    }}
  />
);

const SegmentedTab = ({ title, active, onClick, accent }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-full text-[11px] md:text-xs transition-all border backdrop-blur-sm ${
      active ? "text-black/90 bg-white border-black/10 shadow-sm" : "text-black/70 bg-white/60 border-black/10 hover:bg-white"
    }`}
    style={{ boxShadow: active ? "0 6px 18px rgba(0,0,0,0.06)" : undefined }}
  >
    <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: accent }} />
    {title}
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
      <div className="relative text-white rounded-[22px] p-5 md:p-6 overflow-hidden will-change-transform transition-transform duration-200" style={{ background: bg, transformStyle: "preserve-3d" }}>
        {children}
      </div>
    </div>
  </div>
);

const CardTopBar = ({ title, isMain, onBadgeClick }) => (
  <div className="relative z-10 flex justify-between items-start mb-5 md:mb-10">
    <div className="flex items-center space-x-3 mt-1 mb-2">
      <img src="/orangepay_card.svg" alt="RangePay Logo" className="h-5 md:h-6 w-auto drop-shadow" />
      <PillBadge label={title} active={isMain} style={{ transform: "translateZ(35px)" }} onClick={onBadgeClick} />
    </div>
  </div>
);

const BalanceRow = ({ amount, isHidden, onToggleHidden, loading, active }) => {
  const [sizes, setSizes] = useState({ maxWidth: 0, currentWidth: 0 });

  if (loading && active) {
    return <div className="h-8 md:h-9 w-28 md:w-32 bg-white/20 rounded animate-pulse" />;
  }

  return (
    <div className="relative z-10 mb-2 md:mb-3" style={{ width: sizes.maxWidth ? sizes.maxWidth + 28 : undefined }}>
      <AmountText amount={amount} isHidden={isHidden} onMeasured={setSizes} />
      <div className="absolute top-1/2 -translate-y-1/2 will-change-transform" style={{ left: sizes.currentWidth + 6, transform: "translateZ(35px)" }}>
        <IconToggle on={isHidden} onToggle={onToggleHidden} />
      </div>
    </div>
  );
};

const glowShadows = (accent) =>
  ["0 10px 28px rgba(0,0,0,0.22)", `0 0 24px ${accent}55`, `0 0 64px ${accent}33`].join(", ");

const BalanceCardOrganism = ({ card, active, amount, loading, isHidden, onToggleHidden, onMouseMove, onMouseLeave, onBadgeClick }) => (
  <GradientCardShell bg={card.bg} outerGlow={glowShadows(card.accent)}>
    <div className="relative" style={{ transformStyle: "preserve-3d" }} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
      <CardTopBar title={card.title} isMain={card.id === "utama"} onBadgeClick={onBadgeClick} />
      <BalanceRow amount={amount} isHidden={isHidden} onToggleHidden={onToggleHidden} loading={loading} active={active} />
    </div>
  </GradientCardShell>
);

/* ====== VERSI TERHUBUNG API ====== */
const CarouselViewport = forwardRef(function CarouselViewport({ items, renderItem, activeIndex, setActiveIndex }, ref) {
  const viewportRef = useRef(null);
  const rafRef = useRef(0);

  const updateActiveIndexFromScroll = () => {
    const el = viewportRef.current;
    if (!el) return;
    const cardWidth = el.clientWidth || 1;
    const idx = Math.round(el.scrollLeft / cardWidth);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    if (clamped !== activeIndex) setActiveIndex(clamped);
  };

  const onScroll = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateActiveIndexFromScroll);
  };

  const scrollToIndex = (i) => {
    const el = viewportRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(items.length - 1, i));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  };

  useImperativeHandle(ref, () => ({ scrollToIndex }), []);

  return (
    <div ref={viewportRef} className="relative overflow-x-auto overflow-y-visible snap-x snap-mandatory scroll-smooth rounded-2xl" style={{ scrollbarWidth: "none", touchAction: "pan-y" }} onScroll={onScroll}>
      <div className="flex" style={{ width: "100%" }}>
        {items.map((item, i) => (
          <div key={item.id} className="snap-center shrink-0 p-0" style={{ width: "100%" }}>
            {renderItem(item, i, { scrollToIndex })}
          </div>
        ))}
      </div>
    </div>
  );
});

export default function AtomicBalanceCard() {
  // meta kartu (statis)
  const cards = useMemo(
    () => [
      { id: "utama", title: "Utama", bg: "linear-gradient(101.06deg, #2F5755 23.71%, #1A3A38 60.76%, #041D1C 97.82%)", accent: "#2F5755" },
      { id: "family", title: "Family", bg: "linear-gradient(101.06deg, #8B138D 23.71%, #591467 50.68%, #25062B 97.82%)", accent: "#8B138D" },
      { id: "shared", title: "Shared", bg: "linear-gradient(101.06deg, #135B82 23.71%, #0F435F 60.76%, #0F2835 97.82%)", accent: "#135B82" },
    ],
    []
  );

  // ambil saldo dari API
  const { data, loading: apiLoading, error, refetch } = useCardBalances();

  // buat map id -> balance untuk lookup cepat
  const balancesMap = useMemo(() => {
    if (!Array.isArray(data)) return {};
    return data.reduce((acc, { id, balance }) => {
      acc[id] = Number(balance) || 0;
      return acc;
    }, {});
  }, [data]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [balance, setBalance] = useState(0);
  const [isHidden, setIsHidden] = useState(false);

  // update angka balance ketika index aktif / data API berubah
  useEffect(() => {
    const currentId = cards[activeIndex]?.id;
    const next = currentId ? balancesMap[currentId] ?? 0 : 0;
    setBalance(next);
  }, [activeIndex, balancesMap, cards]);

  const viewportRef = useRef(null);
  const goTo = (i) => {
    setActiveIndex(i);
    viewportRef.current?.scrollToIndex?.(i);
  };

  const isCardLoading = (cardId, i) => {
    // loading jika API masih fetch atau saldo untuk card ini belum tersedia
    const missingBalance = typeof balancesMap[cardId] !== "number";
    return apiLoading || (missingBalance && i === activeIndex);
  };

  return (
    <div className="w-full mx-auto md:px-4">
      {/* tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
        {cards.map((c, i) => (
          <SegmentedTab key={c.id} title={c.title} accent={c.accent} active={i === activeIndex} onClick={() => goTo(i)} />
        ))}
      </div>

      {/* viewport */}
      <CarouselViewport
        ref={viewportRef}
        items={cards}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        renderItem={(card, i) => {
          const amount = i === activeIndex ? balance : balancesMap[card.id] ?? 0;
          return (
            <div className="p-0" style={{ width: "100%" }}>
              <BalanceCardOrganism
                card={card}
                active={i === activeIndex}
                amount={amount}
                loading={isCardLoading(card.id, i)}
                isHidden={isHidden}
                onToggleHidden={() => setIsHidden((v) => !v)}
              />
            </div>
          );
        }}
      />

      {/* dots */}
      <div className="flex justify-center items-center gap-2 mt-4">
        {cards.map((c, i) => (
          <Dot key={c.id} active={i === activeIndex} accent={c.accent} onClick={() => goTo(i)} />
        ))}
      </div>

      {/* error minimal */}
      {error && (
        <p className="text-center text-red-600 text-xs mt-3">
          Gagal memuat saldo. <button className="underline" onClick={refetch}>Coba lagi</button>
        </p>
      )}

      <style>{`
        div::-webkit-scrollbar { height: 0; width: 0; }
        @media (min-width: 768px) {
          .card-outer-glow { filter: drop-shadow(0 24px 60px rgba(0,0,0,0.12)); }
        }
      `}</style>
    </div>
  );
}
