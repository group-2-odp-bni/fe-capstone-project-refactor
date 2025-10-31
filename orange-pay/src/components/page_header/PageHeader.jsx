import React from "react";
import BackButton from "../common/BackButton";
import clsx from "clsx"; // optional but neat for merging class names

export default function PageHeader({ children, className = "" }) {
  return (
    <header
      className={clsx(
        "relative flex items-center justify-center w-full py-4 bg-white",
        className
      )}
    >
      <div className="absolute left-4">
        <BackButton />
      </div>
      <h1 className="text-xl font-semibold text-gray-800 text-center">
        {children}
      </h1>
    </header>
  );
}
