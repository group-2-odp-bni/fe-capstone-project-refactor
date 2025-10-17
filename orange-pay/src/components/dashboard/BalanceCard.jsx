import {
    EyeIcon,
    ArrowRightIcon,
    EyeSlashIcon,
  } from "@heroicons/react/24/outline";
  import { useState, useRef, useEffect } from "react";
  import { Link } from "react-router-dom";
  
  export default function BalanceCard() {
    const [isHidden, setIsHidden] = useState(false);
    const [textWidth, setTextWidth] = useState(0);
    const textRef = useRef(null);
  
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
  
    const formattedBalance = `Rp${balance.toLocaleString("id-ID")}`;
    const masked = "*".repeat(formattedBalance.replace("Rp", "").length);
  
    // Simulate API load
    useEffect(() => {
      setLoading(true);
      const timer = setTimeout(() => {
        setBalance(385000); 
        setLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }, []);
  
    // Hitung lebar teks balance setelah font siap
    useEffect(() => {
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
    }, [formattedBalance]);
  
    return (
      <div
        className="relative w-full max-w-md text-white rounded-2xl p-6"
        style={{
          background:
            "linear-gradient(101.06deg, #2F5755 23.71%, #1A3A38 60.76%, #041D1C 97.82%)",
        }}
      >
        {/* === Top Section === */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <img
              src="/orangepay_card.svg"
              alt="RangePay Logo"
              className="h-4.1 w-auto"
            />
          </div>
  
          {/* === Action Buttons (SVG intact ✅) === */}
          <div className="flex space-x-4">
            <button className="flex flex-col items-center text-[10px] text-white/80 hover:text-white active:text-black transition">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
                className="w-5 h-5 mb-[2px]"
              >
                <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2ZM12 8a1 1 0 0 1 1 1v2h2a1 1 0 0 1 0 2h-2v2a1 1 0 0 1-2 0v-2h-2a1 1 0 0 1 0-2h2V9a1 1 0 0 1 1-1Z" />
              </svg>
              <span className="leading-tight">Top-up</span>
            </button>
  
            <Link to="/app/transfer">
              <button className="flex flex-col items-center text-[10px] text-white/80 hover:text-white active:text-black transition">
                <svg
                  width="20"
                  height="23"
                  viewBox="0 0 20 23"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 mb-[2px]"
                >
                  <path d="M19.6877 0.359167C19.5416 0.191978 19.3564 0.0766741 19.1545 0.0271745C18.9525 -0.0223251 18.7423 -0.00392698 18.5492 0.0801298L0.690399 7.81817H0.686828C0.480918 7.90885 0.304472 8.0701 0.181598 8.27983C0.058724 8.48961 -0.0046263 8.73764 0.000263153 8.9902C0.00515261 9.24266 0.0780267 9.48729 0.208852 9.69059C0.339761 9.8939 0.522244 10.046 0.73147 10.1262L0.749753 10.1328L6.87934 13.1292C6.9989 13.1707 7.1259 13.1757 7.24767 13.1434C7.36935 13.1113 7.4816 13.0431 7.57309 12.9457L17.4108 2.45197C17.4402 2.41844 17.4749 2.39181 17.5132 2.37366C17.5515 2.35546 17.5926 2.34611 17.634 2.34611C17.6755 2.34611 17.7165 2.35546 17.7548 2.37366C17.7931 2.39181 17.828 2.41844 17.8573 2.45197C17.8866 2.48556 17.9098 2.52537 17.9257 2.56922C17.9415 2.61308 17.9497 2.66005 17.9497 2.7075C17.9497 2.75496 17.9415 2.80197 17.9257 2.84583C17.9098 2.88963 17.8866 2.9295 17.8573 2.96303L8.6901 14.2198C8.60506 14.3246 8.5455 14.4531 8.5174 14.5925C8.48925 14.7318 8.49354 14.8772 8.52981 15.014L11.1482 22.0351C11.1509 22.0453 11.1535 22.0545 11.1567 22.0642C11.2995 22.538 11.6611 22.8722 12.0982 22.8947H12.1429C12.3635 22.8961 12.5794 22.8216 12.7625 22.6807C12.9457 22.5397 13.0875 22.339 13.1696 22.1046L19.9283 1.66597C20.0027 1.4448 20.0197 1.20368 19.977 0.971755C19.9342 0.739881 19.8338 0.527086 19.6877 0.359167Z" />
                </svg>
                <span className="leading-tight">Transfer</span>
              </button>
            </Link>
          </div>
        </div>
  
        {/* === Balance Display === */}
        <div className="flex items-center -space-y-7 space-x-0.5 mb-3">
          <div
            style={{ width: `${textWidth}px` }}
            className="relative overflow-hidden"
          >
            <span
              ref={textRef}
              className="absolute opacity-0 text-2xl font-bold font-[Poppins]"
            >
              {formattedBalance}
            </span>
  
            {loading ? (
              <div className="h-7 w-32 bg-white/20 rounded animate-pulse" />
            ) : (
              <span className="text-2xl font-bold font-[Poppins] transition-all duration-200">
                {isHidden ? `Rp${masked}` : formattedBalance}
              </span>
            )}
          </div>
  
          {!loading && (
            <button onClick={() => setIsHidden(!isHidden)}>
              {isHidden ? (
                <EyeSlashIcon className="w-6 h-4 text-white/70" />
              ) : (
                <EyeIcon className="w-6 h-4 text-white/" />
              )}
            </button>
          )}
        </div>
  
        {/* === CTA === */}
        <div className="flex justify-end">
          <Link to="/app/transactions">
            <button className="bg-amber-400 text-black px-2 py-1 rounded-full font-medium text-[10px] hover:bg-amber-300 transition flex items-center space-x-1 scale-100">
              <span>How much you’ve spent</span>
              <ArrowRightIcon className="w-3 h-3" />
            </button>
          </Link>
        </div>
      </div>
    );
  }
  