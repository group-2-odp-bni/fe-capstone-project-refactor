import { useEffect, useState } from "react";

export function useCountdown(initialSeconds) {
    const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

    useEffect(() => {
        if (secondsLeft <= 0) return;

        const timer = setInterval(() => {
            setSecondsLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [secondsLeft]);

    const reset = () => setSecondsLeft(initialSeconds);

    return { secondsLeft, reset };
}
