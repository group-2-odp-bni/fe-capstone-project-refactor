import { useCallback } from "react";
import { clarityEvent } from "../util/clarity";

export default function useTrack(prefix = "") {
  return useCallback(
    (name, data) => {
      const eventName = prefix ? `${prefix}_${name}` : name;
      clarityEvent(eventName, data);
    },
    [prefix]
  );
}
