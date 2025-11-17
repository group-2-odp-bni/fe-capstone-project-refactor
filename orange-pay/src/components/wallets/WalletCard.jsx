import React from "react";

/**
 * Presentational wallet card.
 * Props:
 *  - card: object returned from mapWalletToCard
 *  - onClick: function
 */
export default function WalletCard({ card, onClick }) {
  const formatIDR = (value) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
      Math.round(Number(value || 0))
    );

  return (
    <article
      className={`wallet-card ${card.isAddCard ? "add-card" : ""}`}
      style={card.bg ? { background: card.bg } : {}}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      aria-label={card.title}
    >
      <div className="card-left">
        <div className="brand">
          <div className="brand-badge">RANGE-PAY</div>
        </div>

        <div className="balance">
          {card.isAddCard ? <span>+ Add wallet</span> : <span>{formatIDR(card.balance)}</span>}
        </div>
      </div>

      <div className="card-right">
        {!card.isAddCard ? (
          <>
            <div className="type-pill">{card.type}</div>
            <div className="wallet-name">{card.title}</div>
          </>
        ) : (
          <div className="wallet-name">Add Wallet</div>
        )}
      </div>
    </article>
  );
}
