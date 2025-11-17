// src/components/wallets/WalletList.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import useCardBalances from "../../hooks/api/useCardBalances";
import WalletCard from "./WalletCard";

export default function WalletList() {
  const navigate = useNavigate();
  const { items: wallets, loading, error } = useCardBalances();

  const handleWalletClick = (id) => navigate(`/app/wallets/${id}`);

  if (loading)
    return <p className="text-sm text-gray-500 p-3">Loading wallets...</p>;

  if (error)
    return (
      <p className="text-sm text-red-500 p-3">Error loading wallets: {error}</p>
    );

  return (
    <div className="w-full mt-2">
      <div className="flex flex-col gap-3 p-5">
        {/* Render wallets */}
        {wallets
          .filter((w) => !w.isAddCard)
          .map((w) => (
            <WalletCard
              key={w.id}
              card={w}
              onClick={() => handleWalletClick(w.id)}
            />
          ))}
      </div>
    </div>
  );
}
