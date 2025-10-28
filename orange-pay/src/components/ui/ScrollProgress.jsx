// src/components/ui/ScrollProgress.jsx
import React, { useRef, useLayoutEffect, useEffect, useState, useCallback } from "react";

/**
 * Responsive & robust ScrollProgress
 * - Smooth dragging (RAF + transform)
 * - Click-to-jump without glitch (temporary pointer-update suspension)
 * - Responsive: fits mobile via maxWidth: min(420px, 92vw)
 *
 * Props:
 *  - count (number)
 *  - activeIndex (number)
 *  - onChange (idx) => void
 *  - accent (color)
 *  - continuous (bool) -> call onChange while dragging (default false)
 */

export default function ScrollProgress({
  count = 0,
  activeIndex = 0,
  onChange = () => {},
  accent = "#FFAE51",
  continuous = false,
}) {
  const trackRef = useRef(null);
  const thumbRef = useRef(null);
  const fillRef = useRef(null);

  const rectRef = useRef({ left: 0, width: 0 });
  const draggingRef = useRef(false);
  const rafRef = useRef(null);
  const clientXRef = useRef(null);
  const localIndexRef = useRef(Math.max(0, Math.min(count - 1, Number(activeIndex || 0))));
  const suspendPointerUpdatesRef = useRef(false); // used to avoid click/drag race

  // sync external activeIndex
  useEffect(() => {
    localIndexRef.current = Math.max(0, Math.min(count - 1, Number(activeIndex || 0)));
    if (!draggingRef.current && !suspendPointerUpdatesRef.current) {
      // update DOM smoothly
      updateDOMByIndex(localIndexRef.current, true);
    }
  }, [activeIndex, count]);

  // measure
  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      rectRef.current = { left: r.left, width: r.width };
      // apply DOM update after measuring
      updateDOMByIndex(localIndexRef.current, true);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // helpers
  const indexToPercent = useCallback((idx) => {
    if (count <= 1) return 0;
    return Math.max(0, Math.min(1, idx / Math.max(1, count - 1)));
  }, [count]);

  const percentToIndex = useCallback((p) => {
    if (count <= 1) return 0;
    return Math.round(Math.max(0, Math.min(1, p)) * (count - 1));
  }, [count]);

  const clientXToPercent = useCallback((clientX) => {
    const { left, width } = rectRef.current;
    if (!width) return 0;
    return Math.max(0, Math.min(1, (clientX - left) / width));
  }, []);

  // DOM update using RAF + transform for thumb
  function updateDOM(percent, withTransition = false) {
    if (!thumbRef.current || !fillRef.current || !trackRef.current) return;
    const trackW = rectRef.current.width || trackRef.current.clientWidth || 0;
    const thumbW = Math.max(20, Math.min(Math.max(28, trackW * 0.14), 56));
    const leftPx = percent * trackW;
    thumbRef.current.style.transition = withTransition ? "transform 200ms cubic-bezier(.2,.9,.2,1)" : "none";
    thumbRef.current.style.transform = `translateX(${leftPx}px) translateX(-50%) translateY(-50%)`;
    fillRef.current.style.transition = withTransition ? "width 200ms cubic-bezier(.2,.9,.2,1)" : "none";
    const fillWidth = Math.max(thumbW / 2, percent * trackW);
    fillRef.current.style.width = `${fillWidth}px`;
    thumbRef.current.style.width = `${thumbW}px`;
  }

  function scheduleUpdate(percent, withTransition = false) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      updateDOM(percent, withTransition);
      rafRef.current = null;
    });
  }

  function updateDOMByIndex(idx, withTransition = false) {
    const p = indexToPercent(idx);
    scheduleUpdate(p, withTransition);
  }

  // click-to-jump (robust): suspend pointer updates briefly to avoid race with pointermove
  const onTrackClick = (e) => {
    if (draggingRef.current) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const p = clientXToPercent(clientX);
    const idx = percentToIndex(p);

    // suspend pointer updates for a short window so animation doesn't get stomped by move handlers
    suspendPointerUpdatesRef.current = true;
    // apply DOM change with transition
    localIndexRef.current = idx;
    updateDOMByIndex(idx, true);

    // call onChange after a short delay matching transition (200ms)
    setTimeout(() => {
      suspendPointerUpdatesRef.current = false;
      onChange(idx);
    }, 200);
  };

  // dragging handlers (pointermove/use RAF)
  useEffect(() => {
    const onPointerMove = (e) => {
      if (!draggingRef.current) return;
      if (suspendPointerUpdatesRef.current) return;
      clientXRef.current = e.clientX ?? e.touches?.[0]?.clientX ?? clientXRef.current;
      const p = clientXToPercent(clientXRef.current);
      const idx = percentToIndex(p);
      // DOM update
      scheduleUpdate(p, false);
      if (continuous && idx !== localIndexRef.current) {
        localIndexRef.current = idx;
        onChange(idx);
      }
    };

    const onPointerUp = (e) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      const clientX = e.clientX ?? e.changedTouches?.[0]?.clientX ?? clientXRef.current;
      const p = clientXToPercent(clientX);
      const idx = percentToIndex(p);
      localIndexRef.current = idx;
      // final transition to snapped index
      updateDOMByIndex(idx, true);
      onChange(idx);
      document.body.style.userSelect = "";
      // small safety: release pointer capture if any
      try {
        (e.target || window).releasePointerCapture?.(e.pointerId);
      } catch {}
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("touchmove", onPointerMove, { passive: false });
    window.addEventListener("touchend", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
    };
  }, [clientXToPercent, continuous, onChange, percentToIndex]);

  const onThumbPointerDown = (e) => {
    e.preventDefault();
    draggingRef.current = true;
    clientXRef.current = e.clientX ?? e.touches?.[0]?.clientX ?? clientXRef.current;
    document.body.style.userSelect = "none";
    // pointer capture best-effort
    try { e.target.setPointerCapture?.(e.pointerId); } catch {}
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      const next = Math.max(0, localIndexRef.current - 1);
      localIndexRef.current = next;
      updateDOMByIndex(next, true);
      onChange(next);
      e.preventDefault();
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      const next = Math.min(count - 1, localIndexRef.current + 1);
      localIndexRef.current = next;
      updateDOMByIndex(next, true);
      onChange(next);
      e.preventDefault();
    } else if (e.key === "Home") {
      localIndexRef.current = 0;
      updateDOMByIndex(0, true);
      onChange(0);
      e.preventDefault();
    } else if (e.key === "End") {
      localIndexRef.current = Math.max(0, count - 1);
      updateDOMByIndex(localIndexRef.current, true);
      onChange(localIndexRef.current);
      e.preventDefault();
    }
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // initial DOM position
  useEffect(() => {
    updateDOMByIndex(localIndexRef.current, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rectRef.current.width, count]);

  // render; responsive via maxWidth: min(420px, 92vw)
  return (
    <div
      ref={trackRef}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={Math.max(0, count - 1)}
      aria-valuenow={localIndexRef.current}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onClick={onTrackClick}
      className="relative h-4 rounded-full select-none mx-auto"
      style={{
        background: "#E5E7EB",
        width: "100%",
        maxWidth: "min(250px, 92vw)",
        height: 14,
      }}
    >
      <div
        ref={fillRef}
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          height: "100%",
          width: 0,
          borderRadius: 9999,
          background: accent,
          boxShadow: `0 4px 12px ${accent}55`,
        }}
      />

      <div
        ref={thumbRef}
        role="button"
        tabIndex={0}
        onPointerDown={onThumbPointerDown}
        onTouchStart={(e) => onThumbPointerDown(e)}
        onClick={(e) => e.stopPropagation()}
        aria-label="Scroll progress thumb"
        style={{
          position: "absolute",
          top: "50%",
          transform: "translateX(0) translateX(-50%) translateY(-50%)",
          width: 36,
          height: 28,
          borderRadius: 9999,
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 6px 18px rgba(0,0,0,0.12), 0 0 18px ${accent}33`,
          border: `2px solid ${accent}22`,
          cursor: "grab",
          transition: "transform 200ms cubic-bezier(.2,.9,.2,1)",
          left: 0,
        }}
      >
        <div style={{ width: "70%", height: 10, borderRadius: 9999, background: accent }} />
      </div>
    </div>
  );
}
