// src/context/ProfileContext.jsx
import React, { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem("userData");
    return savedUser
      ? JSON.parse(savedUser)
      : {
          name: "Ahong",
          email: "rulfisyah34@gmail.com",
          phone: "0855-1411-3111",
          avatarEmoji: "👩‍💼",
        };
  });

  const [view, setView] = useState("profile");

  const updateUser = (updates) => {
    const newUser = { ...user, ...updates };
    setUser(newUser);
    sessionStorage.setItem("userData", JSON.stringify(newUser));
  };

  const logout = () => {
    // 🧹 Clear everything
    sessionStorage.clear();
    localStorage.clear();

    // 🧠 Reset context state
    setUser(null);
    setView("profile");

    // 🧭 Redirect to splash (which leads to welcome)
    navigate("/", { replace: true });
  };

  return (
    <ProfileContext.Provider value={{ user, updateUser, logout, view, setView }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
};
