import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useCardBalances from "../../hooks/api/useCardBalances";
import { GradientCardShell, BalanceRow, PillBadge } from "../ui/BalanceCardUI";
import SearchInput from "../ui/SearchInput";

export default function Wallets() {
  const navigate = useNavigate();
  const { items: wallets, loading, error } = useCardBalances();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL"); // 👈 NEW

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

  if (loading) return <div className="p-4 text-sm text-gray-500">Loading wallets...</div>;
  if (error) return <div className="p-4 text-sm text-red-600">Error loading wallets: {error}</div>;

  // 👇 Build available types based on wallet data
  const walletTypes = [
    "ALL",
    ...new Set(
      wallets
        .map((w) => humanizeType(w.type))
        .filter((t) => t && t.trim() !== "")
    ),
  ];


  // 🔍 FILTERING LOGIC
  const filteredWallets = wallets
    .filter((w) => !w.isAddCard)
    .filter((w) =>
      search.trim() === ""
        ? true
        : String(w.walletName || "").toLowerCase().includes(search.toLowerCase())
    )
    .filter((w) =>
      typeFilter === "ALL"
        ? true
        : humanizeType(w.type) === typeFilter
    );

  return (
    <div className="space-y-3 p-5">
      {/* 🔍 SEARCH BAR */}
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search wallet name..."
        inputMode="text"
      />

      {/* 🟠 TYPE FILTER BUTTONS */}
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

      {/* CARD LIST */}
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
--------------------------------------------------- */
function WalletCardInline({ card, onClick, humanizeType }) {
  const [isHidden, setIsHidden] = useState(false);

  const bg = card.bg || "linear-gradient(135deg, #4a4a4a, #222)";
  const badgeLabel = card.isMain ? "Utama" : humanizeType(card.type);

  return (
    <GradientCardShell
      bg={bg}
      onClick={onClick}
      className="w-full min-h-[110px] p-4 cursor-pointer text-white relative"
    >
      {/* TOP LEFT — Logo + Badge */}
      <div className="relative z-10 flex items-center space-x-3 mb-4">
        <img
          src="/orangepay_card.svg"
          alt="RangePay Logo"
          className="h-5 md:h-6 w-auto drop-shadow"
        />
        <PillBadge label={badgeLabel} active={!!card.isMain} />
      </div>

      {/* TOP RIGHT — Wallet Name */}
      {card.walletName &&
        String(card.walletName).trim().toUpperCase() !== "MAIN" && (
          <div className="absolute top-4 right-4 z-10 text-white font-semibold text-sm md:text-base leading-none">
            {card.walletName}
          </div>
        )}

      {/* BALANCE */}
      <BalanceRow
        amount={card.balance}
        isHidden={isHidden}
        onToggleHidden={() => setIsHidden(!isHidden)}
      />
    </GradientCardShell>
  );
}
