import React, { useState, useEffect } from "react";

export default function CountdownTimer({ initialSeconds }) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  const formatTimer = (secs) => {
    const min = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const sec = (secs % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  };

  return (
    <p className="text-center text-gray-500 font-medium">
      {formatTimer(secondsLeft)}
    </p>
  );
}
