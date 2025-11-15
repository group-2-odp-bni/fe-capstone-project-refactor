// src/pages/ProfilePage.jsx
import React, { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import UserInfoCard from "../../components/account/userInfoCard";
import ProfileImage from "../../components/account/ProfileImage";
import { FullActionButton } from "../../components/button/FullActionButton";
import { useProfileContext } from "../../context/ProfileContext";
import View from "../../components/view/View";
import WhiteHeader from "../../components/register/WhiteHeader";
import ContentBox from "../../components/common/ContentBox";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profileData, setProfileData } = useProfileContext();

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
          profileImageUrl: user.profileImageUrl,
        });
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };

    getUserProfile();
    console.log(profileData.profileImageUrl)
  }, []);

  return (
    <View>
      <WhiteHeader title="Akun Saya" to="/app/account" />
      <ContentBox>
        <ProfileImage
          src={profileData.profileImageUrl}
          unhoverable={true}
        />

        <UserInfoCard
          name={profileData.name}
          email={profileData.email}
          phone={profileData.phoneNumber}
          phoneVerified={profileData.phoneVerified}
          emailVerified={profileData.emailVerified}
          emailVerifyLink="/app/verifyEmail"
          phoneVerifyLink="/app/verifyPhone"
        />

        <div className="mt-6">
          <FullActionButton onClick={() => navigate("/app/editProfile")}>
            Edit Data
          </FullActionButton>
        </div>

      </ContentBox>

    </View>

  );
}
