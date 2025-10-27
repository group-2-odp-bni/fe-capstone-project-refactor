import React from "react";

const SIZE = {
  xs: { icon: 20, text: "text-lg" },
  sm: { icon: 24, text: "text-xl" },
  md: { icon: 32, text: "text-2xl" },
  lg: { icon: 40, text: "text-3xl" },
};

export default function BrandLogo({
  size = "md",
  align = "center",
  wordmark = true,
  className = "",
}) {
  const s = SIZE[size] ?? SIZE.md;

  return (
    <div
      className={`flex items-center ${
        align === "center" ? "justify-center" : ""
      } gap-2 ${className}`}
    >
      <img
        src="/logo512.png"
        alt="Range-Pay"
        width={s.icon}
        height={s.icon}
        className="object-contain shrink-0"
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
      {wordmark && (
        <span
          className={`font-extrabold tracking-wide text-slate-900 ${s.text}`}
        >
          RANGE-PAY
        </span>
      )}
    </div>
  );
}
