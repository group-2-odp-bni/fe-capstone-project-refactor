import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SplashLogo from "../components/splash/SplashLogo";
import { getAccessToken } from "../services/auth/authService";

export default function SplashPage() {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 2300);
    const goTimer = setTimeout(() => {
      const token = getAccessToken();

      if (token) {
        navigate("/app/dashboard");
      } else {
        navigate("/welcome");
      }
    }, 3000);
    // const goTimer = setTimeout(() => navigate("/app/dashboard"), 3000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(goTimer);
    };
  }, [navigate]);

  return (
    <div className="min-h-dvh w-full bg-slate-100 flex items-center justify-center">
      <div
        className={`absolute inset-0 
                  flex items-center justify-center
                  px-6 pt-[env(safe-area-inset-top)]
                  pb-[env(safe-area-inset-bottom)]
                  transition-opacity duration-700
                  ${fadeOut ? "opacity-0" : "opacity-100"}`}
        style={{
          background: "linear-gradient(to bottom, #FF9A25, #FF8F0E)",
        }}
      >
        <div className="w-full text-center">
          <SplashLogo />
          <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-white/25">
            <div className="h-full bg-white/90 animate-splash-progress" />
          </div>
        </div>
      </div>
    </div>
  );
}
