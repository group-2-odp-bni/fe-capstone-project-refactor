// src/routes/index.jsx (full file — replace your current file with this)
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import SplashPage from "../pages/SplashPage";'='
import RegisterPage from "../pages/RegisterPage";
import OtpRegisterPage from "../pages/OtpRegisterPage";
import SetPinPage from "../pages/SetPinPage";
import WelcomePage from "../pages/WelcomePage";
import LoginPage from "../pages/LoginPage";

import LoginPhone from "../components/login/LoginPhone";
import OtpStage from "../components/login/OtpStage";
import PinStage from "../components/login/PinStage";
import ResetPhone from "../components/login/ResetPhone";
import ResetOtp from "../components/login/ResetOtp";
import ResetSetPin from "../components/login/ResetSetPin";
import ResetPin from "../components/login/ResetPin";
import ResetPinOtp from "../components/login/ResetPinOtp";

import DashboardPage from "../pages/DashboardPage";
import HistoryTransactionPage from "../pages/HistoryTransactionPage";
import TopUpPage from "../pages/TopUpPage";

import { isAuthenticated } from "../services/authService";

/* login flow context & step guard */
import { LoginFlowProvider } from "../context/LoginFlowContext";
import RequireLoginStep from "./RequireLoginStep";

/* ----------------- ProtectedRoute (keeps your existing pattern) ----------------- */
function ProtectedRoute() {
  const loc = useLocation();
  return isAuthenticated() ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: loc }} />
  );
}

/* ----------------- PublicRoute (guest-only pages) ----------------- */
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
        {/* Public pages (accessible by anyone) */}
        <Route index element={<SplashPage />} />
        <Route path="/welcome" element={<WelcomePage />} />

        {/* Registration pages — guest-only */}
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/register/otp" element={<PublicRoute><OtpRegisterPage /></PublicRoute>} />
        <Route path="/register/setpin" element={<PublicRoute><SetPinPage /></PublicRoute>} />

        {/* Login flow — guest-only (wrap parent so nested routes are protected by LoginFlowProvider) */}
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
          {/* index — enter phone */}
          <Route index element={<LoginPhone />} />
          {/* reset (forgot PIN) - enter phone to reset PIN */}
          <Route path="reset" element={<ResetPin />} />
          {/* reset OTP under login (reset flow) */}
          <Route path="reset/otp" element={<RequireLoginStep step="otp"><ResetPinOtp /></RequireLoginStep>} />
          {/* reset set-pin (after OTP) under login reset flow */}
          <Route path="reset/pin" element={<RequireLoginStep step="pin"><ResetSetPin /></RequireLoginStep>} />
          {/* OTP / PIN require login flow steps */}
          <Route path="otp" element={<RequireLoginStep step="otp"><OtpStage /></RequireLoginStep>} />
          <Route path="pin" element={<RequireLoginStep step="pin"><PinStage /></RequireLoginStep>} />
          {/* removed reset routes from here — reset is protected under /app/reset */}
        </Route>

        {/* Protected: block everything under /app/* */}
        <Route path="/app/*" element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="transactions" element={<HistoryTransactionPage />} />
          <Route path="topup" element={<TopUpPage />} />

          {/* ------------- Protected Reset flow ------------- 
              Reset pages require the user to be authenticated (sessionStorage token).
              URLs:
                /app/reset            -> ResetPhone
                /app/reset/otp        -> ResetOtp
                /app/reset/setpin     -> ResetSetPin
          */}
          <Route path="reset">
            
          </Route>

          {/* Any other /app/... routes can go here */}
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
