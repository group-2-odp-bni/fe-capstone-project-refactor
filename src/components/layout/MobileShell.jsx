import React from "react";
import clsx from "clsx";

export default function MobileShell({ children, className }) {
  return (
    <div
      className={clsx(
        "relative w-full h-dvh max-w-[393px] max-h-[852px]",
        "rounded-[28px] overflow-hidden shadow-[0_20px_60px_rgba(2,6,23,.18)]",
        "ring-1 ring-black/10 flex flex-col",
        className
      )}
    >
      {children}
    </div>
  );
}
