// src/pages/SplashPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SplashLogo from "../components/splash/SplashLogo";

export default function SplashPage() {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 2300);
    const goTimer = setTimeout(() => navigate("/app/dashboard"), 3000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(goTimer);
    };
  }, [navigate]);

  return (
    <div className="min-h-dvh w-full bg-slate-100 flex items-center justify-center p-4">
      <div
        className={`relative w-full h-dvh max-w-[393px] max-h-[852px]
                    rounded-[28px] shadow-[0_20px_60px_rgba(2,6,23,.18)]
                    ring-1 ring-black/10 overflow-hidden
                    transition-opacity duration-700 ${
                      fadeOut ? "opacity-0" : "opacity-100"
                    }`}
      >
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#FF9A25] to-[#ff8f0e]
                        flex items-center justify-center
                        px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
        >
          <div className="w-full text-center">
            <SplashLogo />
            <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-white/25">
              <div className="h-full bg-white/90 animate-splash-progress" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
