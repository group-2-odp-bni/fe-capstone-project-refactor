import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthenticated } from "../services/authService";

export default function ProtectedRoute() {
  const authed = isAuthenticated();
  const loc = useLocation();
  return authed ? <Outlet /> : <Navigate to="/login" replace state={{ from: loc }} />;
}
