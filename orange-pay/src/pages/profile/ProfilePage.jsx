// src/pages/ProfilePage.jsx
import React, { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PhoneLayoutBackground from "../../components/PhoneLayoutBackground";
import MobileShell from "../../components/layout/MobileShell";
import { FullSubmitButton } from "../../components/button/FullSubmitButton";
import WhiteCardContainer from "../../components/register/WhiteCardContainer";
import UserInfoCard from "../../components/account/userInfoCard";
import OrangeHeader from "../../components/register/OrangeHeader";
import ProfileImage from "../../components/account/ProfileImage";
import { clearTokens } from "../../services/auth/authService";
import { FullActionButton } from "../../components/button/FullActionButton";
import { useProfileContext } from "../../context/ProfileContext"; // ✅ use hook, not provider

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profileData, setProfileData } = useProfileContext(); // ✅ fixed usage

  const handleLogout = () => {
    clearTokens();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const getUserProfile = async () => {
      try {
        console.log("--- get user name ----");
        const response = await axios.get("/api/v1/user/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        const user = response.data.data;
        console.log("Fetched user:", user);

        setProfileData({
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          phoneVerified: user.phoneVerified,
          emailVerified: user.emailVerified,
        });
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };

    getUserProfile();
  }, []);

  return (
    <PhoneLayoutBackground>
      <MobileShell>
        <OrangeHeader />

        <WhiteCardContainer>
          <ProfileImage />

          <UserInfoCard
            name={profileData.name}
            email={profileData.email}
            phone={profileData.phoneNumber}
            phoneVerified={profileData.phoneVerified}
            emailVerified={profileData.emailVerified}
            emailVerifyLink="/app/verifyEmail"
            phoneVerifyLink="/app/verifyPhone"
          />

          <div className="mt-6 space-y-3">
            
            <FullActionButton onClick={() => navigate("/app/editProfile")}>
              Edit Data
            </FullActionButton>

            <FullActionButton onClick={handleLogout}>
              Keluar
            </FullActionButton>

          </div>
        </WhiteCardContainer>
      </MobileShell>
    </PhoneLayoutBackground>
  );
}
