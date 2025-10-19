import { useEffect, useMemo, useRef, useState, useLayoutEffect, forwardRef, useImperativeHandle } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

const PillBadge = ({ label, active, style, onClick }) => (
  <button
    type="button"
    onClick={onClick}
  className={`px-2.5 py-1 rounded-full text-[10px] font-bold text-white backdrop-blur-md shadow-sm transition-all duration-300 ${
    active ? "scale-[1.02]" : "opacity-90"
  }`}
  style={{
    background: "rgba(255, 255, 255, 0.29)", // warna abu lembut semi-transparan
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

const HistoryButton = ({ to }) => (
  <Link to={to} className="shrink-0">
    <button className="flex items-center gap-1 bg-[#FFAE51] backdrop-blur-sm border border-white/20 text-white text-[11px] md:text-xs px-3.5 md:px-4 py-[5px] md:py-[6px] pl-5 md:pl-6 rounded-full shadow-sm hover:bg-[#CF7309] transition-all active:scale-[.98]">
      <span>History</span>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
        <path fillRule="evenodd" d="M10.293 15.707a1 1 0 0 1 0-1.414L13.586 11H4a1 1 0 1 1 0-2h9.586l-3.293-3.293a1 1 0 1 1 1.414-1.414l5 5a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414 0z" clipRule="evenodd" />
      </svg>
    </button>
  </Link>
);

const ActionIcon = ({ label, children, to }) => (
  <Link to={to} className="flex flex-col items-center hover:text-white/90 transition-all cursor-pointer active:scale-[.98]">
    <div className="w-6 md:w-7 h-auto mb-[2px]">{children}</div>
    <span className="text-white text-[9.5px] md:text-[10px] leading-3">{label}</span>
  </Link>
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

// --- FIX: measured width so eye icon follows the visible number ---
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
      {/* invisible spacer to keep height */}
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

// =========================================================
//                        MOLECULES
// =========================================================

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
    return (
      <div className="h-8 md:h-9 w-28 md:w-32 bg-white/20 rounded animate-pulse" />
    );
  }

  return (
    <div
      className="relative z-10 mb-2 md:mb-3"
      style={{ width: sizes.maxWidth ? sizes.maxWidth + 28 : undefined }}
    >
      <AmountText amount={amount} isHidden={isHidden} onMeasured={setSizes} />

      {/* Icon follows the currently shown text */}
      <div
        className="absolute top-1/2 -translate-y-1/2 will-change-transform"
        style={{ left: sizes.currentWidth + 6, transform: "translateZ(35px)" }}
      >
        <IconToggle on={isHidden} onToggle={onToggleHidden} />
      </div>
    </div>
  );
};

const CTASection = ({ links }) => (
  <div className="relative z-10 flex justify-between items-center mt-6 md:mt-14" style={{ transform: "translateZ(25px)" }}>
    <HistoryButton to={links.history} />

    <div className="flex space-x-6 md:space-x-8 text-white">
      <ActionIcon to={links.split} label="Split Bill">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className="w-6 md:w-7 h-auto mb-[2px]">
  <path d="M416 32H96a48 48 0 0 0-48 48v368a16 16 0 0 0 25.6 12.8L128 416l54.4 44.8a16 16 0 0 0 20.8 0L256 416l54.4 44.8a16 16 0 0 0 20.8 0L384 416l54.4 44.8A16 16 0 0 0 464 448V80a48 48 0 0 0-48-48ZM160 144h192a16 16 0 0 1 0 32H160a16 16 0 0 1 0-32Zm0 96h192a16 16 0 0 1 0 32H160a16 16 0 0 1 0-32Zm0 96h96a16 16 0 0 1 0 32h-96a16 16 0 0 1 0-32Z"/>
</svg>

      </ActionIcon>

      <ActionIcon to={links.topup} label="Top-Up">
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-6 md:w-7 h-auto mb-[2px]">
          <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2ZM12 8a1 1 0 0 1 1 1v2h2a1 1 0 0 1 0 2h-2v2a1 1 0 0 1-2 0v-2h-2a1 1 0 0 1 0-2h2V9a1 1 0 0 1 1-1Z" />
        </svg>
      </ActionIcon>

      <ActionIcon to={links.transfer} label="Transfer">
        <svg width="20" height="23" viewBox="0 0 20 23" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-5 h-auto mb-[2px]">
          <path d="M19.6877 0.359167C19.5416 0.191978 19.3564 0.0766741 19.1545 0.0271745C18.9525 -0.0223251 18.7423 -0.00392698 18.5492 0.0801298L0.690399 7.81817H0.686828C0.480918 7.90885 0.304472 8.0701 0.181598 8.27983C0.058724 8.48961 -0.0046263 8.73764 0.000263153 8.9902C0.00515261 9.24266 0.0780267 9.48729 0.208852 9.69059C0.339761 9.8939 0.522244 10.046 0.73147 10.1262L0.749753 10.1328L6.87934 13.1292C6.9989 13.1707 7.1259 13.1757 7.24767 13.1434C7.36935 13.1113 7.4816 13.0431 7.57309 12.9457L17.4108 2.45197C17.4402 2.41844 17.4749 2.39181 17.5132 2.37366C17.5515 2.35546 17.5926 2.34611 17.634 2.34611C17.6755 2.34611 17.7165 2.35546 17.7548 2.37366C17.7931 2.39181 17.828 2.41844 17.8573 2.45197C17.8866 2.48556 17.9098 2.52537 17.9257 2.56922C17.9415 2.61308 17.9497 2.66005 17.9497 2.7075C17.9497 2.75496 17.9415 2.80197 17.9257 2.84583C17.9098 2.88963 17.8866 2.9295 17.8573 2.96303L8.6901 14.2198C8.60506 14.3246 8.5455 14.4531 8.5174 14.5925C8.48925 14.7318 8.49354 14.8772 8.52981 15.014L11.1482 22.0351C11.2995 22.538 11.6611 22.8722 12.0982 22.8947H12.1429C12.3635 22.8961 12.5794 22.8216 12.7625 22.6807C12.9457 22.5397 13.0875 22.339 13.1696 22.1046L19.9283 1.66597C20.0027 1.4448 20.0197 1.20368 19.977 0.971755C19.9342 0.739881 19.8338 0.527086 19.6877 0.359167Z" />
        </svg>
      </ActionIcon>
    </div>
  </div>
);

const glowShadows = (accent) => [
  "0 10px 28px rgba(0,0,0,0.22)",
  `0 0 24px ${accent}55`,
  `0 0 64px ${accent}33`,
].join(", ");

const BalanceCardOrganism = ({ card, active, amount, loading, isHidden, onToggleHidden, onMouseMove, onMouseLeave, onBadgeClick }) => (
  <GradientCardShell bg={card.bg} outerGlow={glowShadows(card.accent)}>
    <div
      className="relative"
      style={{ transformStyle: "preserve-3d" }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <CardTopBar title={card.title} isMain={card.id === "main"} onBadgeClick={onBadgeClick} />
      <BalanceRow amount={amount} isHidden={isHidden} onToggleHidden={onToggleHidden} loading={loading} active={active} />
      <CTASection links={card.links} />
    </div>
  </GradientCardShell>
);

// Carousel viewport with drag + snap + index calc + imperative scrollToIndex
const CarouselViewport = forwardRef(function CarouselViewport(
  { items, renderItem, activeIndex, setActiveIndex },
  ref
) {
  const viewportRef = useRef(null);
  const isDraggingRef = useRef(false);
  const draggingActiveRef = useRef(false);
  const dragStartXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const rafRef = useRef(0);
  const DRAG_ACTIVATE_PX = 8;

  const isInteractiveTarget = (el) => !!(el && el.closest && el.closest("button, a, [role='button'], input, textarea, select, label"));

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

  const onPointerDown = (e) => {
    const el = viewportRef.current;
    if (!el) return;
    if (isInteractiveTarget(e.target)) return;
    isDraggingRef.current = true;
    draggingActiveRef.current = false;
    dragStartXRef.current = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    startScrollLeftRef.current = el.scrollLeft;
  };

  const onPointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const el = viewportRef.current;
    if (!el) return;
    const currentX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const delta = currentX - dragStartXRef.current;

    if (!draggingActiveRef.current) {
      if (Math.abs(delta) < DRAG_ACTIVATE_PX) return;
      if (isInteractiveTarget(e.target)) return;
      draggingActiveRef.current = true;
      if (el.setPointerCapture) {
        try { el.setPointerCapture(e.pointerId); } catch {}
      }
      el.style.cursor = "grabbing";
    }

    el.scrollLeft = startScrollLeftRef.current - delta;
  };

  const onPointerUp = (e) => {
    const el = viewportRef.current;
    if (!el) return;

    if (el.releasePointerCapture) {
      try { el.releasePointerCapture(e.pointerId); } catch {}
    }
    el.style.cursor = "";

    if (!draggingActiveRef.current) {
      isDraggingRef.current = false;
      return;
    }

    const cardWidth = el.clientWidth || 1;
    const idx = Math.round(el.scrollLeft / cardWidth);
    scrollToIndex(idx);

    isDraggingRef.current = false;
    draggingActiveRef.current = false;
    if (e.cancelable) e.preventDefault();
  };

  const scrollToIndex = (i) => {
    const el = viewportRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(items.length - 1, i));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  };

  useImperativeHandle(ref, () => ({
    scrollToIndex,
    get index() {
      return activeIndex;
    }
  }), [activeIndex]);

  return (
    <div
      ref={viewportRef}
      className="relative overflow-x-auto overflow-y-visible snap-x snap-mandatory scroll-smooth rounded-2xl select-none [-webkit-overflow-scrolling:touch]"
      style={{ scrollbarWidth: "none", touchAction: "pan-y" }}
      onScroll={onScroll}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
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

// =========================================================
//                        TEMPLATE / PAGE
// =========================================================

export default function AtomicBalanceCard() {
  // ------- DATA -------
  const cards = useMemo(
    () => [
      {
        id: "utama",
        title: "Utama",
        initialBalance: 385000,
        bg: "linear-gradient(101.06deg, #2F5755 23.71%, #1A3A38 60.76%, #041D1C 97.82%)",
        accent: "#2F5755",
        links: {
          history: "/app/transactions",
          split: "/app/main/split-bill",
          topup: "/app/main/top-up",
          transfer: "/app/main/transfer",
        },
      },
      {
        id: "family",
        title: "Family",
        initialBalance: 120000,
        bg: "linear-gradient(101.06deg, #8B138D 23.71%, #591467 50.68%, #25062B 97.82%)",
        accent: "#8B138D",
        links: {
          history: "/app/transactions",
          split: "/app/family/split-bill",
          topup: "/app/family/top-up",
          transfer: "/app/family/transfer",
        },
      },
      {
        id: "shared",
        title: "Shared",
        initialBalance: 765000,
        bg: "linear-gradient(101.06deg, #135B82 23.71%, #0F435F 60.76%, #0F2835 97.82%)",
        accent: "#135B82",
        links: {
          history: "/app/transactions",
          split: "/app/personal/split-bill",
          topup: "/app/personal/top-up",
          transfer: "/app/personal/transfer",
        },
      },
    ],
    []
  );

  // ------- STATE -------
  const [activeIndex, setActiveIndex] = useState(0);
  const [balance, setBalance] = useState(cards[0].initialBalance);
  const [loading, setLoading] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // Simulate load on tab change
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      setBalance(cards[activeIndex].initialBalance);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [activeIndex, cards]);

  // 3D tilt (desktop only)
  const tiltRefs = useRef({});
  const rafTilt = useRef(0);
  const handle3DTilt = (i, e) => {
    if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(pointer: coarse)").matches) return;
    const cardEl = tiltRefs.current[i];
    if (!cardEl) return;
    const rect = cardEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    const rotX = Math.max(-8, Math.min(8, -dy * 8));
    const rotY = Math.max(-8, Math.min(8, dx * 8));

    cancelAnimationFrame(rafTilt.current);
    rafTilt.current = requestAnimationFrame(() => {
      cardEl.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    });
  };
  const reset3DTilt = (i) => {
    const cardEl = tiltRefs.current[i];
    if (!cardEl) return;
    cardEl.style.transform = "rotateX(0deg) rotateY(0deg)";
  };

  // Imperative handle to control viewport scroll from tabs/dots
  const viewportRef = useRef(null);
  const goTo = (i) => {
    setActiveIndex(i); // optimistic UI
    viewportRef.current?.scrollToIndex?.(i); // smooth scroll
  };

  return (
    <div className="w-full mx-auto md:px-4">
      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
        {cards.map((c, i) => (
          <SegmentedTab key={c.id} title={c.title} accent={c.accent} active={i === activeIndex} onClick={() => goTo(i)} />
        ))}
      </div>

      {/* Viewport */}
      <CarouselViewport
        ref={viewportRef}
        items={cards}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        renderItem={(card, i) => (
          <div className="p-0" style={{ width: "100%" }}>
            <div ref={(el) => (tiltRefs.current[i] = el)}>
              <BalanceCardOrganism
                card={card}
                active={i === activeIndex}
                amount={i === activeIndex ? balance : card.initialBalance}
                loading={loading && i === activeIndex}
                isHidden={isHidden}
                onToggleHidden={() => setIsHidden((v) => !v)}
                onMouseMove={(e) => handle3DTilt(i, e)}
                onMouseLeave={() => reset3DTilt(i)}
                onBadgeClick={() => goTo(i)}
              />
            </div>
          </div>
        )}
      />

      {/* Dots */}
      <div className="flex justify-center items-center gap-2 mt-4">
        {cards.map((c, i) => (
          <Dot key={c.id} active={i === activeIndex} accent={c.accent} onClick={() => goTo(i)} />
        ))}
      </div>

      <style>{`
        /* hide webkit scrollbar */
        div::-webkit-scrollbar { height: 0; width: 0; }

        /* outer glow heavier on larger screens */
        @media (min-width: 768px) {
          .card-outer-glow { filter: drop-shadow(0 24px 60px rgba(0,0,0,0.12)); }
        }
      `}</style>
    </div>
  );
}
