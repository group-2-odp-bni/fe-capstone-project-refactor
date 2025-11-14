// src/components/ui/BalanceCardUI.jsx
import React, {
  forwardRef,
  useRef,
  useLayoutEffect,
  useState,
  useImperativeHandle,
} from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

/* ========== ATOMS ========== */

export const PillBadge = ({ label, active, style, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2.5 py-1 rounded-full text-[10px] font-bold text-white backdrop-blur-md shadow-sm transition-all duration-500 ${
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

export const IconToggle = ({ on, onToggle }) => (
  <button
    onClick={onToggle}
    className="active:scale-95"
    style={{ transform: "translateZ(35px)" }}
  >
    {on ? (
      <EyeSlashIcon className="w-5 h-4 md:w-6 md:h-4 text-white/85" />
    ) : (
      <EyeIcon className="w-5 h-4 md:w-6 md:h-4 text-white/95" />
    )}
  </button>
);

/**
 * ActionIcon
 * - Looks active even when `disabled` so taps still trigger page toast via guards.
 * - Uses currentColor for SVG so it inherits text color.
 */
export const ActionIcon = ({
  label,
  children,
  to,
  onClick,
  asButton = false,
  disabled = false,
  title,
}) => {
  const commonBase = "flex flex-col items-center transition-all cursor-pointer";
  const stateClass = disabled ? "opacity-90" : "hover:text-white/90 active:scale-[.98]";
  const commonClass = `${commonBase} ${stateClass}`;

  if (asButton || onClick) {
    return (
      <button
        // NOTE: do NOT set `disabled` attribute, we still want click to fire the guard.
        type="button"
        aria-disabled={disabled}
        onClick={onClick}
        className={commonClass}
        style={{ background: "transparent", border: 0 }}
        title={title}
      >
        <div className="w-7 md:w-7 h-auto mb-[2px]">{children}</div>
        <span className="text-white text-[9.5px] md:text-[10px] leading-3">
          {label}
        </span>
      </button>
    );
  }

  // Anchor fallback (we still prefer passing onClick from parent)
  return (
    <a
      href={to || "#"}
      className={commonClass}
      onClick={(e) => {
        if (!to) e.preventDefault();
        onClick?.(e);
      }}
      aria-disabled={disabled}
      title={title}
    >
      <div className="w-7 md:w-7 h-auto mb-[2px]">{children}</div>
      <span className="text-white text-[9.5px] md:text-[10px] leading-3">
        {label}
      </span>
    </a>
  );
};

/* ========== AmountText (measuring for eye icon) ========== */

export const AmountText = ({ amount, isHidden, onMeasured }) => {
  const formatted = `Rp${Number(amount ?? 0).toLocaleString("id-ID")}`;
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
        className="absolute left-0 top-0 text-2xl md:text-3xl font-bold font-[Poppins] drop-shadow transition-opacity duration-500"
        style={{ opacity: isHidden ? 0 : 1 }}
      >
        {formatted}
      </span>
      <span
        ref={hiddenRef}
        className="absolute left-0 top-0 text-2xl md:text-3xl font-bold font-[Poppins] drop-shadow transition-opacity duration-500"
        style={{ opacity: isHidden ? 1 : 0 }}
      >
        Rp{stars}
      </span>
      <span className="invisible text-2xl md:text-3xl font-bold font-[Poppins]">
        {formatted}
      </span>
    </div>
  );
};

/* ========== Shell / card frame (now clickable) ========== */

export const GradientCardShell = ({
  bg,
  outerGlow,
  children,
  className = "",
  onClick,
  onKeyDown,
  role,
  tabIndex,
  ...rest
}) => {
  const isInteractive = Boolean(onClick);
  const interactiveProps = isInteractive
    ? {
        role: role || "button",
        tabIndex: tabIndex ?? 0,
        onClick,
        onKeyDown,
        className:
          "relative text-white rounded-[22px] p-5 md:p-6 overflow-hidden will-change-transform transition-transform duration-500 focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer " +
          className,
      }
    : {
        className:
          "relative text-white rounded-[22px] p-5 md:p-6 overflow-hidden will-change-transform transition-transform duration-500 " +
          className,
      };

  return (
    <div className="p-0" style={{ perspective: 1000 }}>
      <div
        className="rounded-[22px] p-[1px] relative transition-[box-shadow,transform] duration-500 will-change-transform hover:translate-y-[1px]"
        style={{ boxShadow: outerGlow, background: bg }}
      >
        <div
          {...interactiveProps}
          style={{ background: bg, transformStyle: "preserve-3d" }}
          {...rest}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

/* ========== MOLECULES ========== */

export const CardTopBar = ({ title, type, isMain, onBadgeClick }) => (
  <div className="relative z-10 flex justify-between items-start mb-5 md:mb-10">
    <div className="flex items-center space-x-3 mt-1 mb-2">
      <img
        src="/orangepay_card.svg"
        alt="RangePay Logo"
        className="h-5 md:h-6 w-auto drop-shadow"
      />
      <PillBadge
        label={type}
        active={isMain}
        style={{ transform: "translateZ(35px)" }}
        onClick={onBadgeClick}
      />
    </div>
  </div>
);

/* ========== CTASection (calls page-level onBlocked when disabled) ========== */
export const CTASection = ({
  links = {},
  walletId,
  type = "PERSONAL",
  defaultForUser = true,
  isDraggingRef,
  disabled = false,
  onBlocked = () => {}, // safe default
}) => {
  const navigate = useNavigate();

  const guarded = (navFn) => (e) => {
    if (isDraggingRef && isDraggingRef.current) return;
    if (disabled) {
      e?.preventDefault?.();
      onBlocked();
      return;
    }
    navFn();
  };

  const handleTransferClick = guarded(() =>
    navigate(links.transfer || "/app/transfer")
  );
  const handleSplitBillClick = guarded(() => navigate("/app/splitbill"));
  const handleTopupClick = guarded(() => navigate(links.topup || "/app/topup"));

  const renderActionsForUtama = () => (
    <>
      <ActionIcon
        to={links.split}
        onClick={handleSplitBillClick}
        asButton
        label="Split Bill"
        disabled={disabled}
        title={disabled ? "Lengkapi profil untuk melanjutkan" : undefined}
      >
        <svg
          viewBox="0 0 512 512"
          fill="currentColor"
          className="w-7 md:w-7 h-auto mb-[2px]"
        >
          <path d="M416 32H96a48 48 0 0 0-48 48v368a16 16 0 0 0 25.6 12.8L128 416l54.4 44.8a16 16 0 0 0 20.8 0L256 416l54.4 44.8a16 16 0 0 0 20.8 0L384 416l54.4 44.8A16 16 0 0 0 464 448V80a48 48 0 0 0-48-48ZM160 144h192a16 16 0 0 1 0 32H160a16 16 0 0 1 0-32Zm0 96h192a16 16 0 0 1 0 32H160a16 16 0 0 1 0-32Zm0 96h96a16 16 0 0 1 0 32h-96a16 16 0 0 1 0-32Z" />
        </svg>
      </ActionIcon>

      <ActionIcon
        to={links.topup}
        onClick={handleTopupClick}
        label="Top-Up"
        disabled={disabled}
        title={disabled ? "Lengkapi profil untuk melanjutkan" : undefined}
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-7 md:w-7 h-auto mb-[2px]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2ZM12 8a1 1 0 0 1 1 1v2h2a1 1 0 0 1 0 2h-2v2a1 1 0 0 1-2 0v-2h-2a1 1 0 0 1 0-2h2V9a1 1 0 0 1 1-1Z" />
        </svg>
      </ActionIcon>
    </>
  );

  return (
    <div
      className="relative z-10 flex justify-end items-center mt-6 md:mt-2"
      style={{ transform: "translateZ(25px)" }}
    >
      <div className="flex space-x-6 md:space-x-8 text-white">
        {renderActionsForUtama()}

        {/* Transfer: always shown, uses button to attach walletId and respect dragging */}
        <ActionIcon onClick={handleTransferClick} asButton label="Transfer">
          <svg
            viewBox="0 0 20 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 md:w-6 h-auto mb-[2px]"
          >
            <path d="M19.6877 0.359167C19.5416 0.191978 19.3564 0.0766741 19.1545 0.0271745C18.9525 -0.0223251 18.7423 -0.00392698 18.5492 0.0801298L0.690399 7.81817H0.686828C0.480918 7.90885 0.304472 8.0701 0.181598 8.27983C0.058724 8.48961 -0.0046263 8.73764 0.000263153 8.9902C0.00515261 9.24266 0.0780267 9.48729 0.208852 9.69059C0.339761 9.8939 0.522244 10.046 0.73147 10.1262L0.749753 10.1328L6.87934 13.1292C6.9989 13.1707 7.1259 13.1757 7.24767 13.1434C7.36935 13.1113 7.4816 13.0431 7.57309 12.9457L17.4108 2.45197C17.4402 2.41844 17.4749 2.39181 17.5132 2.37366C17.5515 2.35546 17.5926 2.34611 17.634 2.34611C17.6755 2.34611 17.7165 2.35546 17.7548 2.37366C17.7931 2.39181 17.828 2.41844 17.8573 2.45197C17.8866 2.48556 17.9098 2.52537 17.9257 2.56922C17.9415 2.61308 17.9497 2.66005 17.9497 2.7075C17.9497 2.75496 17.9415 2.80197 17.9257 2.84583C17.9098 2.88963 17.8866 2.9295 17.8573 2.96303L8.6901 14.2198C8.60506 14.3246 8.5455 14.4531 8.5174 14.5925C8.48925 14.7318 8.49354 14.8772 8.52981 15.014L11.1482 22.0351C11.2995 22.538 11.6611 22.8722 12.0982 22.8947H12.1429C12.3635 22.8961 12.5794 22.8216 12.7625 22.6807C12.9457 22.5397 13.0875 22.339 13.1696 22.1046L19.9283 1.66597C20.0027 1.4448 20.0197 1.20368 19.977 0.971755C19.9342 0.739881 19.8338 0.527086 19.6877 0.359167Z" />
          </svg>
        </ActionIcon>
      </div>
    </div>
  );
};

/* ========== BalanceRow ========== */

export const BalanceRow = ({
  amount,
  isHidden,
  onToggleHidden,
  loading,
  active,
}) => {
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
      <div
        className="absolute top-1/2 -translate-y-1/2 will-change-transform"
        style={{ left: sizes.currentWidth + 6, transform: "translateZ(35px)" }}
      >
        <IconToggle on={isHidden} onToggle={onToggleHidden} />
      </div>
    </div>
  );
};

/* ========== CarouselViewport (interaction / behaviour) ========== */

export const CarouselViewport = forwardRef(function CarouselViewport(
  { items, renderItem, activeIndex, setActiveIndex },
  ref
) {
  const viewportRef = useRef(null);
  const isDraggingRef = useRef(false);
  const draggingActiveRef = useRef(false);
  const dragStartXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const rafRef = useRef(0);
  const DRAG_ACTIVATE_PX = 4;

  const PEEK = 25;
  const GAP = 10;

  const isInteractiveTarget = (el) => {
    if (!el || !el.closest) return false;
    if (el.closest("[data-allow-drag='true']")) return false;
    return !!el.closest(
      "button, a, [role='button'], input, textarea, select, label"
    );
  };

  const computeCardStep = (el) => {
    // width used to step between cards; each item uses width: calc(100% - PEEK)
    // so step = clientWidth - PEEK + GAP (gap accounts space between)
    return Math.max(1, (el.clientWidth || 0) - PEEK + GAP);
  };

  const updateActiveIndexFromScroll = () => {
    const el = viewportRef.current;
    if (!el) return;

    const cardStep = computeCardStep(el);
    const maxScrollLeft = Math.max(0, (el.scrollWidth || 0) - (el.clientWidth || 0));

    // If we're very close to the end, force last index
    if ((el.scrollLeft || 0) >= maxScrollLeft - 2) {
      const clamped = Math.max(0, Math.min(items.length - 1, items.length - 1));
      if (clamped !== activeIndex) setActiveIndex(clamped);
      return;
    }

    const idx = Math.round(el.scrollLeft / cardStep);
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
        try {
          el.setPointerCapture(e.pointerId);
        } catch {}
      }
      el.style.cursor = "grabbing";
    }

    el.scrollLeft = startScrollLeftRef.current - delta;
  };

  const scrollToIndex = (i) => {
    const el = viewportRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(items.length - 1, i));
    const maxScrollLeft = Math.max(0, (el.scrollWidth || 0) - (el.clientWidth || 0));

    // special-case last index: scroll to right edge
    if (clamped >= items.length - 1) {
      el.scrollTo({ left: maxScrollLeft, behavior: "smooth" });
      return;
    }

    const cardStep = computeCardStep(el);
    const left = Math.max(0, Math.min(maxScrollLeft, Math.round(clamped * cardStep)));
    el.scrollTo({ left, behavior: "smooth" });
  };

  const onPointerUp = (e) => {
    const el = viewportRef.current;
    if (!el) return;

    if (el.releasePointerCapture) {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {}
    }
    el.style.cursor = "";

    if (!draggingActiveRef.current) {
      isDraggingRef.current = false;
      return;
    }

    const cardStep = computeCardStep(el);
    const idx = Math.round(el.scrollLeft / cardStep);

    // Use the improved scrollToIndex so last item snaps to right-edge properly
    scrollToIndex(idx);

    isDraggingRef.current = false;
    draggingActiveRef.current = false;
    if (e.cancelable) e.preventDefault();
  };

  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex,
      get index() {
        return activeIndex;
      },
      get isDraggingRef() {
        return isDraggingRef;
      },
      // expose the raw element for optional fallbacks
      get element() {
        return viewportRef.current;
      },
    }),
    [activeIndex]
  );

  return (
    <div
      ref={viewportRef}
      className="relative overflow-x-auto overflow-y-visible snap-x snap-mandatory scroll-smooth rounded-2xl select-none [-webkit-overflow-scrolling:touch]"
      style={{
        scrollbarWidth: "none",
        touchAction: "auto",
        paddingRight: `${PEEK}px`,
      }}
      onScroll={onScroll}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className="flex"
        style={{ width: "100%", gap: `${GAP}px`, padding: 0 }}
      >
        {items.map((item, idx) => (
          <div
            key={item.id ?? idx}
            className="snap-center shrink-0 p-0"
            style={{ width: `calc(100% - ${PEEK}px)` }}
          >
            {renderItem(item, idx)}
          </div>
        ))}
      </div>
    </div>
  );
});

/* ===== default export ===== */

export default {
  PillBadge,
  IconToggle,
  ActionIcon,
  AmountText,
  GradientCardShell,
  CardTopBar,
  CTASection,
  BalanceRow,
  CarouselViewport,
};
