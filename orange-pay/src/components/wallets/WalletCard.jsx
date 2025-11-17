import React from "react";

export default function WalletCard({ card, onClick }) {
  const formatIDR = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Math.round(Number(value || 0)));

  return (
    <article
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      aria-label={card.title}
      className={`
        w-full min-h-[110px] p-4 rounded-xl cursor-pointer
        text-white flex justify-between items-end
        ${card.isAddCard ? "bg-gray-700" : ""}
      `}
      style={card.bg ? { background: card.bg } : {}}
    >
      {/* LEFT SIDE */}
      <div className="flex flex-col justify-between">
        <div className="bg-white/20 px-2 py-1 rounded text-[10px] font-semibold">
          RANGE-PAY
        </div>

        <div className="font-semibold">
          {card.isAddCard ? "+ Add wallet" : formatIDR(card.balance)}
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex flex-col items-end gap-1">
        {!card.isAddCard ? (
          <>
            <div className="bg-white/20 text-xs py-1 px-3 rounded-full font-medium whitespace-nowrap">
              {card.type}
            </div>

            <div className="text-[13px] font-semibold text-right leading-tight max-w-[130px]">
              {card.title}
            </div>
          </>
        ) : null}
      </div>
    </article>
  );
}
