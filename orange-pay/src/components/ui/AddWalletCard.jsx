import React from "react";
import { Link } from "react-router-dom";

export default function AddWalletCard({
  onCreate,
  isCreating = false,
  to = "/app/wallets/new",
}) {
  const inner = (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 22,
        border: "2px dashed #D1D5DB",
        background: "#FFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        padding: 24,
        transition: "all 0.2s ease",
      }}
      className="hover:shadow-md active:scale-[.98]"
    >
      {isCreating ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 12,
              borderRadius: 9999,
              background: "#FFAE51",
              boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
              animation: "pulse 1s infinite",
            }}
          />
          <span style={{ color: "#FFAE51", fontWeight: 700, fontSize: 16 }}>
            Creating...
          </span>
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            color: "#FFAE51",
            fontWeight: 700,
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>＋</span>
          <span>Add New Wallet</span>
        </div>
      )}
    </div>
  );

  if (onCreate) {
    return (
      <button
        type="button"
        onClick={onCreate}
        disabled={isCreating}
        className="block w-full h-full p-0"
        style={{
          textDecoration: "none",
          background: "transparent",
          border: "none",
        }}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      to={to}
      className="block w-full h-full p-0"
      style={{ textDecoration: "none" }}
    >
      {inner}
    </Link>
  );
}
