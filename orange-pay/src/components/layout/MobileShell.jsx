import React from "react";
import clsx from "clsx";

export default function MobileShell({ children, className }) {
  return (
    <div
      className={clsx(
        "relative w-full h-dvh max-w-[400px] bg-white",
        "",
        " flex-1 overflow-y-auto overscroll-contain scroll-smooth",
        className
      )}
    >
      {children}
    </div>
  );
}
