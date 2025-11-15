import React from "react";

export default function ButtonLink({ onClick, children, className = "" }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`block mx-auto text-[#1C6C79] font-semibold hover:underline ${className}`}
        >
            {children}
        </button>
    );
}
