// src/components/ui/ConfirmButton.jsx
import React from "react";

/**
 * Reusable Confirm Button
 *
 * Props:
 * - onClick: () => void
 * - disabled: boolean
 * - children: label (default: "Confirm")
 * - className: optional extra classes
 *
 * This component is purely presentational — no business logic.
 */
export default function ConfirmButton({
  onClick,
  disabled = false,
  children = "Confirm",
  className = "",
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-3 rounded-2xl text-lg font-medium transition ${className} ${
        disabled
          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
          : "bg-orange-400 text-white"
      }`}
    >
      {children}
    </button>
  );
}
