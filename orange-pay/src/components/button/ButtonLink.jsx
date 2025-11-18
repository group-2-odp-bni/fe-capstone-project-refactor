import React from "react";

export default function ButtonLink({ onClick, children, className = "", isDisabled = false }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isDisabled}
            className={`block mx-auto
                ${isDisabled ? "text-[#4f5859]" : "text-[#1C6C79] font-semibold hover:underline"}
                ${className} `}
        >
            {children}
        </button>
    );
}
