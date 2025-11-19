"use client";
import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import html2canvas from "html2canvas";
import { useToast } from "../../context/ToastContext";

// ===== Konstanta layout =====
const HEADER_HEIGHT = 140;
const RECEIPT_EXTRA_GAP = 64; // ✅ WILL BE USED NOW!
const FOOTER_SAFE_GAP = 8;

/** ---------- Util: dataURL <-> Blob ---------- */
function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

/** ---------- Util: Save-as yang benar2 nyimpen ke komputer ---------- */
async function saveBlob(blob, suggestedName) {
  const canFS =
    typeof window !== "undefined" &&
    "showSaveFilePicker" in window &&
    typeof window.showSaveFilePicker === "function";

  if (canFS) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [
          { description: "PNG Image", accept: { "image/png": [".png"] } },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch {
      // user cancel → fallback
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 200);
  return true;
}

/** ✨ Field dengan enhanced hover & focus states */
function Field({ label, value, mono = false }) {
  return (
    <div className="group rounded-xl border border-gray-200/80 p-3.5 bg-gradient-to-br from-white via-gray-50/50 to-gray-50/30 hover:border-gray-300/90 hover:shadow-sm transition-all duration-300 ease-out">
      <div className="text-[9px] uppercase tracking-[0.08em] text-gray-500 font-black mb-2 transition-colors group-hover:text-gray-600">
        {label}
      </div>
      <div
        className={`text-[13px] font-bold text-gray-950 ${
          mono ? "font-mono tracking-tight" : ""
        } break-words leading-snug`}
        title={String(value || "")}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function PrintField({ label, value, mono, wide }) {
  return (
    <div
      style={{
        gridColumn: wide ? "1 / -1" : "auto",
        border: "1px solid #E5E7EB",
        background: "linear-gradient(135deg, #FAFBFC 0%, #F9FAFB 100%)",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div
        style={{
          fontSize: 9,
          color: "#64748B",
          fontWeight: 900,
          letterSpacing: 1.3,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#0F172A",
          fontFamily: mono
            ? "ui-monospace, SFMono-Regular, Menlo, monospace"
            : "inherit",
          wordBreak: "break-word",
          lineHeight: 1.4,
        }}
        title={String(value || "")}
      >
        {value || "—"}
      </div>
    </div>
  );
}

/* ================= 🎉 ULTIMATE ADVANCED: Success Animation ================= */
function DockingHighFive({ members = [], onDock }) {
  const [stage, setStage] = useState(0);
  const [position, setPosition] = useState("center");
  const [confettiOpacity, setConfettiOpacity] = useState(1);
  const [frozen, setFrozen] = useState(false);
  const [dockingComplete, setDockingComplete] = useState(false);

  // 🎨 Clean Color Palette
  const PALETTE = {
    green: {
      outer: "#22C55E",
      mid: "#16A34A",
      inner: "#DCFCE7",
      innerLight: "#F0FDF4",
      glow: "rgba(34, 197, 94, 0.4)",
    },
    text: "#0F172A",
  };

  // 🎯 Badge positioning
  const badgeStyles = useMemo(() => {
    const isCentered = position === "center";
    const topTarget = isCentered
      ? "50%"
      : `calc(env(safe-area-inset-top, 0px) + 24px)`;
    const size = isCentered ? 160 : 128;
    const translateY = isCentered ? "-50%" : "0";
    const scale = isCentered ? 1 : 0.8;

    const transition =
      frozen && dockingComplete
        ? "none"
        : "top 1000ms cubic-bezier(0.34,1.56,0.64,1), transform 1000ms cubic-bezier(0.34,1.56,0.64,1)";

    return {
      position: "fixed",
      left: "50%",
      top: topTarget,
      transform: `translate(-50%, ${translateY}) scale(${scale})`,
      width: `${size}px`,
      height: `${size}px`,
      transition,
      zIndex: 10060,
      pointerEvents: "none",
      willChange: frozen && dockingComplete ? "auto" : "transform, top",
      ["--badge-size"]: `${size}px`,
    };
  }, [position, frozen, dockingComplete]);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 200);
    const t2 = setTimeout(() => setStage(2), 1000);
    const t3 = setTimeout(() => setStage(3), 1500);
    const t4 = setTimeout(() => {
      setStage(4);
      setPosition("header");
      const tDock = setTimeout(() => {
        onDock?.();
        setConfettiOpacity(0);
        setFrozen(true);
        const tFreeze = setTimeout(() => {
          setDockingComplete(true);
        }, 100);
        return () => clearTimeout(tFreeze);
      }, 1100);
      return () => clearTimeout(tDock);
    }, 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onDock]);

  return (
    <>
      {/* ✨ Success Badge */}
      <div style={badgeStyles} aria-hidden>
        <div className="relative w-full h-full">
          {/* 🌟 Outer glow */}
          <div
            className={`absolute inset-[-35%] rounded-full ${
              frozen && dockingComplete ? "" : "transition-all duration-700"
            } ${stage >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
            style={{
              background: `radial-gradient(circle, ${PALETTE.green.glow} 0%, transparent 70%)`,
              filter: "blur(24px)",
              zIndex: 0,
            }}
          />

          {/* 🎭 Main Badge Circle */}
          <div
            className={`relative z-[1] w-full h-full rounded-full flex items-center justify-center ${
              frozen && dockingComplete ? "" : "transition-all duration-700"
            } ${stage >= 1 ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
            style={{
              background: `radial-gradient(circle at 35% 30%, ${PALETTE.green.outer} 0%, ${PALETTE.green.mid} 100%)`,
              boxShadow: `0 20px 60px ${PALETTE.green.glow}`,
              willChange: frozen && dockingComplete ? "auto" : "transform",
            }}
          >
            {/* 💫 Ripple animation */}
            {!frozen && stage >= 1 && (
              <>
                <div
                  className="absolute inset-0 rounded-full bg-green-400 opacity-20"
                  style={{
                    animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
                  }}
                />
                <div
                  className="absolute inset-0 rounded-full bg-green-400 opacity-10"
                  style={{
                    animation:
                      "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  }}
                />
              </>
            )}

            {/* 🎨 Inner circle */}
            <div
              className="relative rounded-full flex items-center justify-center"
              style={{
                width: "calc(var(--badge-size) * 0.58)",
                height: "calc(var(--badge-size) * 0.58)",
                background: `radial-gradient(circle at 40% 35%, ${PALETTE.green.innerLight} 0%, ${PALETTE.green.inner} 100%)`,
              }}
            >
              {/* ✅ Checkmark */}
              <svg
                width="70"
                height="70"
                viewBox="0 0 24 24"
                className={`${
                  frozen && dockingComplete ? "" : "transition-all duration-500"
                } ${
                  stage >= 2 ? "scale-100 opacity-100" : "scale-75 opacity-0"
                }`}
                style={{
                  strokeDasharray: stage >= 2 ? 50 : 0,
                  strokeDashoffset: stage >= 2 ? 0 : 50,
                  transition:
                    frozen && dockingComplete
                      ? "none"
                      : "stroke-dashoffset 0.6s ease-out 0.3s",
                  filter: "drop-shadow(0 2px 4px rgba(22,163,74,0.2))",
                }}
              >
                <path
                  d="M5 13l4 4L19 7"
                  stroke={PALETTE.green.mid}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
          </div>

          {/* 📝 Success Text - 2 LINES! */}
          <div
            className="relative z-[1] text-center mt-4 pointer-events-none"
            style={{
              opacity: stage >= 3 ? 1 : 0,
              transform:
                stage >= 3
                  ? "translateY(0) scale(1)"
                  : "translateY(-8px) scale(0.95)",
              transition:
                frozen && dockingComplete
                  ? "none"
                  : "opacity 700ms ease-out, transform 700ms ease-out",
            }}
          >
            <div
              style={{
                color: PALETTE.text,
                fontSize: position === "center" ? 24 : 18,
                fontWeight: 900,
                letterSpacing: -0.3,
                textShadow: "0 2px 4px rgba(0,0,0,0.08)",
                lineHeight: "1.1",
                transition:
                  frozen && dockingComplete ? "none" : "font-size 400ms ease",
              }}
            >
              Pembayaran
            </div>
            <div
              style={{
                color: PALETTE.text,
                fontSize: position === "center" ? 24 : 18,
                fontWeight: 900,
                letterSpacing: -0.3,
                textShadow: "0 2px 4px rgba(0,0,0,0.08)",
                lineHeight: "1.1",
                transition:
                  frozen && dockingComplete ? "none" : "font-size 400ms ease",
              }}
            >
              Sukses!
            </div>
          </div>
        </div>
      </div>

      {/* 🎊 Confetti Animation */}
      <div
        className="pointer-events-none"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10040,
          opacity: confettiOpacity,
          transition: frozen
            ? "opacity 600ms ease-out"
            : "opacity 600ms ease-out",
          overflow: "hidden",
        }}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes confetti-fall {
                0% { 
                  transform: translateY(0) rotate(0deg) scale(1);
                  opacity: 1; 
                }
                100% { 
                  transform: translateY(100vh) rotate(720deg) scale(0.3);
                  opacity: 0; 
                }
              }
            `,
          }}
        />
        {stage >= 2 &&
          Array.from({ length: 50 }).map((_, i) => {
            const emojis = ["🎉", "🎊", "✨", "🌟", "💫", "🎈"];
            const emoji = emojis[Math.floor(Math.random() * emojis.length)];
            const left = Math.random() * 100;
            const delay = Math.random() * 0.8;
            const size = 12 + Math.random() * 8;

            return (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${left}%`,
                  top: "-5%",
                  fontSize: `${size}px`,
                  animation:
                    frozen && dockingComplete
                      ? "none"
                      : `confetti-fall 3s ease-out ${delay}s forwards`,
                }}
              >
                {emoji}
              </div>
            );
          })}
      </div>
    </>
  );
}

/** ---------- Main Component ---------- */
export default function MemberPaymentSuccess({
  open,
  onClose,
  ctx,
  onDownloadReceipt,
}) {
  const { showToast } = useToast();

  const {
    amount = 0,
    receiver = {},
    splitName = "Split Bill",
    splitId = "",
    txType = "Bayar split bill",
    txDate = new Date(),
    currency = (n) =>
      `Rp${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
        Number(n || 0)
      )}`,
    members = [],
  } = ctx;

  const displayCurrency =
    typeof currency === "function" ? currency : (n) => `Rp${n}`;
  const phoneDisplay = receiver.phone || receiver.phoneMasked;

  const [headerDocked, setHeaderDocked] = useState(false);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [buttonsVisible, setButtonsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [scrollLocked, setScrollLocked] = useState(true); // ✅ Lock scroll during animation

  const receiptRef = useRef(null);
  const receiptPrintRef = useRef(null);
  const containerRef = useRef(null);

  // ✅ ENHANCED: FIX VIEWPORT UNTUK ALLOW ZOOM & SCROLL!
  useEffect(() => {
    if (!open) return;
    if (typeof document !== "undefined" && typeof window !== "undefined") {
      // Store original styles
      const originalOverflow = document.body.style.overflow;
      const originalWidth = document.body.style.width;
      const originalHeight = document.body.style.height;
      const htmlOriginalOverflow = document.documentElement.style.overflow;

      // ✅ Lock body scroll
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      document.body.style.width = "100%";

      // ✅ CRITICAL: Remove user-scalable restriction - ALLOW ZOOM!
      let viewport = document.querySelector("meta[name='viewport']");
      let viewportContent = "";
      if (viewport) {
        viewportContent = viewport.getAttribute("content");
        viewport.setAttribute(
          "content",
          "width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=10.0, user-scalable=yes, viewport-fit=cover"
        );
      } else {
        const newViewport = document.createElement("meta");
        newViewport.name = "viewport";
        newViewport.content =
          "width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=10.0, user-scalable=yes, viewport-fit=cover";
        document.head.appendChild(newViewport);
      }

      return () => {
        document.documentElement.style.overflow = htmlOriginalOverflow;
        document.body.style.overflow = originalOverflow;
        document.body.style.width = originalWidth;
        if (viewport && viewportContent) {
          viewport.setAttribute("content", viewportContent);
        }
      };
    }
  }, [open]);

  // ✅ NEW: Unlock scroll ketika docking selesai
  useEffect(() => {
    if (headerDocked && scrollLocked) {
      setScrollLocked(false);
      if (containerRef.current) {
        containerRef.current.style.overflowY = "auto";
      }
    }
  }, [headerDocked, scrollLocked]);

  const refId = useMemo(() => {
    const stamp = new Date(txDate).getTime().toString();
    return `2025${stamp.slice(-16)}`;
  }, [txDate]);

  const transactionId = useMemo(() => `TXN-${refId.slice(-12)}`, [refId]);

  const dateStr = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(txDate)
    .replace(/,/g, "");

  const timeStr = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(txDate);

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  const handleDownloadReceipt = useCallback(async () => {
    if (downloading) return;

    try {
      const target = receiptPrintRef.current || receiptRef.current;
      if (!target) throw new Error("Receipt element not found");

      await new Promise((r) => setTimeout(r, 250));

      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      const scale = Math.min(
        3,
        Math.max(
          2,
          (typeof window !== "undefined" ? window.devicePixelRatio : 2) || 2
        )
      );
      const width = isMobile ? 360 : 420;

      const canvas = await html2canvas(target, {
        backgroundColor: "#ffffff",
        scale,
        logging: false,
        useCORS: true,
        allowTaint: false,
        windowWidth: width,
        windowHeight: target.scrollHeight,
        imageTimeout: 0,
        removeContainer: true,
        ignoreElements: (el) =>
          el.tagName === "BUTTON" ||
          el.classList.contains("ignore-screenshot") ||
          getComputedStyle(el).visibility === "hidden",
      });

      const filename = `receipt-${transactionId}.png`;

      let blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png", 0.95)
      );
      if (!blob) {
        const dataUrl = canvas.toDataURL("image/png", 0.95);
        blob = dataURLtoBlob(dataUrl);
      }

      await saveBlob(blob, filename);
    } catch (e) {
      console.error("Error downloading receipt:", e);
      showToast({
        type: "error",
        title: "Gagal mengunduh struk",
        message:
          "Pastikan logo/gambar berasal dari domain yang sama (public/). Coba lagi setelah memastikan gambar ter-serve dengan benar.",
      });
    }
  }, [transactionId, receiptPrintRef, receiptRef, downloading]);
  if (!open || !ctx) return null;
  return (
    // ✅ FULL FIX: Kombinasi fixed + scrollable content + lock during animation
    <div
      ref={containerRef}
      className="bg-gradient-to-b from-white via-white to-gray-50/30 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label="Pembayaran Sukses"
      style={{
        zIndex: 10000,
        isolation: "isolate",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        overflowY: scrollLocked ? "hidden" : "auto", // ✅ Dynamic overflow
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Success Animation with Docking - SELALU TETAP VISIBLE */}
      <DockingHighFive
        members={members}
        onDock={() => {
          setHeaderDocked(true);
          setReceiptVisible(true);
          setTimeout(() => setButtonsVisible(true), 650);
        }}
      />

      {/* ✨ Print Template (Hidden) */}
      <div
        ref={receiptPrintRef}
        style={{
          position: "fixed",
          left: "-9999px",
          top: "-9999px",
          width: "100%",
          maxWidth: "420px",
          background: "#FAFBFC",
          fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
          color: "#0F172A",
          lineHeight: 1.45,
          boxSizing: "border-box",
          padding: "16px",
        }}
        aria-hidden
      >
        <div
          style={{
            width: "100%",
            background: "#FFFFFF",
            borderRadius: 18,
            boxShadow: "0 12px 40px rgba(15,23,42,0.1)",
            border: "1px solid #E5E7EB",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "20px 18px 0 18px" }}>
            <div style={{ textAlign: "center", marginBottom: 6 }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  letterSpacing: -0.5,
                  color: "#0F172A",
                }}
              >
                {splitName || "Split Bill"}
              </div>
            </div>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>
                {dateStr} • {timeStr}
              </div>
            </div>
          </div>

          <div style={{ padding: "0 18px" }}>
            <div style={{ borderTop: "1px dashed #E5E7EB" }} />
          </div>

          <div style={{ padding: "18px 18px 12px 18px", textAlign: "center" }}>
            <div
              style={{
                fontSize: 12,
                color: "#9CA3AF",
                fontWeight: 900,
                marginBottom: 10,
                letterSpacing: 0.8,
              }}
            >
              TOTAL AMOUNT
            </div>
            <div
              style={{
                fontSize: 34,
                fontWeight: 950,
                letterSpacing: -0.8,
                whiteSpace: "nowrap",
                color: "#0F172A",
              }}
            >
              {displayCurrency(amount)}
            </div>
          </div>

          <div style={{ padding: "10px 18px 0 18px" }}>
            <div style={{ borderTop: "1px dashed #E5E7EB" }} />
          </div>

          <div style={{ padding: "16px 18px 18px 18px" }}>
            <div
              style={{
                fontSize: 11,
                color: "#64748B",
                fontWeight: 900,
                marginBottom: 10,
                letterSpacing: 1,
              }}
            >
              DIBAYARKAN KEPADA
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "9999px",
                  background:
                    "linear-gradient(135deg, #FB923C 0%, #F97316 100%)",
                  color: "#fff",
                  fontWeight: 900,
                  display: "grid",
                  textAlign: "center",
                  flexShrink: 0,
                  fontSize: 17,
                  boxShadow: "0 4px 12px rgba(249,115,22,0.25)",
                }}
              >
                {(receiver?.name || "?").charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#0F172A",
                    marginBottom: 2,
                  }}
                >
                  {receiver?.name || "—"}
                </div>
                {!!phoneDisplay && (
                  <div
                    style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}
                  >
                    {phoneDisplay}
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <PrintField label="SPLIT BILL" value={splitName} />
              <PrintField label="SPLIT ID" value={splitId || "—"} mono />
              <PrintField label="DATE" value={dateStr} />
              <PrintField label="TIME" value={timeStr} />
              <PrintField label="TYPE OF TRANSACTION" value={txType} wide />
            </div>

            <div
              style={{
                borderTop: "1px solid #EEF2F7",
                marginTop: 16,
                paddingTop: 14,
              }}
            />
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: "#64748B",
                  fontWeight: 900,
                  letterSpacing: 1.2,
                }}
              >
                ID TRANSAKSI
              </span>
              <span
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#0F172A",
                }}
              >
                {transactionId}
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "14px 18px 18px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <img
              src="/Orangepay.svg"
              alt="OrangePay"
              width={120}
              height={36}
              style={{ display: "block", objectFit: "contain", opacity: 0.7 }}
              crossOrigin="anonymous"
            />
          </div>
        </div>
      </div>

      {/* ✨ Scrollable Content Area */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingLeft: "max(16px, env(safe-area-inset-left))",
          paddingRight: "max(16px, env(safe-area-inset-right))",
          paddingTop: headerDocked
            ? `calc(${HEADER_HEIGHT}px + env(safe-area-inset-top, 0px) + 16px)`
            : "16px",
          paddingBottom: `max(32px, env(safe-area-inset-bottom))`,
          transition: "padding-top 1000ms cubic-bezier(0.34,1.56,0.64,1)",
          flex: 1,
        }}
      >
        {/* Receipt Card */}
        <div
          ref={receiptRef}
          className="w-full max-w-[440px] flex flex-col items-center space-y-4 transition-all duration-[1000ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            transform: receiptVisible
              ? "translateY(0) translate3d(0,0,0)"
              : "translateY(100%)",
            opacity: receiptVisible ? 1 : 0,
            zIndex: 10020,
            willChange: "transform, opacity",
            minWidth: 0,
            marginTop: headerDocked ? `${RECEIPT_EXTRA_GAP}px` : 0, // ✅ NOW USED!
          }}
        >
          <div className="w-full rounded-3xl bg-white shadow-[0_28px_64px_rgba(0,0,0,0.15),0_8px_24px_rgba(0,0,0,0.08)] border border-gray-200/60 overflow-hidden backdrop-blur-sm">
            {/* Header Section */}
            <div className="px-5 pt-7 pb-5 relative bg-gradient-to-b from-gray-50/70 via-white to-white">
              <div className="flex items-center justify-center">
                <div className="relative w-36 h-9">
                  <img
                    src="/Orangepay.svg"
                    alt="OrangePay"
                    className="w-full h-full object-contain select-none pointer-events-none"
                    draggable="false"
                    loading="eager"
                    decoding="sync"
                    crossOrigin="anonymous"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-200/70 to-transparent mx-5" />

            {/* Main Content */}
            <div className="px-5 py-7">
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.1em] text-center mb-6">
                Detail Transaksi
              </div>

              {/* Amount Display */}
              <div className="text-center mb-8">
                <div className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-gray-950 break-words px-2 leading-tight">
                  {displayCurrency(amount)}
                </div>
              </div>

              {/* Receiver Card */}
              <div className="rounded-2xl border border-gray-200/80 p-4 mb-5 bg-gradient-to-br from-gray-50/60 via-white to-gray-50/30 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="text-[10px] uppercase tracking-[0.08em] text-gray-500 font-black mb-3.5">
                  Dibayarkan kepada
                </div>
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white font-black grid place-items-center text-lg shadow-lg shadow-orange-500/25 ring-2 ring-white ring-offset-2 flex-shrink-0">
                    {(receiver?.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold text-gray-950 truncate mb-0.5">
                      {receiver?.name || "—"}
                    </div>
                    {!!phoneDisplay && (
                      <div className="text-[12px] text-gray-600 break-all font-semibold">
                        {phoneDisplay}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Field Grids */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <Field label="Split Bill" value={splitName} />
                <Field label="Split ID" value={splitId || "—"} mono />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <Field label="Tanggal" value={dateStr} />
                <Field label="Waktu" value={timeStr} />
              </div>
              <div className="grid grid-cols-1 gap-3 mb-1">
                <Field label="Tipe Transaksi" value={txType} />
              </div>

              {/* Transaction ID Section */}
              <div className="mt-7 h-px bg-gradient-to-r from-transparent via-gray-200/80 to-transparent" />
              <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
                <span className="text-[10px] text-gray-500 tracking-[0.08em] font-black uppercase flex-shrink-0">
                  ID Transaksi
                </span>
                <span className="text-[12px] font-mono text-gray-900 font-bold break-all tracking-tight min-w-0">
                  {transactionId}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(transactionId)}
                  className={`px-4 py-2 rounded-xl text-[11px] font-bold border-2 transition-all active:scale-95 shadow-sm min-w-[80px] flex-shrink-0 ${
                    copied
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-emerald-200/50"
                      : "bg-white text-blue-700 border-blue-300 hover:bg-blue-50 hover:border-blue-400 shadow-blue-200/30 hover:shadow-md"
                  }`}
                  style={{ minHeight: "44px" }}
                >
                  {copied ? "✓ Disalin" : "Salin"}
                </button>
              </div>
            </div>
          </div>

          <div style={{ height: FOOTER_SAFE_GAP }} aria-hidden />
        </div>

        {/* Action Buttons - BELOW RECEIPT (NON-STICKY) */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            paddingLeft: "max(16px, env(safe-area-inset-left))",
            paddingRight: "max(16px, env(safe-area-inset-right))",
            paddingBottom: "max(32px, env(safe-area-inset-bottom))",
            paddingTop: "16px",
          }}
        >
          <div
            className={`w-full grid grid-cols-2 gap-2 sm:gap-3.5 transition-all duration-600 ease-out pointer-events-auto relative max-w-[440px] px-0 ${
              buttonsVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className="col-span-1 rounded-full py-3 sm:py-4 text-[13px] sm:text-[15px] font-bold bg-gray-100 text-gray-800 hover:bg-gray-200 active:scale-[0.96] transition-all focus:outline-none focus:ring-4 focus:ring-gray-300/70 shadow-md hover:shadow-lg min-h-[44px] sm:min-h-[52px]"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleDownloadReceipt}
              disabled={downloading}
              className={`col-span-1 rounded-full py-3 sm:py-4 text-[13px] sm:text-[15px] font-bold text-white transition-all focus:outline-none focus:ring-4 focus:ring-orange-300/60 min-h-[44px] sm:min-h-[52px] ${
                downloading
                  ? "bg-gray-400 cursor-not-allowed opacity-60"
                  : "bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 shadow-[0_14px_36px_rgba(249,115,22,0.5)] hover:shadow-[0_18px_44px_rgba(249,115,22,0.6)] active:scale-[0.96] hover:-translate-y-0.5"
              }`}
            >
              {downloading ? "Mengunduh…" : "Download Bukti"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
