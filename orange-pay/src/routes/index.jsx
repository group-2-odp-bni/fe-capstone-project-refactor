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
import ResetPhone from "../components/login/ResetPhone";
import ResetOtp from "../components/login/ResetOtp";
import ResetSetPin from "../components/login/ResetSetPin";

import DashboardPage from "../pages/DashboardPage";
import History from "../pages/History";
import { isAuthenticated } from "../services/authService";

function ProtectedRoute() {
  const loc = useLocation();
  return isAuthenticated() ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: loc }} />
  );
}

function NotFound() {
  return <div>404 Not Found</div>;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route index element={<SplashPage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/otp" element={<OtpRegisterPage />} />
        <Route path="/register/setpin" element={<SetPinPage />} />

        {/* Login flow */}
        <Route path="/login" element={<LoginPage />}>
          <Route index element={<LoginPhone />} />
          <Route path="otp" element={<OtpStage />} />
          <Route path="pin" element={<PinStage />} />
          <Route path="reset" element={<ResetPhone />} />
          <Route path="reset/otp" element={<ResetOtp />} />
          <Route path="reset/setpin" element={<ResetSetPin />} />
        </Route>

        {/* Protected: block everything under /app/* */}
        <Route path="/app/*" element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="history" element={<History />} /> 
          {/* Any other /app/... routes can go here */}
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
