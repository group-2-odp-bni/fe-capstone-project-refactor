import React from "react";
import { CheckCircle } from "lucide-react";

export default function SuccessIcon({
    size = 159,
    message = "Success!",
    className = "",
    textClassName = "",
}) {
    return (
        <div className={`mt-10 mb-10 flex flex-col items-center justify-center ${className}`}>
            <CheckCircle className="text-green-500" size={size} />
            <p className={`text-center text-gray-700 text-lg font-medium ${textClassName}`}>
                {message}
            </p>
        </div>
    );
}
