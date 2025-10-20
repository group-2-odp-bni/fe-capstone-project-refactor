// src/routes/index.jsx
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import SplashPage from "../pages/SplashPage";
import RegisterPage from "../pages/RegisterPage";
import OtpRegisterPage from "../pages/OtpRegisterPage";
import SetPinPage from "../pages/SetPinPage";
import WelcomePage from "../pages/WelcomePage";
import LoginPage from "../pages/LoginPage";

import LoginPhone from "../components/login/LoginPhone";
import OtpStage from "../components/login/OtpStage";
import PinStage from "../components/login/PinStage";

import DashboardPage from "../pages/DashboardPage";
import HistoryTransactionPage from "../pages/HistoryTransactionPage";
import TopUpPage from "../pages/TopUpPage";

import { isAuthenticated } from "../services/authService";

/* login flow context & step guard */
import { LoginFlowProvider } from "../context/LoginFlowContext";
import RequireLoginStep from "./RequireLoginStep";

/* transfer flow */
import { TransferProvider } from "../context/TransferContext";
import TransferPage from "../pages/TransferPage";

/* ----------------- ProtectedRoute ----------------- */
function ProtectedRoute() {
  const loc = useLocation();
  return isAuthenticated() ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: loc }} />
  );
}

/* ----------------- PublicRoute ----------------- */
function PublicRoute({ children, redirectTo = "/app/dashboard" }) {
  const loc = useLocation();
  const [checking, setChecking] = React.useState(true);
  const [authed, setAuthed] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const maybe = isAuthenticated();
        const res = maybe && typeof maybe.then === "function" ? await maybe : maybe;
        if (!mounted) return;
        setAuthed(Boolean(res));
      } catch (err) {
        console.error("PublicRoute:isAuthenticated error:", err);
        if (!mounted) return;
        setAuthed(false);
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (checking) return <div style={{ padding: 24, textAlign: "center" }}>Checking authentication...</div>;
  if (authed) return <Navigate to={redirectTo} replace state={{ from: loc }} />;
  return children;
}

/* ----------------- NotFound ----------------- */
function NotFound() {
  return <div>404 Not Found</div>;
}

/* ----------------- Routes ----------------- */
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ---------- Public pages ---------- */}
        <Route index element={<SplashPage />} />
        <Route path="/welcome" element={<WelcomePage />} />

        {/* ---------- Registration (guest only) ---------- */}
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/register/otp" element={<PublicRoute><OtpRegisterPage /></PublicRoute>} />
        <Route path="/register/setpin" element={<PublicRoute><SetPinPage /></PublicRoute>} />

        {/* ---------- Login Flow (guest only) ---------- */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginFlowProvider>
                <LoginPage />
              </LoginFlowProvider>
            </PublicRoute>
          }
        >
          <Route index element={<LoginPhone />} />
          <Route path="otp" element={<RequireLoginStep step="otp"><OtpStage /></RequireLoginStep>} />
          <Route path="pin" element={<RequireLoginStep step="pin"><PinStage /></RequireLoginStep>} />
        </Route>

        {/* ---------- Protected /app routes ---------- */}
        <Route path="/app/*" element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="transactions" element={<HistoryTransactionPage />} />
          <Route path="topup" element={<TopUpPage />} />

          {/* ----------- Transfer Flow ----------- */}
          <Route
            path="transfer/*"
            element={
              <TransferProvider>
                <Routes>
                  <Route index element={<TransferPage />} />
                  <Route path="pin" element={<TransferPage />} />
                  <Route path="success" element={<TransferPage />} />
                </Routes>
              </TransferProvider>
            }
          />

          {/* ----------- Reset flow placeholder ----------- */}
          <Route path="reset">
            {/* add reset pages later */}
          </Route>
        </Route>

        {/* ---------- 404 ---------- */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
