import {
    EyeIcon,
    EyeSlashIcon,
  } from "@heroicons/react/24/outline";
  import { useState, useRef, useEffect } from "react";
  
  export default function BalanceCardHistory() {
    const [isHidden, setIsHidden] = useState(false);
    const [textWidth, setTextWidth] = useState(0);
    const textRef = useRef(null);
  
    // === Simulate API State ===
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0); // ✅ number only
  
    // Simulate API fetch
    useEffect(() => {
      setTimeout(() => {
        setBalance(385000); // ✅ number
        setLoading(false);
      }, 1500);
    }, []);
  
    // Format balance for display
    const formattedBalance = `Rp${balance.toLocaleString("id-ID")}`;
  
    // Mask only digits (same number of digits as the number)
    const masked = "*".repeat(balance.toString().length);
  
    // Measure width AFTER balance is loaded & font ready
    useEffect(() => {
      if (!loading && balance) {
        const handleFontLoad = () => {
          if (textRef.current) {
            setTextWidth(textRef.current.offsetWidth);
          }
        };
  
        if (document.fonts) {
          document.fonts.ready.then(handleFontLoad);
        } else {
          handleFontLoad();
        }
      }
    }, [balance, loading]);
  
    return (
      <div
        className="relative w-full max-w-md text-white rounded-2xl p-6"
        style={{
          background:
            "linear-gradient(101.06deg, #2F5755 23.71%, #1A3A38 60.76%, #041D1C 97.82%)",
        }}
      >
        {/* === Top Section: Logo === */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <img
              src="/orangepay_card.svg"
              alt="RangePay Logo"
              className="h-4.1 w-auto"
            />
          </div>
        </div>
  
        {/* === Middle Section: Balance Display === */}
        <div className="flex items-center -space-y-7 space-x-0.5 mb-3">
          {loading ? (
            // === Loading Skeleton ===
            <div className="h-7 w-32 bg-white/20 rounded animate-pulse" />
          ) : (
            <>
              <div
                style={{ width: `${textWidth}px` }}
                className="relative overflow-hidden"
              >
                {/* Hidden span for width calculation */}
                <span
                  ref={textRef}
                  className="absolute opacity-0 text-2xl font-bold font-[Poppins]"
                >
                  {formattedBalance}
                </span>
  
                {/* Displayed text */}
                <span className="text-2xl font-bold font-[Poppins] transition-all duration-200">
                  {isHidden ? `Rp${masked}` : formattedBalance}
                </span>
              </div>
  
              {/* Eye toggle */}
              <button onClick={() => setIsHidden(!isHidden)}>
                {isHidden ? (
                  <EyeSlashIcon className="w-6 h-4 text-white/70" />
                ) : (
                  <EyeIcon className="w-6 h-4 text-white" />
                )}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
  