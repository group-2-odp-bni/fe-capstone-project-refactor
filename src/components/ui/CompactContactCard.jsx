// src/components/ui/CompactContactCard.jsx
import React from "react";

/**
 * Small clickable card shown when query isn't found in saved contacts.
 * Props:
 * - title, subtitle: strings
 * - onClick: handler
 */
export default function CompactContactCard({
  title = "Not in your contact",
  subtitle = "Click here to transfer to Orange-Pay",
  onClick,
}) {    
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      className="cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md focus:outline-none"
      style={{ maxWidth: 560 }}
    >
      <div className="font-medium text-sm">{title}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}
