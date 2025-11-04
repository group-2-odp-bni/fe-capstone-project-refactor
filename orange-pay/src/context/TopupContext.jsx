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
    walletName: "",
    walletId:"",
    amount:"",
    
    vaNumber:"",
    transactionRef:"",
    createdAt:"",
    expiresAt:"",


    
  });


//   {
//     "message": "Top-up initiated successfully",
//     "data": {
//         "transactionId": "af677787-14bf-453a-9ba7-a84de9eaa606",
//         "transactionRef": "20251104175162370751",
//         "virtualAccountId": "2aee37e6-020a-4e68-bf07-39b20e3aa71c",
//         "vaNumber": "7152818913158317",
//         "provider": "BNI_VA",
//         "status": "ACTIVE",
//         "amount": 1100000,
//         "expiresAt": "2025-11-05T13:22:57.1637594+07:00",
//         "createdAt": "2025-11-04T13:22:57.1262869+07:00",
//         "wallet": {
//             "id": "dce5451b-daa3-47a1-ac2e-6ba60aca4d63",
//             "name": null,
//             "type": null,
//             "userRole": "OWNER"
//         }
//     },
//     "timestamp": "2025-11-04T06:22:57.324260900Z"
// }

  const setTopupInfo = (data) => {
    setTopupData((prev) => ({ ...prev, ...data }));
  };

  return (
    <TopupContext.Provider value={{ topupData, setTopupData: setTopupInfo }}>
      {children}
    </TopupContext.Provider>
  );
};
