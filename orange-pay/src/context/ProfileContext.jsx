import React, { createContext, useContext, useState } from "react";

const ProfileContext = createContext();

export const useProfileContext = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useProfileContext must be used within ProfileProvider");
  return context;
};

export const ProfileProvider = ({ children }) => {
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
  });

  const updateProfileData = (data) => {
    setProfileData((prev) => ({ ...prev, ...data }));
  };

  return (
    <ProfileContext.Provider value={{ profileData, setProfileData: updateProfileData }}>
      {children}
    </ProfileContext.Provider>
  );
};
