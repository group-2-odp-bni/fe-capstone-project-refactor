import React from "react";
import clsx from "clsx";

export default function NumberInputField({
    id,
    name,
    label,
    placeholder,
    value,
    onChange,
    error,
    className,
    required = false,
    readOnly = false,
}) {
    // Helper to format number like 1000000 → "Rp 1.000.000"
    const formatCurrency = (num) => {
        if (num === null || num === undefined || num === "") return "";
        const number = parseInt(num.toString().replace(/\D/g, ""), 10);
        if (isNaN(number)) return "";
        return "Rp " + number.toLocaleString("id-ID");
    };

    // Handle input change (strip formatting before passing value up)
    const handleChange = (e) => {
        const rawValue = e.target.value.replace(/\D/g, ""); // only digits
        onChange({
            target: {
                name,
                value: rawValue ? parseInt(rawValue, 10) : "",
            },
        });
    };

    return (
        <div className={clsx("w-full text-base", className)}>
            {label && (
                <label
                    htmlFor={id || name}
                    className="block text-sm font-medium text-gray-600 mb-1"
                >
                    {label}
                    {required && <span className="text-red-500"> *</span>}
                </label>
            )}

            <input
                id={id || name}
                name={name || id}
                type="text"
                placeholder={placeholder || "Rp 0"}
                value={formatCurrency(value)}
                onChange={handleChange}
                required={required}
                readOnly={readOnly}
                className={clsx(
                    "mb-4 w-full bg-gray-50 text-gray-800 border border-gray-200 rounded-lg p-3",
                    "focus:outline-none focus:border-[#FF9A25] focus:ring-1 focus:ring-[#FF9A25]",
                    "transition-all",
                    error && "border-red-500 focus:ring-red-500 focus:border-red-500",
                    !readOnly && "bg-white"
                )}
            />

            {error && <p className="text-red-500 mt-1 text-sm">{error}</p>}
        </div>
    );
}
