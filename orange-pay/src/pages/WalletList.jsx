// src/pages/WalletsPage.jsx
import React from "react";
import WalletList from "../components/wallets/WalletList";
import Header from "../components/Header";

export default function WalletsPage() {
  return (
    <div className="page-wallets" style={{ padding: 8 }}>
    <Header title="Wallet Anda"  showBack centerTitle />

      {/* The container component handles loading/error and list render */}
      <WalletList />
    </div>
  );
}
