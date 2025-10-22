import React, { createContext, useContext, useState } from "react";

export const RegistrationContext = createContext(null);

export const useRegistrationContext = () => {
  const context = useContext(RegistrationContext);
  if (!context) throw new Error("Must be used within RegistrationProvider");
  return context;
};

export const RegistrationProvider = ({ children }) => {
  const [userData, setUserData] = useState({
    fullName: "",
    email: "",
  });

  const setRegistrationData = (data) => {
    setUserData((prev) => ({ ...prev, ...data }));
  };

  return (
    <RegistrationContext.Provider value={{ userData, setRegistrationData }}>
      {children}
    </RegistrationContext.Provider>
  );
};
