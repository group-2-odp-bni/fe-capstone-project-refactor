import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useCardBalances from "../../hooks/api/useCardBalances";
import { GradientCardShell, BalanceRow, PillBadge } from "../ui/BalanceCardUI";

export default function Wallets() {
  const navigate = useNavigate();
  const { items: wallets, loading, error } = useCardBalances();

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

  return (
    <div className="space-y-3 p-5">

      {wallets
        .filter((w) => !w.isAddCard)
        .map((wallet) => (
          <WalletCardInline
            key={wallet.id}
            card={wallet}
            humanizeType={humanizeType}
            onClick={() => handleWalletClick(wallet.id)}
          />
        ))}
    </div>
  );
}

/* -------------------------------------------------
   INLINE WALLET CARD — FIXED VERSION
--------------------------------------------------- */
function WalletCardInline({ card, onClick, humanizeType }) {
  const [isHidden, setIsHidden] = useState(false);

  const formatIDR = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const bg = card.bg || "linear-gradient(135deg, #4a4a4a, #222)";
  const badgeLabel = card.isMain ? "Utama" : humanizeType(card.type);

  return (
    <GradientCardShell
      bg={bg}
      onClick={onClick}
      className="w-full min-h-[110px] p-4 cursor-pointer text-white relative"
    >
      {/* TOP LEFT: LOGO + BADGE */}
      <div className="relative z-10 flex items-center space-x-3 mb-4">
        <img
          src="/orangepay_card.svg"
          alt="RangePay Logo"
          className="h-5 md:h-6 w-auto drop-shadow"
        />
        <PillBadge label={badgeLabel} active={!!card.isMain} />
      </div>

      {/* TOP RIGHT: TITLE */}
      <div className="absolute top-4 right-4 z-20 font-semibold text-sm md:text-base leading-none">
        {card.title}
      </div>

      {/* BALANCE ROW */}
      <BalanceRow
        amount={card.balance}
        isHidden={isHidden}
        onToggleHidden={() => setIsHidden(!isHidden)}
      />
    </GradientCardShell>
  );
}
