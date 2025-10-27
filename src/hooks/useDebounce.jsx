"use client";

import { useEffect, useState } from "react";

/**
 * useDebounce - keeps initial value immediately and debounces updates
 * @param {any} value
 * @param {number} delay
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // schedule update for subsequent changes
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
