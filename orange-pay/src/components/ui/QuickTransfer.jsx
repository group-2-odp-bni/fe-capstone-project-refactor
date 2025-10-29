// src/components/ui/QuickTransferUI.jsx
import React from "react";

/**
 * QuickTransferUI
 * Props:
 *  - items: [{ displayName, fullName, meta }, ...]
 *  - loading: boolean
 *  - onSelectContact: (item) => void
 *  - itemWidthDesktop: number (px)
 *  - itemWidthMobile: number (px)
 *  - mobileVisible: number
 */

const letterColorMap = {
  A: "bg-red-200", B: "bg-orange-200", C: "bg-amber-200", D: "bg-yellow-200",
  E: "bg-lime-200", F: "bg-green-200", G: "bg-emerald-200", H: "bg-teal-200",
  I: "bg-cyan-200", J: "bg-sky-200", K: "bg-blue-200", L: "bg-indigo-200",
  M: "bg-violet-200", N: "bg-purple-200", O: "bg-fuchsia-200", P: "bg-pink-200",
  Q: "bg-rose-200", R: "bg-red-300", S: "bg-orange-300", T: "bg-amber-300",
  U: "bg-yellow-300", V: "bg-lime-300", W: "bg-green-300", X: "bg-emerald-300",
  Y: "bg-teal-300", Z: "bg-cyan-300",
};

const getColorForName = (name = "") => {
  const first = (name || "?").charAt(0).toUpperCase();
  return letterColorMap[first] || "bg-gray-200";
};

export function ProfileCard({ children }) {
  // keep card styling here; width is controlled by wrapper for flexibility
  return (
    <div
      className={[
        "rounded-[14px]",
        "bg-white",
        "border border-gray-200",
        "p-3 flex flex-col items-center justify-center",
        "flex-none",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function AvatarButton({ displayName = "", fullName = "", meta = {}, onClick }) {
  const titleName = meta?.name || fullName || displayName || "—";
  const shownName = displayName || fullName || "—";

  return (
    <button
      type="button"
      onClick={() => onClick({ name: titleName, phone: meta?.phone, accountId: meta?.accountId, fullName, displayName })}
      className="flex flex-col items-center space-y-3 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-xl min-w-0"
      aria-label={`Transfer cepat ke ${titleName}`}
      title={titleName}
    >
      <div
        className={[
          "rounded-full flex items-center justify-center font-bold text-gray-700",
          "w-12 h-12 text-lg",
          "md:w-16 md:h-16 md:text-2xl",
          "lg:w-20 lg:h-20 lg:text-3xl",
          "transition-transform group-active:scale-95",
          getColorForName(titleName),
        ].join(" ")}
        style={{ minWidth: 48, minHeight: 48 }}
      >
        {(titleName || "?").charAt(0).toUpperCase()}
      </div>
      <span className="text-xs sm:text-sm md:text-sm text-gray-800 font-medium truncate max-w-full">
        {shownName}
      </span>
    </button>
  );
}

export default function QuickTransferUI({
  items = [],
  loading = false,
  onSelectContact = () => {},
  itemWidthDesktop = 120,
  itemWidthMobile = 92,
  mobileVisible = 4,
}) {
  return (
    <div className="mt-6">
      <h3 className="px-0 font-semibold text-lg text-gray-900 mb-3 text-left">
        Quick Transfer
      </h3>

      <div className="mb-1">
        {loading ? (
          <div className="flex gap-4 px-0">
            {Array.from({ length: mobileVisible }).map((_, i) => (
              <div key={i} className="flex flex-col items-center space-y-2" style={{ width: itemWidthMobile }}>
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-200 animate-pulse rounded-full" />
                <div className="w-12 h-3 md:w-14 bg-gray-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-500 px-0">Belum ada penerima.</div>
        ) : (
          <>
            {/* MOBILE */}
            <div className="block md:hidden px-0">
              <div
                className="flex gap-4 overflow-x-auto pb-0 pl-0 pr-3 scroll-smooth"
                style={{
                  WebkitOverflowScrolling: "touch",
                  scrollSnapType: "x mandatory",
                }}
              >
                {items.slice(0, mobileVisible).map((it, i) => (
                  <div
                    key={`m-${i}`}
                    className="flex-none"
                    style={{ scrollSnapAlign: "center", width: itemWidthMobile }}
                  >
                    <ProfileCard>
                      <AvatarButton
                        displayName={it.displayName}
                        fullName={it.fullName}
                        meta={it.meta}
                        onClick={onSelectContact}
                      />
                    </ProfileCard>
                  </div>
                ))}
              </div>
            </div>

            {/* DESKTOP */}
            <div className="hidden md:block px-0">
              <div className="px-0">
                <div
                  className="flex gap-4 overflow-x-auto pb-3 pl-0 pr-3 scroll-smooth"
                  style={{
                    scrollSnapType: "x mandatory",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {items.map((it, i) => (
                    <div
                      key={`d-${i}`}
                      className="flex-none"
                      style={{
                        width: itemWidthDesktop,
                        scrollSnapAlign: "center",
                      }}
                    >
                      <ProfileCard>
                        <AvatarButton
                          displayName={it.displayName}
                          fullName={it.fullName}
                          meta={it.meta}
                          onClick={onSelectContact}
                        />
                      </ProfileCard>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        /* hide native scrollbar if desired (keeps layout tidy) */
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
