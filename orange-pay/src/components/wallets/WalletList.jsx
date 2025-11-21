import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useCardBalances from "../../hooks/api/useCardBalances";
import {
  GradientCardShell,
  BalanceRow,
  PillBadge,
  CardTopBar,
} from "../ui/BalanceCardUI";
import SearchInput from "../ui/SearchInput";
import { BiGame } from "react-icons/bi";

export default function Wallets() {
  const navigate = useNavigate();
  const { items: wallets, loading, error } = useCardBalances();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const humanizeType = (t) => {
    if (!t) return "";
    const up = t.toUpperCase();
    if (up === "PERSONAL") return "Personal";
    if (up === "SHARED") return "Shared";
    return t;
  };

  const handleWalletClick = (walletId) => {
    navigate(`/app/wallets/${walletId}`);
  };

  if (loading)
    return (
      <div className="p-4 text-sm text-gray-500">Loading wallets...</div>
    );
  if (error)
    return (
      <div className="p-4 text-sm text-red-600">
        Error loading wallets: {String(error)}
      </div>
    );

  const walletTypes = [
    "ALL",
    ...new Set(
      wallets
        .map((w) => humanizeType(w.type))
        .filter((t) => t && t.trim() !== "")
    ),
  ];

  const filteredWallets = wallets
    .filter((w) => !w.isAddCard)
    .filter((w) =>
      search.trim() === ""
        ? true
        : String(w.walletName || "")
            .toLowerCase()
            .includes(search.toLowerCase())
    )
    .filter((w) =>
      typeFilter === "ALL" ? true : humanizeType(w.type) === typeFilter
    );

  return (
    <div className="space-y-3 p-5">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search wallet name..."
        inputMode="text"
      />

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {walletTypes.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap
              ${
                typeFilter === t
                  ? "bg-orange-400 text-white shadow"
                  : "bg-gray-50 text-gray hover:bg-gray-100"
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      {filteredWallets.map((wallet) => (
        <WalletCardInline
          key={wallet.id}
          card={wallet}
          humanizeType={humanizeType}
          onClick={() => handleWalletClick(wallet.id)}
        />
      ))}

      {filteredWallets.length === 0 && (
        <div className="text-sm text-gray-500 px-2 pt-2">No wallets found.</div>
      )}
    </div>
  );
}

/* -------------------------------------------------
   INLINE WALLET CARD
   - overlay supports click / ctrl/cmd-click (open new tab) / keyboard
--------------------------------------------------- */
function WalletCardInline({ card, onClick, humanizeType }) {
  const [isHidden, setIsHidden] = useState(false);

  const bg = card.bg || "linear-gradient(135deg, #4a4a4a, #222)";
  const badgeLabel = card.isMain ? "Utama" : humanizeType(card.type);

  // Overlay handlers: call passed onClick (single-tab) or open in new tab on ctrl/cmd/middle click.
  const overlayHandlers = (() => {
    const handler = (e) => {
      // If user ctrl/cmd-click or middle click, open new tab
      const wantsNewTab = e.ctrlKey || e.metaKey || e.button === 1;
      const url = `/app/wallets/${encodeURIComponent(card.id)}`;

      if (wantsNewTab) {
        // open in new tab
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      // otherwise call provided onClick (navigate)
      if (typeof onClick === "function") {
        onClick();
      } else {
        // fallback: use location assign
        window.location.href = url;
      }
    };

    const onKeyDown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handler(e);
      }
    };

    return { onClick: handler, onKeyDown };
  })();

  return (
    <div className="mb-3">
      <GradientCardShell bg={bg}>
        <div className="relative" style={{ transformStyle: "preserve-3d" }}>
          {/* Clickable overlay */}
          <div
            role="button"
            tabIndex={0}
            onClick={overlayHandlers.onClick}
            onKeyDown={overlayHandlers.onKeyDown}
            data-allow-drag="true"
            className="absolute inset-0 z-20 rounded-[22px] focus:outline-none"
            aria-label={`Open wallet ${card.title || card.walletName || card.id}`}
          />

          <div>
            <CardTopBar
              title={card.title}
              type={card.type}
              isMain={card?.defaultForUser === true}
              // original used onBadgeClick={() => goTo(idx)} but idx/goTo not available here
              onBadgeClick={() => {}}
            />
            {card.walletName &&
              String(card.walletName).trim().toUpperCase() !== "MAIN" && (
                <div className="absolute top-0 right-4 z-10 text-white font-semibold text-sm md:text-base leading-none pointer-events-none flex flex-col items-end space-y-1">
                  <div className="mt-2 text-right w-full">{card.walletName}</div>
                </div>
              )}
          </div>

          <div className="relative z-10">
            <BalanceRow amount={card.balance} isHidden={isHidden} onToggleHidden={() => setIsHidden(v => !v)} />
          </div>
        </div>
      </GradientCardShell>
    </div>
  );
}
