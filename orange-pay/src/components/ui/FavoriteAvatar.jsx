// src/components/ui/FavoriteAvatar.jsx
import React from "react";

/**
 * Props:
 * - name: full name string
 * - onClick: function
 * - size: "sm" | "md" | "lg" (optional)
 */
export default React.memo(function FavoriteAvatar({ name = "", onClick = () => {}, size = "md" }) {
  const firstName = (name || "").split(" ")[0] || "";
  const initial = (firstName[0] || "").toUpperCase() || "U";

  const sizeMap = {
    sm: { avatar: "h-8 w-8 text-sm", label: "text-xs" },
    md: { avatar: "h-10 w-10 text-sm", label: "text-xs" },
    lg: { avatar: "h-12 w-12 text-base", label: "text-sm" },
  };

  const s = sizeMap[size] || sizeMap.md;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 w-20 text-center focus:outline-none"
      aria-label={`Favorite ${name}`}
      title={name}
    >
      <div className={["mx-auto flex items-center justify-center rounded-full bg-orange-100 text-orange-700 font-semibold", s.avatar].join(" ")}>
        {initial}
      </div>
      <div className={["mt-2 truncate text-gray-700", s.label].join(" ")}>
        {firstName}
      </div>
    </button>
  );
})
