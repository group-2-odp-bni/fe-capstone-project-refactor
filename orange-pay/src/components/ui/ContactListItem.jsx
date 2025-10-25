// src/components/ui/ContactListItem.jsx
import React from "react";

/**
 * Single contact row for lists.
 * Props:
 * - contact: { name, phone, ... }
 * - onClick: handler receiving contact
 */
export default function ContactListItem({ contact, onClick }) {
  const name = contact?.name || "Unknown";
  const phone = contact?.phone || "-";
  const initial = (name || "U").split(" ")[0][0]?.toUpperCase() || "U";

  return (
    <button
      onClick={() => onClick(contact)}
      className="w-full text-left py-3 flex items-center justify-between border-b border-gray-50 hover:bg-gray-50"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
          {initial}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">{name}</div>
          <div className="text-xs text-gray-500">{phone}</div>
        </div>
      </div>
    </button>
  );
}
