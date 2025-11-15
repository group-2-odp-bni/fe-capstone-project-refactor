import React, { useState } from "react";
import { GradientCardShell, BalanceRow, PillBadge } from "../ui/BalanceCardUI";

const humanizeType = (t) => {
  if (!t) return "";
  const up = String(t).toUpperCase();
  if (up === "PERSONAL") return "Personal";
  if (up === "SHARED") return "Shared";
  return t;
};

export default function BalanceCard({
  title,
  balance,
  bg,
  accent,
  type,
  isMain,
}) {
  const [isHidden, setIsHidden] = useState(false);
  const outerGlow = `0 10px 28px rgba(0,0,0,0.22), 0 0 24px ${
    accent || "#000"
  }55, 0 0 64px ${accent || "#000"}33`;

  if (!title) {
    return (
      <div className="h-[150px] w-full bg-gray-200 rounded-2xl animate-pulse" />
    );
  }
  const badgeLabel = isMain ? "Utama" : humanizeType(type);

  return (
    <GradientCardShell bg={bg} outerGlow={outerGlow}>
      <div className="relative z-10 flex justify-between items-start mb-5 md:mb-10">
        <div className="flex items-center space-x-3 mt-1 mb-2">
          <img
            src="/orangepay_card.svg"
            alt="RangePay Logo"
            className="h-5 md:h-6 w-auto drop-shadow"
          />
          <PillBadge
            label={badgeLabel}
            active={!!isMain}
            style={{ transform: "translateZ(35px)" }}
          />
          {/* <CTASection links={links} walletId={selectedCard.id} type={selectedCard.type} /> */}
        </div>
      </div>

      <div className="absolute top-4 right-4 z-20 text-white font-semibold text-sm md:text-base leading-none">
        {title}
      </div>
      <BalanceRow
        amount={balance}
        isHidden={isHidden}
        onToggleHidden={() => setIsHidden(!isHidden)}
      />
    </GradientCardShell>
  );
}
