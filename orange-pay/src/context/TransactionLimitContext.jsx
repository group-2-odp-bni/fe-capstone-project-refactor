import React, { createContext, useContext, useState } from "react";

// Create context
const TransactionLimitContext = createContext();

// Custom hook for easy usage
export const useTransactionLimitContext = () => {
    const context = useContext(TransactionLimitContext);
    if (!context) {
        throw new Error("useTransactionLimitContext must be used within TransactionLimitProvider");
    }
    return context;
};

// Provider component
export const TransactionLimitProvider = ({ children }) => {
    const [limitData, setLimitData] = useState({
        dailyMaxRp: 0,
        enforceDaily: false,
        dailyRemainingRp: 0,

        weeklyMaxRp: 0,
        enforceWeekly: false,
        weeklyRemainingRp: 0,

        monthlyMaxRp: 0,
        enforceMonthly: false,
        monthlyRemainingRp: 0,
    });

    const updateLimitData = (data) => {
        setLimitData((prev) => ({ ...prev, ...data }));
    };

    return (
        <TransactionLimitContext.Provider value={{ limitData, setLimitData: updateLimitData }}>
            {children}
        </TransactionLimitContext.Provider>
    );
};
