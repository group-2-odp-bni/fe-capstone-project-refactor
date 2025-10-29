import React, { useMemo, useCallback } from "react";

/**
 * Pixel-perfect 3-dot pager
 * - Max 3 dots visible; slides as activeIndex moves
 * - Active dot scales smoothly (no layout shift)
 * - Keyboard accessible (Left/Right)
 */
export default function ScrollProgress({
  count = 0,
  activeIndex = 0,
  onChange = () => {},
  accent = "#FFAE51",
}) {
  const clampedActive = Math.max(0, Math.min(count - 1, activeIndex));

  // Compute sliding 3-dot window
  const indices = useMemo(() => {
    const visible = Math.min(3, count);
    if (visible <= 0) return [];
    const maxStart = Math.max(0, count - visible);
    const start = Math.max(0, Math.min(clampedActive - 1, maxStart));
    return Array.from({ length: visible }, (_, i) => start + i);
  }, [count, clampedActive]);

  const go = useCallback(
    (idx) => {
      if (idx < 0 || idx >= count) return;
      onChange(idx);
    },
    [count, onChange]
  );

  if (!indices.length) return null;

  // constants for pixel perfection
  const WRAP_SIZE = 12;     // outer wrapper square (px) — stays constant
  const DOT_SCALE_INACTIVE = 0.66; // inner circle scale when inactive
  const DOT_SCALE_ACTIVE = 1;       // inner circle scale when active

  return (
    <div
      className="flex items-center justify-center gap-2 py-2"
      role="tablist"
      aria-label="Carousel pagination"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); go(clampedActive - 1); }
        if (e.key === "ArrowRight") { e.preventDefault(); go(clampedActive + 1); }
      }}
      // ensure subpixel crisp transforms across browsers
      style={{ WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}
    >
      {indices.map((idx) => {
        const isActive = idx === clampedActive;
        return (
          <button
            key={idx}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`Go to item ${idx + 1}`}
            onClick={() => go(idx)}
            // wrapper is a fixed square — prevents any layout shift
            className="relative inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:opacity-90"
            style={{
              width: WRAP_SIZE,
              height: WRAP_SIZE,
              boxShadow: isActive ? `0 0 0 2px ${accent}26` : "none",
            }}
          >
            {/* inner dot scales smoothly; GPU-friendly transform */}
            <span
              aria-hidden
              className="block rounded-full"
              style={{
                width: WRAP_SIZE,
                height: WRAP_SIZE,
                background: isActive ? accent : "#D1D5DB", // gray-300
                transform: `scale(${isActive ? DOT_SCALE_ACTIVE : DOT_SCALE_INACTIVE})`,
                transition: "transform 180ms cubic-bezier(.2,.9,.2,1), background-color 180ms linear",
                willChange: "transform",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
