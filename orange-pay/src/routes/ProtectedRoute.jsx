import React, { useEffect, useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { validateAccessToken } from "../services/auth/authService";

export default function ProtectedRoute() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const valid = await validateAccessToken();
        if (!isMounted) return;
        setAuthed(Boolean(valid));
      } catch (err) {
        console.error("ProtectedRoute: validateAccessToken error:", err);
        if (!isMounted) return;
        setAuthed(false);
      } finally {
        if (isMounted) setChecking(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  if (checking)
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        Checking authentication...
      </div>
    );

  return authed ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
}
