import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * Reusable header
 *
 * Props:
 *  - title: string (main title)
 *  - subtitle: string (optional subtitle)
 *  - showBack: boolean (show back button)
 *  - onBack: function (custom back handler)
 *  - right: React node (right-side element, e.g. icon/button)
 *  - className: string (extra classes for container)
 *  - centerTitle: boolean (center title)
 *  - backAriaLabel: string (aria label for back button)
 */
export default function Header({
  title = "",
  subtitle = "",
  showBack = true,
  onBack = null,
  right = null,
  className = "",
  centerTitle = true,
  backAriaLabel = "Back",
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof onBack === "function") return onBack();
    navigate(-1);
  };

  return (
    <header
      className={`sticky top-0 z-20 bg-white ${className}`}
      role="banner"
    >
      <div className="px-4 py-3 flex ">
        {/* left: back button or placeholder */}  
        <div className="w-10 flex justify-start">
          {showBack ? (
            <button
              onClick={handleBack}
              aria-label={backAriaLabel}
              className="p-1 rounded-full hover:bg-gray-100 active:scale-95 transition"
            >
              <svg
                width="22"
                height="18"
                viewBox="0 0 22 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-gray-900"
              >
                <path
                  d="M1.3999 9H20.5999M1.3999 9L9.3999 1M1.3999 9L9.3999 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : (
            <div aria-hidden="true" />
          )}
        </div>

        {/* center: title & subtitle */}
        <div className={`flex-1 ${centerTitle ? "text-center" : ""}`}>
          {title ? (
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          ) : (
            <div />
          )}
          {subtitle ? (
            <div className="text-xs text-gray-600 mt-0.5">{subtitle}</div>
          ) : null}
        </div>

        {/* right: custom node (kept with fixed width to balance layout) */}
        <div className="w-10 flex items-center justify-end">
          {right ? <div>{right}</div> : <div aria-hidden="true" />}
        </div>
      </div>
    </header>
  );
}
