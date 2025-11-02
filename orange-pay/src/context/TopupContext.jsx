import React, { createContext, useContext, useState } from "react";

export const TopupContext = createContext(null);

export const useTopupContext = () => {
  const context = useContext(TopupContext);
  if (!context) throw new Error("Must be used within TopupProvider");
  return context;
};

export const TopupProvider = ({ children }) => {
  const [topupData, setTopupData] = useState({
    provider: "",
    providerName: "",
    minAmount: "",
    maxAmount: "",
    feeAmount: "",
    feePercentage: "",
    iconUrl: "",
    displayOrder: "",
  });

  const setTopupInfo = (data) => {
    setTopupData((prev) => ({ ...prev, ...data }));
  };

  return (
    <TopupContext.Provider value={{ topupData, setTopupInfo }}>
      {children}
    </TopupContext.Provider>
  );
};
