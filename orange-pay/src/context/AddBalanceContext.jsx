import React, { createContext, useContext, useState, useEffect } from "react";

// Create context
export const AddBalanceContext = createContext(null);

// Custom hook for consuming the context safely
export const useAddBalanceContext = () => {
  const context = useContext(AddBalanceContext);
  if (!context) throw new Error("useAddBalanceContext must be used within AddBalanceProvider");
  return context;
};

// Provider component
export const AddBalanceProvider = ({ children }) => {
  // Load from localStorage (if available)
  const storedData = localStorage.getItem("addBalanceData");
  const initialData = storedData
    ? JSON.parse(storedData)
    : {
        sourceWalletId: "",
        destinationWalletId: "",
        amount: 0,
      };

  const [addBalanceData, setAddBalanceData] = useState(initialData);

  // Save to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("addBalanceData", JSON.stringify(addBalanceData));
  }, [addBalanceData]);

  // Updater function
  const updateAddBalanceData = (data) => {
    setAddBalanceData((prev) => ({ ...prev, ...data }));
  };

  // Optional: a reset function
  const resetAddBalanceData = () => {
    const emptyData = { senderId: "", receiverId: "", amount: 0 };
    setAddBalanceData(emptyData);
    localStorage.removeItem("addBalanceData");
  };

  return (
    <AddBalanceContext.Provider
      value={{ addBalanceData, setAddBalanceData: updateAddBalanceData, resetAddBalanceData }}
    >
      {children}
    </AddBalanceContext.Provider>
  );
};
