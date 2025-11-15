import React from "react";

export default function ToggleSwitch({ name, enabled, onToggle, disabled = false }) {
    return (
        <div className="flex justify-end">
            <input type="hidden" name={name} value={enabled} />
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && onToggle(!enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${enabled ? "bg-orange-500" : "bg-gray-300"}
                    ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${enabled ? "translate-x-6" : "translate-x-1"}
                    `}
                />
            </button>
        </div>
    );
}
