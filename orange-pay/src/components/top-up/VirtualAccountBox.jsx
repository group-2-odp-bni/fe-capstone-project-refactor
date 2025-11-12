import { useState } from "react";
import MobileView from "../view/MobileView";

export default function VirtualAccountBox({ vaNumber }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!vaNumber) return;
    try {
      await navigator.clipboard.writeText(vaNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <div className="mt-4 relative">
      <div className="rounded-2xl px-4 py-3 text-center bg-white  border border-gray-300 mt-5 mb-5">
        {/* Number and Copy Icon */}
        <div className="flex items-center justify-center gap-2">
          <span className="font-extrabold tracking-wide text-gray-900 text-lg">
            {vaNumber || "—"}
          </span>

          {/* Clickable Copy SVG */}
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-gray-100 rounded-md transition"
            aria-label="Copy VA number"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`text-gray-500 ${copied ? "text-green-600" : "hover:text-gray-700"}`}
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        </div>

        {/* Copied Badge */}
        <div
          className={`absolute inset-x-0 top-0 flex justify-center transition-all duration-300 ${
            copied ? "opacity-100 -translate-y-6" : "opacity-0 translate-y-0"
          }`}
        >
          <div className="bg-[#10B981] text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm animate-fade-in-out">
            ✅ Copied!
          </div>
        </div>
      </div>

      {/* Copy animation */}
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(10px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        .animate-fade-in-out {
          animation: fadeInOut 1.8s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}
