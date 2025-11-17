import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { clarityPageview } from "../util/clarity";

export default function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    clarityPageview();
  }, [location.pathname]);

  return null;
}
