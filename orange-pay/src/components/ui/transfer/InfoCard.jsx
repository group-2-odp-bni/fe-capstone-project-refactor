// src/components/ui/InfoCard.jsx
import React from "react";

/**
 * InfoCard
 *
 * Props:
 * - label: string (renders the small label above the card)
 * - loading: boolean
 * - error: string | null
 * - children: normal content (used when not loading/error)
 * - placeholder: string shown when no children/content
 * - className: extra classes for the outer card
 *
 * Pure presentational component.
 */
export default function InfoCard({
  label,
  loading = false,
  error = null,
  children,
  placeholder = "—",
  className = "",
}) {
  return (
    <div className={`mb-5 ${className}`}>
      {label && <div className="text-sm text-gray-500 mb-2">{label}</div>}
      <div className="mb-5 p-4 border rounded-xl bg-white shadow-sm border-gray-200">
        {loading ? (
          <div className="text-sm text-gray-500">Resolving recipient…</div>
        ) : error ? (
          <div className="text-sm text-red-500">Error: {error}</div>
        ) : children ? (
          children
        ) : (
          <div className="text-sm text-gray-700">{placeholder}</div>
        )}
      </div>
    </div>
  );
}
