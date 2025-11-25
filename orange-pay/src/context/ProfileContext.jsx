import React, { createContext, useContext, useState, useCallback } from "react";

const ProfileContext = createContext();

export const useProfileContext = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useProfileContext must be used within ProfileProvider");
  return context;
};

export const ProfileProvider = ({ children }) => {
  const [profileData, setProfileDataState] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    phoneVerified: false,
    emailVerified: false,
    profileImageUrl: "",
  });

  // Merge setter (optional, but keep it)
  const updateProfileData = useCallback((data) => {
    setProfileDataState((prev) => ({ ...prev, ...data }));
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        profileData,

        // EXPOSE the REAL setter (for controlled inputs)
        setProfileData: setProfileDataState,

        // OPTIONAL merge helper (use only when you need merging)
        updateProfileData,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};
