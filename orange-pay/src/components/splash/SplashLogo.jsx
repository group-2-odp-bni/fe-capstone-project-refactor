import React from "react";
import OrangePayLogo from "../register/OrangePayLogo";

export default function SplashLogo({
  motto = "One wallet, endless possibilities."
}) {
  return (
    <div className="w-full flex flex-col items-center text-center">
      <OrangePayLogo size={96} />

      <p className="mt-3 text-[clamp(12px,3.6vw,14px)] text-white/90 italic">
        “{motto}”
      </p>
    </div>
  );
}
