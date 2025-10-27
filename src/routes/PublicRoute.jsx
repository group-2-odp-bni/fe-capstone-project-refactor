import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../services/authService";

/**
 * Synchronous PublicRoute
 * Immediately checks auth synchronously (no spinner) and either redirects
 * authenticated users to `redirectTo` or renders children for guests.
 */
export default function PublicRoute({ children, redirectTo = "/app/dashboard" }) {
  const location = useLocation();

  let authed = false;
  try {
    // isAuthenticated MUST be synchronous (reads sessionStorage/token)
    authed = Boolean(isAuthenticated());
  } catch (err) {
    console.error("PublicRoute: isAuthenticated threw, treating as unauthenticated", err);
    authed = false;
  }

  if (authed) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return children;
}
