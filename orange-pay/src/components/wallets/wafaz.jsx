const navigate = useNavigate();
const { items, loading, error, refetch } = useCardBalances();

const handleCardClick = (card) => {
  const historyLink = card.links?.history || card.links?.transfer || `/app/wallets/${card.id}`;
  const path = historyLink.replace(":walletId", card.id).replace(":walletIds", card.id);
  navigate(path);
};

return (
  <div className="wallet-list-root">
    {loading && (
      <div className="skeleton-list">
        <div className="card-skeleton" />
        <div className="card-skeleton" />
        <div className="card-skeleton" />
        <div className="card-skeleton" />
      </div>
    )}

    {error && (
      <div className="error-row">
        <span>{String(error)}</span>
        <button onClick={refetch}>Retry</button>
      </div>
    )}

    <div className="wallet-cards">
      {items.map((card) => (
        <WalletCard key={card.id || card.title || Math.random()} card={card} onClick={() => handleCardClick(card)} />
      ))}
    </div>
  </div>
);