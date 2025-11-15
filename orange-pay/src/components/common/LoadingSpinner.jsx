import React from "react";

export default function LoadingSpinner() {
  return (
    <div
      className="flex justify-center items-center py-10"
      aria-label="Loading..."
    >
      <div
        className="
          w-12 h-12 
          border-4 border-solid border-gray-200 
          border-t-orange-500 
          rounded-full 
          animate-spin
        "
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}
