import React from "react";

export default function SplashLogo({
  title = "RANGE-PAY",
  motto = "One wallet, endless possibilities.",
}) {
  return (
    <div className="w-full flex flex-col items-center text-center">
      <img
        src="/Orangepay.png"
        alt="RANGE-PAY logo"
        className="mx-auto h-[84px] w-[84px] sm:h-[96px] sm:w-[96px] 
                   object-contain animate-splash-pop"
        onError={(e) => (e.currentTarget.style.display = "none")}
      />

      <h1
        className="mt-4 font-extrabold tracking-wide text-slate-900 
                     text-[clamp(22px,5vw,32px)] drop-shadow-sm"
      >
        {title}
      </h1>

      <p className="mt-1 text-[clamp(12px,3.6vw,14px)] text-white/90 italic">
        “{motto}”
      </p>
    </div>
  );
}
