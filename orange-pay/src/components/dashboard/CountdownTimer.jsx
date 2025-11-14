import React, { useState, useEffect } from "react";

export default function CountdownTimer({ initialSeconds, className = "" }) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft]);

  const formatTimer = (secs) => {
    const days = Math.floor(secs / 86400); // 24 * 60 * 60
    const hours = Math.floor((secs % 86400) / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;

    if (days > 0) {
      // Example: 1d 05:30:10
      return `${days}d ${hours.toString().padStart(2, "0")} j : ${minutes
        .toString()
        .padStart(2, "0")} j : ${seconds.toString().padStart(2, "0")} d`;
    }

    // No days → show HH:MM:SS or MM:SS if <1 hour
    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")} j : ${minutes
        .toString()
        .padStart(2, "0")} m : ${seconds.toString().padStart(2, "0")} d`;
    }

    // Under 1 hour → MM:SS
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <p className={`text-center text-gray-500 font-medium ${className}`}>
      {formatTimer(secondsLeft)}
    </p>
  );
}
