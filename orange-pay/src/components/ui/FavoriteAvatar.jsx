// src/components/ui/FavoriteAvatar.jsx
import React from "react";

/**
 * Avatar used in the favorites horizontal strip.
 * Props:
 * - initials: string (one or two chars)
 * - label: string shown under avatar
 * - onClick: handler
 */
export default function FavoriteAvatar({ initials = "U", label = "User", onClick }) {
  return (
    <button onClick={onClick} className="flex-shrink-0 w-20 text-center">
      <div className="mx-auto h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-sm font-semibold text-orange-700">
        {initials}
      </div>
      <div className="mt-2 text-xs text-gray-700 truncate">{label}</div>
    </button>
  );
}
