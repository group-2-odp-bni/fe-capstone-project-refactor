import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<SplashPage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/otp" element={<OtpRegisterPage />} />
        <Route path="/register/setpin" element={<SetPinPage />} />

        <Route path="/login" element={<LoginPage />}>
          <Route index element={<LoginPhone />} />
          <Route path="otp" element={<OtpStage />} />
          <Route path="pin" element={<PinStage />} />
          <Route path="reset" element={<ResetPhone />} />
          <Route path="reset/otp" element={<ResetOtp />} />
          <Route path="reset/setpin" element={<ResetSetPin />} />
        </Route>

        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
