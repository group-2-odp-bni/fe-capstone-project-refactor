// src/components/QuickTransfer.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useQuickTransfer from "../../hooks/api/useQuickTransfer"; // new hook

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

export default function QuickTransfer() {
  // use the new mock API hook
  const { contacts = [], loading } = useQuickTransfer({ limit: 50 });
  const navigate = useNavigate();

  // config
  const GAP_PX = 16;
  const ITEM_W_PX = 120; // fixed width for each item (desktop)
  const MOBILE_VISIBLE = 4;

  // dedupe by name (same as your existing logic) and sort by lastTransferAt
  const uniqueRecent = useMemo(() => {
    const map = new Map();
    for (const c of contacts) {
      const name = (c.name || "").trim() || c.phone || "—";
      const when = c.lastTransferAt ? Date.parse(c.lastTransferAt) : 0;
      const ex = map.get(name);
      if (!ex || when > ex.when) map.set(name, { name, when, meta: c });
    }
    return Array.from(map.values())
      .sort((a, b) => b.when - a.when)
      .map((x) => ({ name: x.name, meta: x.meta }));
  }, [contacts]);

  const ProfileCard = ({ children }) => (
    <div
      className={[
        "rounded-[14px]",
        "bg-white",
        "border border-gray-200",
        "shadow-[0_6px_18px_rgba(0,0,0,0.06)]",
        "p-3 flex flex-col items-center justify-center",
        "flex-none", // important: don't stretch
        `w-[${ITEM_W_PX}px]`,
      ].join(" ")}
      style={{ width: ITEM_W_PX }}
    >
      {children}
    </div>
  );

  const AvatarButton = ({ name = "", meta }) => {
    const handleClick = () => {
      // navigate to transfer page with step enter-amount and pass recipient data
      navigate("/app/transfer", {
        state: {
          step: "enter-amount",
          to: {
            name: meta?.name || name,
            phone: meta?.phone,
            accountId: meta?.accountId,
          },
        },
      });
    };

    return (
      <button
        type="button"
        onClick={handleClick}
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
        <span className="text-xs sm:text-sm md:text-sm text-gray-800 font-medium truncate max-w-[120px]">
          {name || "—"}
        </span>
      </button>
    );
  };

  return (
    <div className="mt-6">
      <h3 className="px-3 font-semibold text-lg text-gray-900 mb-3 text-left">
        Quick Transfer
      </h3>

      <div className="mb-8">
        {loading ? (
          <div className="flex gap-4 px-3">
            {Array.from({ length: MOBILE_VISIBLE }).map((_, i) => (
              <div key={i} className="flex flex-col items-center space-y-2 w-[92px]">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-200 animate-pulse rounded-full" />
                <div className="w-12 h-3 md:w-14 bg-gray-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : uniqueRecent.length === 0 ? (
          <div className="text-sm text-gray-500 px-3">Belum ada penerima.</div>
        ) : (
          <>
            {/* Mobile: fixed 4 grid (keeps original feel) */}
            <div className="block md:hidden px-3">
              <div className="grid grid-cols-4 gap-4 sm:gap-6 justify-items-center">
                {uniqueRecent.slice(0, MOBILE_VISIBLE).map(({ name, meta }, i) => (
                  <ProfileCard key={`m-${i}`}>
                    <AvatarButton name={name} meta={meta} />
                  </ProfileCard>
                ))}
              </div>
            </div>

            {/* Desktop: horizontal scroll with fixed item width (no stretch) */}
            <div className="hidden md:block">
              <div
                ref={null}
                className="px-3"
              >
                <div
                  className="flex gap-4 overflow-x-auto pb-3 pl-0 pr-3 scroll-smooth"
                  style={{
                    // enable snap to center for nicer UX (optional)
                    scrollSnapType: "x mandatory",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {uniqueRecent.map(({ name, meta }, i) => (
                    <div
                      key={`d-${i}`}
                      className="flex-none"
                      style={{
                        width: ITEM_W_PX,
                        scrollSnapAlign: "center",
                      }}
                    >
                      <ProfileCard>
                        <AvatarButton name={name} meta={meta} />
                      </ProfileCard>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* small CSS to hide scrollbar and keep tidy */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
