import React from "react";

export default function AccountButtonLink({ onClick, children, className = "" }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full flex justify-between items-center px-4 py-3 mb-3 
                  text-left rounded-xl text-sm
                  bg-transparent hover:bg-gray-100 
                  transition-colors duration-200 ${className}`}
        >
            <span>{children}</span>
            <span className="text-gray-400 text-lg">›</span>
        </button>
    );
}
