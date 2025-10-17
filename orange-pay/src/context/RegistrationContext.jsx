import React, { createContext, useState, useContext, useCallback } from "react";

export const RegistrationContext = createContext(null);

export const useRegistrationContext = () => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error(
      "useRegistrationContext must be used within a RegistrationProvider"
    );
  }
  return context;
};

export const RegistrationProvider = ({ children }) => {
  const [userData, setUserData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    otp: "",
    pin: "",
  });

  const [currentStep, setCurrentStep] = useState("DETAILS");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const setRegistrationData = useCallback((data) => {
    setUserData((prev) => ({ ...prev, ...data }));
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep === "DETAILS") setCurrentStep("OTP");
    else if (currentStep === "OTP") setCurrentStep("PIN");
    else if (currentStep === "PIN") setCurrentStep("SUCCESS");
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep === "PIN") setCurrentStep("OTP");
    else if (currentStep === "OTP") setCurrentStep("DETAILS");
  }, [currentStep]);

  const resetRegistration = useCallback(() => {
    setUserData({ fullName: "", email: "", phoneNumber: "", otp: "", pin: "" });
    setCurrentStep("DETAILS");
    setLoading(false);
    setError(null);
  }, []);

  const value = {
    userData,
    setRegistrationData,
    currentStep,
    nextStep,
    prevStep,
    loading,
    setLoading,
    error,
    setError,
    resetRegistration,
  };

  return (
    <RegistrationContext.Provider value={value}>
      {children}
    </RegistrationContext.Provider>
  );
};
