import React from "react";
import BackButton from "../common/BackButton";

export default function PageHeader ({ children }) {
  return (
    <header className="relative flex items-center justify-center w-full py-4 bg-white">
      <div className="absolute left-4">
        <BackButton/>
      </div>
      <h1 className="text-xl font-semibold text-gray-800 text-center">
        {children}
      </h1>
    </header>
  );
}
