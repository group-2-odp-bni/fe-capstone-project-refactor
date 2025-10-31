import React, { createContext, useContext, useState } from "react";

export const LoginContext = createContext(null);

export const useLoginContext = () => {
  const context = useContext(LoginContext);
  if (!context) throw new Error("Must be used within LoginProvider");
  return context;
};

export const LoginProvider = ({ children }) => {
  const [loginData, setLoginData] = useState({
    phoneNumber: "",
    stateToken: "",
    accessToken: "",
    refreshToken: "",
  });

  const updateLoginData = (data) => {
    setLoginData((prev) => ({ ...prev, ...data }));
  };

  return (
    <LoginContext.Provider value={{ loginData, setLoginData: updateLoginData }}>
      {children}
    </LoginContext.Provider>
  );
};
