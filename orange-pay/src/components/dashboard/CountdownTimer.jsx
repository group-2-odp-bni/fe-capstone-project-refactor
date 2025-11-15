// CountdownTimer.jsx
export default function CountdownTimer({ initialSeconds, className = "" }) {
  const formatTimer = (secs) => {
    const days = Math.floor(secs / 86400);
    const hours = Math.floor((secs % 86400) / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;

    if (days > 0) {
      return `${days}d ${String(hours).padStart(2, "0")}j : ${String(
        minutes
      ).padStart(2, "0")}m : ${String(seconds).padStart(2, "0")}d`;
    }

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}j : ${String(
        minutes
      ).padStart(2, "0")}m : ${String(seconds).padStart(2, "0")}d`;
    }

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  return (
    <p className={`text-center text-gray-500 font-medium ${className}`}>
      {formatTimer(initialSeconds)}
    </p>
  );
}
