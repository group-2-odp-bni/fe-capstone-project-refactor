// src/routes/RequireRegisterStep.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useRegistrationContext } from "../context/RegistrationContext";

export default function RequireRegisterStep({ step, children }) {
  const location = useLocation();
  const { userData } = useRegistrationContext();

  // Step order: register → otp → setpin
  const order = { register: 0, otp: 1, setpin: 2 };
  const required = order[step] ?? 0;

  // Determine what user has done so far
//   const hasPhone = Boolean(userData?.phoneNumber);
//   const hasOtp = Boolean(userData?.otpVerified); // you can set this manually after verify

  const hasPhone = true
  const hasOtp = true

  let currentStep = "register";
  if (hasPhone) currentStep = "otp";
  if (hasOtp) currentStep = "setpin";

  const have = order[currentStep] ?? 0;

  if (have >= required) return children;

  // Redirect user back to the proper step
  if (have === 0) return <Navigate to="/register" replace state={{ from: location }} />;
  if (have === 1) return <Navigate to="/register/otp" replace state={{ from: location }} />;
  return <Navigate to="/register" replace state={{ from: location }} />;
}
