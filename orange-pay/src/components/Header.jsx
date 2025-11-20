import React from "react";
import { useNavigate } from "react-router-dom";

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

  const handleBack = (e) => {
    // defensive: avoid interfering with other handlers
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (typeof onBack === "function") return onBack();
    navigate(-1);
  };

  return (
    <header
      className={`sticky top-0 z-50 bg-white ${className}`} // bumped z-index
      role="banner"
      style={{ pointerEvents: "auto", WebkitTapHighlightColor: "transparent" }}
    >
      <div className="px-4 py-3 pt-5 flex items-center">
        {/* left: back button or placeholder */}
        <div className="w-10 flex justify-start">
          {showBack ? (
            <button
              type="button"
              onClick={handleBack}
              className="relative w-14 h-14 flex items-center justify-center"
              aria-label={backAriaLabel}
            >
              {/* invisible hitbox */}
              <span className="absolute inset-0" />

              {/* visible icon */}
              <svg
                width="22"
                height="18"
                viewBox="0 0 22 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-gray-900"
                style={{ pointerEvents: "none" }} // svg won't steal taps
              >
                <path
                  d="M1.4 9H20.6M1.4 9L9.4 1M1.4 9L9.4 17"
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

        {/* right: custom node */}
        <div className="w-10 flex items-center justify-end">
          {right ? <div>{right}</div> : <div aria-hidden="true" />}
        </div>
      </div>
    </header>
  );
}
